// app/api/webhooks/zentripay/route.ts
// Recebe notificações automáticas da ZentriPay quando pagamento é confirmado

import { createAdminClient } from '@/lib/supabase/admin';
import { ZentriWebhookPayload } from '@/lib/zentripay/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json() as ZentriWebhookPayload;

        console.log('[Webhook ZentriPay]', payload.type, payload.status, payload.external_reference);

        // Só processa webhooks de transação
        if (payload.type !== 'transaction') {
            return NextResponse.json({ received: true });
        }

        const supabase = createAdminClient();

        if (payload.status === 'paid') {
            // Busca a subscription pelo external_reference (nosso subscription.id)
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .select('id, user_id, plan_id, status')
                .eq('id', payload.external_reference)
                .single();

            if (error || !subscription) {
                console.error('[Webhook] Subscription não encontrada:', payload.external_reference);
                return NextResponse.json({ received: true });
            }

            // Já estava ativo — evita duplicar
            if (subscription.status === 'active') {
                return NextResponse.json({ received: true });
            }

            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setDate(periodEnd.getDate() + 30);

            // Ativa a assinatura
            await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    external_id: payload.transaction_id,
                    updated_at: now.toISOString(),
                })
                .eq('id', subscription.id);

            console.log('[Webhook] Assinatura ativada:', subscription.id, '→ user:', subscription.user_id);
        }

        if (payload.status === 'refunded' || payload.status === 'chargeback' || payload.status === 'failed') {
            await supabase
                .from('subscriptions')
                .update({ status: 'canceled', updated_at: new Date().toISOString() })
                .eq('id', payload.external_reference);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Webhook ZentriPay] Erro:', error);
        // Sempre retorna 200 para o gateway não retentar
        return NextResponse.json({ received: true });
    }
}
