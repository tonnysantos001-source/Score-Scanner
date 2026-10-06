import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin();
        const supabase = createAdminClient();

        const body = await request.json();
        const {
            userId,
            durationType = 'hours', // 'hours' | 'days' | 'months' | 'lifetime'
            durationValue = 1,
            planId,
        } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
        }

        // 1. Obter ou validar plano
        let targetPlanId = planId;
        if (!targetPlanId) {
            const { data: defaultPlan } = await supabase
                .from('plans')
                .select('id, name')
                .eq('is_active', true)
                .order('price', { ascending: false }) // Prioriza plano mais completo
                .limit(1)
                .single();
            targetPlanId = defaultPlan?.id;
        }

        // 2. Calcular data de expiração
        const now = new Date();
        let expiresAt: string | null = null;
        let labelDuracao = '';

        if (durationType === 'lifetime') {
            expiresAt = null;
            labelDuracao = 'Acesso Definitivo (Ilimitado)';
        } else if (durationType === 'hours') {
            const d = new Date(now.getTime() + durationValue * 60 * 60 * 1000);
            expiresAt = d.toISOString();
            labelDuracao = `${durationValue} hora(s)`;
        } else if (durationType === 'days') {
            const d = new Date(now.getTime() + durationValue * 24 * 60 * 60 * 1000);
            expiresAt = d.toISOString();
            labelDuracao = `${durationValue} dia(s)`;
        } else if (durationType === 'months') {
            const d = new Date(now);
            d.setMonth(d.getMonth() + durationValue);
            expiresAt = d.toISOString();
            labelDuracao = `${durationValue} mês(es)`;
        } else {
            return NextResponse.json({ error: 'Tipo de duração inválido' }, { status: 400 });
        }

        // 3. Cancelar subscriptions anteriores pendentes ou ativas
        await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', userId)
            .in('status', ['active', 'trialing', 'pending', 'unpaid']);

        // 4. Inserir nova subscription aprovada
        const { data: newSub, error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_id: targetPlanId,
                status: 'active',
                price_at_period: 0,
                currency: 'BRL',
                payment_method: 'admin_approval',
                current_period_start: now.toISOString(),
                current_period_end: expiresAt,
                metadata: {
                    duration_type: durationType,
                    duration_value: durationValue,
                    approved_by: admin.id,
                    approved_at: now.toISOString(),
                    label_duracao: labelDuracao,
                },
            })
            .select()
            .single();

        if (subError) {
            console.error('Erro ao criar assinatura:', subError);
            throw subError;
        }

        // 5. Atualizar perfil
        await supabase
            .from('profiles')
            .update({
                is_active: true,
                updated_at: now.toISOString(),
            })
            .eq('id', userId);

        // 6. Desbanir no Supabase Auth e atualizar metadados para propagar no JWT do usuário
        try {
            await supabase.auth.admin.updateUserById(userId, {
                ban_duration: 'none',
                user_metadata: {
                    approval_status: 'approved',
                    access_expires_at: expiresAt,
                    duration_type: durationType,
                    duration_value: durationValue,
                },
            });
        } catch (metaErr) {
            console.warn('Erro ao desbanir e atualizar user_metadata:', metaErr);
        }

        const expiresAtFormatted = expiresAt
            ? new Date(expiresAt).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
            : 'Definitivo / Ilimitado';

        return NextResponse.json({
            success: true,
            message: `Acesso liberado com sucesso: ${labelDuracao}!`,
            expiresAt,
            expiresAtFormatted,
            subscription: newSub,
        });

    } catch (error) {
        const err = error as Error;
        console.error('Error approving user:', err);
        return NextResponse.json({ error: err.message || 'Erro ao aprovar usuário' }, { status: 500 });
    }
}
