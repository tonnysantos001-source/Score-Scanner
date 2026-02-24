import { createClient } from '@supabase/supabase-js';

/**
 * Supabase ADMIN client (service role key).
 * Bypasses RLS — use ONLY in server-side code for public-facing lookups
 * that must work without user authentication (e.g., landing page serving).
 * NEVER expose to the browser.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is not set.');
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
