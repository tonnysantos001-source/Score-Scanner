// app/api/billing/create-payment/route.ts
// Create PIX payment via ZentriPay

import { requireAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { ZentripayClient } from '@/lib/zentripay/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const supabase = await createClient();
        const body = await request.json();

        const { planId } = body;

        if (!planId) {
            return NextResponse.json(
                { error: 'Plan ID required' },
                { status: 400 }
            );
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('name', planId.charAt(0).toUpperCase() + planId.slice(1))
            .eq('is_active', true)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: 'Plan not found' },
                { status: 404 }
            );
        }

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Get gateway settings
        const { data: settings, error: settingsError } = await supabase
            .rpc('get_gateway_settings')
            .single();

        if (!settings || settingsError) {
            return NextResponse.json(
                { error: 'Gateway not configured' },
                { status: 500 }
            );
        }

        // TypeScript types for RPC response
        const gatewaySettings = settings as { api_key: string; api_secret: string };

        // Create subscription record (pending payment)
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan_id: plan.id,
                status: 'unpaid',
                price_at_period: plan.price,
                currency: plan.currency,
                payment_method: 'pix',
            })
            .select()
            .single();

        if (subError || !subscription) {
            throw new Error('Failed to create subscription');
        }

        // Initialize ZentriPay client
        const zentripay = new ZentripayClient(gatewaySettings.api_key);

        // Create PIX payment
        const payment = await zentripay.createPixTransaction({
            amount: Number(plan.price),
            paymentType: 'PIX',
            customer: {
                name: profile?.full_name || 'Cliente',
                email: profile?.email || user.email,
                document: '00000000000', // TODO: Get from user profile
                phone: '11999999999', // TODO: Get from user profile
            },
            external_reference: subscription.id,
        });

        if (!payment.success) {
            throw new Error('Failed to create payment');
        }

        // Update subscription with PIX data
        await supabase
            .from('subscriptions')
            .update({
                external_id: payment.data.idTransaction,
                pix_qr_code: payment.data.paymentCode,
                pix_qr_code_base64: payment.data.qrcode_image || '',
                pix_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15min
            })
            .eq('id', subscription.id);

        return NextResponse.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                paymentId: payment.data.idTransaction,
                qrCode: payment.data.paymentCode,
                qrCodeBase64: payment.data.qrcode_image,
                amount: plan.price,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
        });
    } catch (error) {
        const err = error as Error;

        if (process.env.NODE_ENV === 'development') {
            console.error('[Billing] Create payment error:', err);
        }

        return NextResponse.json(
            { error: err.message || 'Failed to create payment' },
            { status: 500 }
        );
    }
}
