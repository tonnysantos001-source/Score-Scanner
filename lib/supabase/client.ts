import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// SINGLETON INSTANCE
let client: SupabaseClient | undefined;

export function createClient() {
    if (client) return client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
        );
    }

    // Create client explicitly for browser
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return client;
}

// Named export for flexibility, but it's the same function
export const supabase = createClient();
