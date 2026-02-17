// app/api/admin/plans/route.ts
// Admin API: Plans Management

import { requireAdmin } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireAdmin();
        const supabase = await createClient();

        const { data: plans, error } = await supabase
            .from('plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ plans: plans || [] });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch plans' },
            { status: 500 }
        );
    }
}
