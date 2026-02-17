// app/api/admin/settings/route.ts
// Admin API: Gateway Settings Management

import { requireSuperAdmin } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireSuperAdmin();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('gateway_settings')
            .select('*')
            .eq('provider', 'zentripay')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({ settings: data || null });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Superadmin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requireSuperAdmin();
        const supabase = await createClient();
        const body = await request.json();

        const { api_key, api_secret, webhook_secret, is_production } = body;

        // Validate required fields
        if (!api_key || !api_secret || !webhook_secret) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('gateway_settings')
            .insert({
                provider: 'zentripay',
                api_key,
                api_secret,
                webhook_secret,
                is_production: is_production || false,
                created_by: admin.id,
                updated_by: admin.id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, settings: data });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Superadmin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to save settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const admin = await requireSuperAdmin();
        const supabase = await createClient();
        const body = await request.json();

        const { api_key, api_secret, webhook_secret, is_production } = body;

        // Get current settings
        const { data: current } = await supabase
            .from('gateway_settings')
            .select('id')
            .eq('provider', 'zentripay')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!current) {
            return NextResponse.json(
                { error: 'No settings found. Create them first.' },
                { status: 404 }
            );
        }

        const { data, error } = await supabase
            .from('gateway_settings')
            .update({
                api_key,
                api_secret,
                webhook_secret,
                is_production,
                updated_by: admin.id,
            })
            .eq('id', current.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, settings: data });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Superadmin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
