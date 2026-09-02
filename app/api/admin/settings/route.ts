import { requireAdmin } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await requireAdmin();
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('gateway_settings')
            .select('*');

        if (error) throw error;

        return NextResponse.json({ settings: data || [] });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
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
        const admin = await requireAdmin();
        const supabase = createAdminClient();
        const body = await request.json();

        const { provider, api_key, api_secret, webhook_secret, is_production, is_active } = body;

        if (!provider) {
            return NextResponse.json(
                { error: 'Provedor é obrigatório' },
                { status: 400 }
            );
        }

        // Check if settings already exist for this provider
        const { data: existing } = await supabase
            .from('gateway_settings')
            .select('id')
            .eq('provider', provider)
            .limit(1)
            .maybeSingle();

        let result;
        if (existing) {
            const { data, error } = await supabase
                .from('gateway_settings')
                .update({
                    api_key,
                    api_secret,
                    webhook_secret,
                    is_production: is_production || false,
                    updated_by: admin.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabase
                .from('gateway_settings')
                .insert({
                    provider,
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
            result = data;
        }

        // If is_active is true, configure active_gateway row
        if (is_active) {
            const { data: activeExisting } = await supabase
                .from('gateway_settings')
                .select('id')
                .eq('provider', 'active_gateway')
                .limit(1)
                .maybeSingle();

            if (activeExisting) {
                const { error: activeErr } = await supabase
                    .from('gateway_settings')
                    .update({
                        api_key: provider,
                        updated_by: admin.id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', activeExisting.id);
                if (activeErr) throw activeErr;
            } else {
                const { error: activeErr } = await supabase
                    .from('gateway_settings')
                    .insert({
                        provider: 'active_gateway',
                        api_key: provider,
                        created_by: admin.id,
                        updated_by: admin.id,
                    });
                if (activeErr) throw activeErr;
            }
        }

        return NextResponse.json({ success: true, settings: result });
    } catch (error) {
        const err = error as Error;

        if (err.message === 'FORBIDDEN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to save settings: ' + err.message },
            { status: 500 }
        );
    }
}

