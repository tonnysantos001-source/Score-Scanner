import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zentripay } from '@/lib/zentripay/client';

export async function POST(request: NextRequest) {
    try {
        const { planId } = await request.json();
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Plan Details
        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // 3. Create Pending Subscription Record
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan_id: plan.id,
                status: 'pending',
                price_at_period: plan.price,
            })
            .select('id')
            .single();

        if (subError) throw subError;

        // 4. Call ZentriPay — payload correto conforme documentação v2
        const pixResponse = await zentripay.createPixTransaction({
            amount: plan.price,
            provider: 'v2',
            method: 'pix',
            externalReference: subscription.id,
            customer: {
                name: profile?.full_name || 'Cliente VerifiAds',
                email: user.email || 'cliente@verifiads.com',
                document: '00000000191', // CPF de teste válido
                phone: '11999999999',
            },
        });

        // 5. Update Subscription with Gateway ID
        await supabase
            .from('subscriptions')
            .update({ external_id: pixResponse.idTransaction })
            .eq('id', subscription.id);

        return NextResponse.json({
            success: true,
            pix: {
                code: pixResponse.paymentCode,
                qr_image: null,
            },
            subscriptionId: subscription.id,
        });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Checkout error:', err);
        return NextResponse.json({
            success: false,
            error: err.message || 'Internal Error',
        }, { status: 500 });
    }
}
