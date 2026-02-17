// app/api/auth/logout/route.ts
// Logout API route

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        );
    }
}
