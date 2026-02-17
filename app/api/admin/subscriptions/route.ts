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
