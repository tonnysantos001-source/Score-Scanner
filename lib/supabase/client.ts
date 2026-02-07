/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase is optional - if env vars are missing, return null
// System will fall back to localStorage-only mode
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false, // We're not using auth
        },
    });
    console.log('✅ Supabase client initialized');
} else {
    console.warn('⚠️ Supabase env vars not found - using localStorage only mode');
}

export { supabase };
