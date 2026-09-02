// app/api/webhooks/alphacash/route.ts
// Recebe notificações automáticas da AlphaCash quando o pagamento é confirmado

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

interface AlphaCashWebhookPayload {
    type: string;
    objectId: string;
    url: string;
    data: {
        id: number;
        status: string;
        externalRef: string;
        amount: number;
        paymentMethod: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json() as AlphaCashWebhookPayload;

        console.log('[Webhook AlphaCash]', payload.type, payload.data?.status, payload.data?.externalRef);

        // Só processa webhooks de transação
        if (payload.type !== 'transaction' || !payload.data) {
            return NextResponse.json({ received: true });
        }

        const supabase = createAdminClient();
        const { status, externalRef, id: transactionId } = payload.data;

        if (status === 'paid' || status === 'approved') {
            // Busca a subscription pelo externalRef (nosso subscription.id)
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .select('id, user_id, plan_id, status')
                .eq('id', externalRef)
                .single();

            if (error || !subscription) {
                console.error('[Webhook AlphaCash] Subscription não encontrada:', externalRef);
                return NextResponse.json({ received: true });
            }

            // Já estava ativa — evita duplicar
            if (subscription.status === 'active') {
                return NextResponse.json({ received: true });
            }

            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setDate(periodEnd.getDate() + 30);

            // Ativa a assinatura
            const { error: updateErr } = await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    external_id: String(transactionId),
                    updated_at: now.toISOString(),
                })
                .eq('id', subscription.id);

            if (updateErr) {
                console.error('[Webhook AlphaCash] Erro ao atualizar assinatura:', updateErr);
                throw updateErr;
            }

            console.log('[Webhook AlphaCash] Assinatura ativada:', subscription.id, '→ user:', subscription.user_id);
        }

        if (status === 'refunded' || status === 'chargeback' || status === 'refused' || status === 'cancelled') {
            const { error: cancelErr } = await supabase
                .from('subscriptions')
                .update({ status: 'canceled', updated_at: new Date().toISOString() })
                .eq('id', externalRef);
            
            if (cancelErr) {
                console.error('[Webhook AlphaCash] Erro ao cancelar assinatura:', cancelErr);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Webhook AlphaCash] Erro:', error);
        // Retorna status 200 para o gateway para evitar retentativas desnecessárias
        return NextResponse.json({ received: true });
    }
}
