import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZentriWebhookPayload } from '@/lib/zentripay/types';

export async function POST(request: NextRequest) {
    try {
        // Obter payload
        const payload: ZentriWebhookPayload = await request.json();

        console.log('Zentripay Webhook received:', payload);

        // Validar status
        if (payload.status !== 'paid') {
            console.log(`Payment status is ${payload.status}, ignoring activation.`);
            return NextResponse.json({ received: true });
        }

        const subscriptionId = payload.external_reference;

        if (!subscriptionId) {
            console.error('Webhook payload missing external_reference (subscription_id)');
            return NextResponse.json({ error: 'Missing external_reference' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Buscar assinatura para pegar o plan_id e user_id
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('id', subscriptionId)
            .single();

        if (subError || !subscription) {
            console.error('Subscription not found for ID:', subscriptionId);
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // 2. Atualizar status da assinatura
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 mês de duração

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                current_period_start: currentPeriodStart.toISOString(),
                current_period_end: currentPeriodEnd.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionId);

        if (updateError) {
            throw updateError;
        }

        console.log(`Subscription ${subscriptionId} activated for user ${subscription.user_id}`);

        return NextResponse.json({ success: true, message: 'Subscription activated' });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
