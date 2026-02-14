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
                price_at_period: plan.price
            })
            .select('id')
            .single();

        if (subError) throw subError;

        // 4. Call Zentripay
        // GAMBIARRA SOLICITADA: Enviar dados genéricos para não exigir cadastro complexo do cliente.
        // O gateway exige CPF e Telefone válidos.
        const pixResponse = await zentripay.createPixTransaction({
            amount: plan.price,
            paymentType: 'PIX',
            external_reference: subscription.id,
            customer: {
                name: profile?.full_name || 'Cliente VerifyAds',
                email: user.email || 'cliente@verifyads.com', // Mantém email real para receipt se possível
                document: '00000000000', // CPF Genérico/Nulo (Muitos gateways aceitam 000... ou 111...)
                phone: '11999999999'      // Telefone Genérico
            }
        });

        // 5. Update Subscription with Gateway ID
        await supabase
            .from('subscriptions')
            .update({ gateway_id: pixResponse.data.idTransaction })
            .eq('id', subscription.id);

        return NextResponse.json({
            success: true,
            pix: {
                code: pixResponse.data.paymentCode,
                qr_image: pixResponse.data.qrcode_image
            },
            subscriptionId: subscription.id
        });

    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Error'
        }, { status: 500 });
    }
}
