// app/api/admin/users/route.ts
// Protected admin API route with requireAdmin()

import { requireAdmin } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireAdmin();
        const supabase = createAdminClient();

        // 1. Buscar todos os perfis
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Buscar todas as assinaturas recentes para enriquecer
        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('id, user_id, status, current_period_start, current_period_end, metadata, plans(id, name, price)')
            .order('created_at', { ascending: false });

        // Mapear a assinatura mais recente por usuário
        const subByUser = new Map<string, any>();
        if (subscriptions) {
            for (const sub of subscriptions) {
                if (!subByUser.has(sub.user_id)) {
                    subByUser.set(sub.user_id, sub);
                }
            }
        }

        const now = new Date();

        const enrichedUsers = (users || []).map(u => {
            const sub = subByUser.get(u.id);
            const isUserAdmin = u.role === 'admin' || u.role === 'superadmin';

            let approvalStatus = 'pending';
            let isExpired = false;
            let isLifetime = false;
            let remainingFormatted = '';

            if (isUserAdmin) {
                approvalStatus = 'approved';
                isLifetime = true;
                remainingFormatted = 'Vitalício (Admin)';
            } else if (!u.is_active || sub?.status === 'canceled') {
                approvalStatus = 'blocked';
                remainingFormatted = 'Acesso Bloqueado';
            } else if (!sub || sub.status === 'pending') {
                approvalStatus = 'pending';
                remainingFormatted = 'Aguardando Aprovação';
            } else if (sub.status === 'active' || sub.status === 'trialing') {
                if (!sub.current_period_end) {
                    approvalStatus = 'approved';
                    isLifetime = true;
                    remainingFormatted = 'Acesso Vitalício';
                } else {
                    const endDate = new Date(sub.current_period_end);
                    if (endDate > now) {
                        approvalStatus = 'approved';
                        isExpired = false;

                        const diffMs = endDate.getTime() - now.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        const diffDays = Math.floor(diffHours / 24);

                        if (diffDays >= 1) {
                            remainingFormatted = `${diffDays}d ${diffHours % 24}h restantes`;
                        } else if (diffHours >= 1) {
                            remainingFormatted = `${diffHours}h ${diffMinutes}m restantes`;
                        } else {
                            remainingFormatted = `${Math.max(1, diffMinutes)}m restantes`;
                        }
                    } else {
                        approvalStatus = 'expired';
                        isExpired = true;
                        remainingFormatted = `Expirou em ${endDate.toLocaleDateString('pt-BR')} às ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                    }
                }
            }

            return {
                ...u,
                approval_status: approvalStatus,
                is_expired: isExpired,
                is_lifetime: isLifetime,
                remaining_formatted: remainingFormatted,
                subscription: sub ? {
                    id: sub.id,
                    status: sub.status,
                    current_period_start: sub.current_period_start,
                    current_period_end: sub.current_period_end,
                    plan_name: sub.plans?.name || 'Acesso Liberado',
                    plan_id: sub.plans?.id,
                    metadata: sub.metadata,
                } : undefined,
            };
        });

        return NextResponse.json(enrichedUsers);
    } catch (error) {
        const err = error as Error;

        if (err.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (err.message === 'FORBIDDEN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        console.error('[API Admin Users] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const admin = await requireAdmin();
        const { userId, role } = await request.json();

        const supabase = createAdminClient();

        if (userId === admin.id) {
            return NextResponse.json(
                { error: 'Você não pode alterar sua própria role' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // Atualizar user_metadata no auth
        try {
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { role }
            });
        } catch (e) {
            console.warn('Erro ao atualizar metadata de auth:', e);
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        const err = error as Error;
        return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await requireAdmin();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
        }

        if (userId === admin.id) {
            return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Excluir do Supabase Auth (cascata para profiles e subscriptions)
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        if (authDeleteError) {
            // Se falhar no auth, tenta apagar no profile diretamente
            await supabase.from('profiles').delete().eq('id', userId);
        }

        return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (error) {
        const err = error as Error;
        return NextResponse.json({ error: err.message || 'Erro ao excluir usuário' }, { status: 500 });
    }
}
