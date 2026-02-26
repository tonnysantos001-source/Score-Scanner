// app/api/admin/users/grant-trial/route.ts
// Admin: libera trial gratuito para um usuário

import { requireAdmin } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        await requireAdmin();
        const supabase = createAdminClient();
        const { userId, planId, trialDays = 7 } = await request.json();

        if (!userId || !planId) {
            return NextResponse.json({ error: 'userId e planId são obrigatórios' }, { status: 400 });
        }

        // Valida plano
        const { data: plan } = await supabase
            .from('plans')
            .select('id, name, price')
            .eq('id', planId)
            .single();

        if (!plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
        }

        // Cancela subscriptions ativas do usuário
        await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', userId)
            .in('status', ['active', 'trialing', 'unpaid', 'pending']);

        // Cria subscription de trial
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + trialDays);

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_id: planId,
                status: 'trialing',
                price_at_period: 0,        // Trial = gratuito
                currency: 'BRL',
                payment_method: 'trial',
                current_period_start: now.toISOString(),
                current_period_end: trialEnd.toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `Trial de ${trialDays} dias ativado — Plano ${plan.name}`,
            subscription,
        });

    } catch (error) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
