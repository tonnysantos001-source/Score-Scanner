import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                authenticated: false,
                hasAccess: false,
                approvalStatus: 'unauthenticated',
            }, { status: 401 });
        }

        const adminDb = createAdminClient();

        // 1. Buscar perfil do usuário
        const { data: profile } = await adminDb
            .from('profiles')
            .select('role, is_active, full_name, email')
            .eq('id', user.id)
            .single();

        const role = profile?.role || user.user_metadata?.role || 'user';
        const isAdmin = role === 'admin' || role === 'superadmin';

        if (isAdmin) {
            return NextResponse.json({
                authenticated: true,
                isAdmin: true,
                hasAccess: true,
                approvalStatus: 'approved',
                isLifetime: true,
                accessExpiresAt: null,
                accessExpiresAtFormatted: 'Acesso Ilimitado (Administrador)',
                role,
            });
        }

        // Se perfil foi explicitamente bloqueado/inativado
        if (profile && profile.is_active === false) {
            return NextResponse.json({
                authenticated: true,
                isAdmin: false,
                hasAccess: false,
                approvalStatus: 'blocked',
                role,
            });
        }

        // 2. Buscar assinatura / liberação mais recente
        const { data: subscription } = await adminDb
            .from('subscriptions')
            .select('id, status, current_period_start, current_period_end, metadata, plans(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Se não tiver assinatura ou status for 'pending'
        if (!subscription || subscription.status === 'pending') {
            return NextResponse.json({
                authenticated: true,
                isAdmin: false,
                hasAccess: false,
                approvalStatus: 'pending',
                role,
            });
        }

        if (subscription.status === 'canceled') {
            return NextResponse.json({
                authenticated: true,
                isAdmin: false,
                hasAccess: false,
                approvalStatus: 'blocked',
                role,
            });
        }

        // Se status for 'active' ou 'trialing'
        if (subscription.status === 'active' || subscription.status === 'trialing') {
            const periodEnd = subscription.current_period_end;

            // Se current_period_end for null -> Definitivo / Vitalício
            if (!periodEnd) {
                return NextResponse.json({
                    authenticated: true,
                    isAdmin: false,
                    hasAccess: true,
                    approvalStatus: 'approved',
                    isLifetime: true,
                    accessExpiresAt: null,
                    accessExpiresAtFormatted: 'Acesso Definitivo',
                    planName: (subscription.plans as unknown as { name: string })?.name || 'Acesso Liberado',
                    role,
                });
            }

            const endDate = new Date(periodEnd);
            const now = new Date();

            if (endDate > now) {
                const diffMs = endDate.getTime() - now.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const diffDays = Math.floor(diffHours / 24);

                let remainingFormatted = '';
                if (diffDays >= 1) {
                    remainingFormatted = `${diffDays} dia(s) restante(s)`;
                } else if (diffHours >= 1) {
                    remainingFormatted = `${diffHours} hora(s) e ${diffMinutes} minuto(s)`;
                } else {
                    remainingFormatted = `${diffMinutes} minuto(s) restante(s)`;
                }

                return NextResponse.json({
                    authenticated: true,
                    isAdmin: false,
                    hasAccess: true,
                    approvalStatus: 'approved',
                    isLifetime: false,
                    accessExpiresAt: periodEnd,
                    accessExpiresAtFormatted: endDate.toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    remainingFormatted,
                    planName: (subscription.plans as unknown as { name: string })?.name || 'Acesso Liberado',
                    role,
                });
            } else {
                // Expirou!
                return NextResponse.json({
                    authenticated: true,
                    isAdmin: false,
                    hasAccess: false,
                    approvalStatus: 'expired',
                    isExpired: true,
                    accessExpiresAt: periodEnd,
                    accessExpiresAtFormatted: endDate.toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    role,
                });
            }
        }

        return NextResponse.json({
            authenticated: true,
            isAdmin: false,
            hasAccess: false,
            approvalStatus: 'pending',
            role,
        });


    } catch (error) {
        console.error('Error in /api/auth/me/status:', error);
        return NextResponse.json({
            authenticated: false,
            hasAccess: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}
