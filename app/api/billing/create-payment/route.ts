import { requireAuth } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ZentripayClient } from '@/lib/zentripay/client';
import { AlphaCashClient } from '@/lib/alphacash/client';
import { generateCPF, generatePhone, generateName } from '@/lib/utils/random-generator';
import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://score-scanner-7q2s.vercel.app';

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
        const customerEmail = profile?.email || user.email || `user+${user.id.slice(0, 8)}@verifyads.net`;

        // 4. Cria subscription local (unpaid)
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

        // 5. Determina o gateway de pagamento ativo no banco
        const { data: settings } = await supabase
            .from('gateway_settings')
            .select('*');

        const activeRow = settings?.find(s => s.provider === 'active_gateway');
        const activeProvider = activeRow?.api_key || 'zentripay';

        let qrCode = '';
        let qrCodeBase64 = null;
        let externalId = '';
        let expiresAt = null;

        // Dados específicos do Pix Manual se aplicável
        let manualPixKey = '';
        let manualHolderName = '';
        let manualInstructions = '';

        if (activeProvider === 'zentripay') {
            const zentriRow = settings?.find(s => s.provider === 'zentripay');
            const token = zentriRow?.api_key || process.env.ZENTRIPAY_TOKEN || '';
            const zentriClient = new ZentripayClient(token);

            const webhookUrl = `${BASE_URL}/api/webhooks/zentripay`;

            const pixResponse = await zentriClient.createPixTransaction({
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
                postBackUrl: webhookUrl,
            });

            qrCode = pixResponse.paymentCode;
            qrCodeBase64 = null;
            externalId = pixResponse.idTransaction;
            expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

        } else if (activeProvider === 'alphacash') {
            const alphaRow = settings?.find(s => s.provider === 'alphacash');
            const publicKey = alphaRow?.api_key || '';
            const secretKey = alphaRow?.api_secret || '';
            const isProd = alphaRow?.is_production || false;
            const apiHost = isProd ? 'api.shieldtecnologia.com' : 'api.shieldtecnologia.com'; // O provedor whitelabel usa esse host

            const alphaClient = new AlphaCashClient(publicKey, secretKey, `https://${apiHost}`);
            const webhookUrl = `${BASE_URL}/api/webhooks/alphacash`;

            const pixResponse = await alphaClient.createPixTransaction({
                amount: Math.round(Number(plan.price) * 100), // AlphaCash espera centavos!
                customer: {
                    name: customerName,
                    email: customerEmail,
                    document: {
                        number: customerDoc,
                        type: customerDoc.length === 14 ? 'cnpj' : 'cpf',
                    }
                },
                items: [
                    {
                        title: `Plano ${plan.name} — VerifiAds`,
                        unitPrice: Math.round(Number(plan.price) * 100),
                        quantity: 1,
                        tangible: false,
                    }
                ],
                externalRef: subscription.id,
                postbackUrl: webhookUrl,
            });

            qrCode = pixResponse.pix?.qrcode || '';
            externalId = String(pixResponse.id);
            expiresAt = pixResponse.pix?.expirationDate 
                ? new Date(pixResponse.pix.expirationDate).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Fallback 24h

        } else if (activeProvider === 'manual') {
            const manualRow = settings?.find(s => s.provider === 'manual');
            manualPixKey = manualRow?.api_key || '';
            manualHolderName = manualRow?.api_secret || '';
            manualInstructions = manualRow?.webhook_secret || '';
            
            qrCode = manualPixKey; // Exibimos a chave Pix como código copia/cola principal
            externalId = `manual_pending_${subscription.id.slice(0, 8)}`;
            expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 dias para pagamento manual
        }

        // 6. Atualiza a assinatura com os dados obtidos
        await supabase
            .from('subscriptions')
            .update({
                external_id: externalId,
                pix_qr_code: qrCode,
                pix_qr_code_base64: qrCodeBase64,
                pix_expires_at: expiresAt,
            })
            .eq('id', subscription.id);

        return NextResponse.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                qrCode,                     // Código copia/cola ou chave Pix
                qrCodeBase64,               // QR code em imagem base64 (só ZentriPay)
                planName: plan.name,
                amount: plan.price,
                provider: activeProvider,   // 'zentripay' | 'alphacash' | 'manual'
                manual: activeProvider === 'manual' ? {
                    pixKey: manualPixKey,
                    holderName: manualHolderName,
                    instructions: manualInstructions,
                } : null,
            },
        });

    } catch (error) {
        const err = error as Error;
        console.error('[Billing] create-payment error:', err.message);
        return NextResponse.json({ error: err.message || 'Falha ao criar pagamento' }, { status: 500 });
    }
}
