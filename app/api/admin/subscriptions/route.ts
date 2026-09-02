// app/api/admin/subscriptions/route.ts
// Admin API: Subscriptions Management

import { requireAdmin } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireAdmin();
        const supabase = await createClient();

        const { data: subscriptions, error } = await supabase
            .from('subscriptions')
            .select(`
        *,
        profiles!subscriptions_user_id_fkey (
          email
        ),
        plans!subscriptions_plan_id_fkey (
          name
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data for easier consumption
        const transformed = subscriptions?.map((sub) => ({
            id: sub.id,
            user_email: sub.profiles?.email || 'N/A',
            plan_name: sub.plans?.name || 'N/A',
            status: sub.status,
            price_at_period: sub.price_at_period,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            active_domains: sub.active_domains || 0,
            created_at: sub.created_at,
        }));

        return NextResponse.json({ subscriptions: transformed || [] });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await requireAdmin();
        const supabase = await createClient();
        const body = await request.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json(
                { error: 'subscriptionId é obrigatório' },
                { status: 400 }
            );
        }

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                external_id: `manual_activation_${Math.random().toString(36).substring(2, 11)}`,
                updated_at: now.toISOString(),
                payment_confirmed_at: now.toISOString(),
            })
            .eq('id', subscriptionId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to activate subscription: ' + err.message },
            { status: 500 }
        );
    }
}
