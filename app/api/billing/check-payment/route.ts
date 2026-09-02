// app/api/billing/check-payment/route.ts
// Retorna o status de uma assinatura para verificar se o Pix foi pago

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subscriptionId = searchParams.get('subscriptionId');

        if (!subscriptionId) {
            return NextResponse.json({ error: 'subscriptionId obrigatório' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('id', subscriptionId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ status: data.status });
    } catch (error) {
        const err = error as Error;
        console.error('[Billing] check-payment error:', err.message);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
