// app/api/billing/create-payment/route.ts
// Cria transação PIX avulsa via ZentriPay e retorna QR code + código copia/cola

import { requireAuth } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { zentripay } from '@/lib/zentripay/client';
import { generateCPF, generatePhone, generateName } from '@/lib/utils/random-generator';
import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifiads.com';
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/zentripay`;

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const supabase = createAdminClient();
        const body = await request.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json({ error: 'planId obrigatório' }, { status: 400 });
        }

        // 1. Busca o plano
        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .eq('is_active', true)
            .single();

        if (!plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
        }

        // 2. Cancela subscriptions pendentes anteriores
        await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', user.id)
            .in('status', ['unpaid', 'pending']);

        // 3. Dados do perfil (fallback gerado automaticamente)
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, document, phone')
            .eq('id', user.id)
            .single();

        const customerName = profile?.full_name || generateName();
        const customerDoc = (profile?.document || generateCPF()).replace(/\D/g, '');
        const customerPhone = (profile?.phone || generatePhone()).replace(/\D/g, '');
        const customerEmail = profile?.email || user.email || `user+${user.id.slice(0, 8)}@verifiads.com`;

        // 4. Cria subscription local (pending)
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan_id: plan.id,
                status: 'unpaid',
                price_at_period: plan.price,
                currency: 'BRL',
                payment_method: 'pix',
            })
            .select()
            .single();

        if (subError || !subscription) {
            throw new Error('Falha ao criar subscription');
        }

        // 5. Cria transação PIX avulsa (retorna paymentCode inline)
        const pixResponse = await zentripay.createPixTransaction({
            amount: Number(plan.price),
            provider: 'v2',
            method: 'pix',
            customer: {
                name: customerName,
                email: customerEmail,
                document: customerDoc,
                phone: customerPhone,
            },
            externalReference: subscription.id,
            productName: `Plano ${plan.name} — VerifiAds`,
            postBackUrl: WEBHOOK_URL,
        });

        // 6. Salva ID da transação
        await supabase
            .from('subscriptions')
            .update({
                external_id: pixResponse.idTransaction,
                pix_qr_code: pixResponse.paymentCode,
                pix_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
            })
            .eq('id', subscription.id);

        return NextResponse.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                paymentCode: pixResponse.paymentCode,      // Código copia/cola PIX
                planName: plan.name,
                amount: plan.price,
            },
        });

    } catch (error) {
        const err = error as Error;
        console.error('[Billing] create-payment error:', err.message);
        return NextResponse.json({ error: err.message || 'Falha ao criar pagamento' }, { status: 500 });
    }
}
