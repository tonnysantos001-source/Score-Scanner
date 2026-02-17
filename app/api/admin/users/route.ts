// app/api/admin/users/route.ts
// EXAMPLE: Protected admin API route with requireAdmin()

import { requireAdmin } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // ✅ ROLE CHECK HAPPENS HERE (not in middleware)
        await requireAdmin();

        const supabase = await createClient();

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'UNAUTHORIZED') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Error:', err);
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const admin = await requireAdmin();
        const { userId, updates } = await request.json();

        const supabase = await createClient();

        // Prevent changing own role (safety)
        if (userId === admin.id && updates.role) {
            return NextResponse.json(
                { error: 'Cannot change your own role' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ user: data });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}
