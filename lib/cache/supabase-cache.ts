/**
 * Supabase Cache Integration
 * Handles syncing with remote Supabase database
 */

import { supabase } from '@/lib/supabase/client';
import { CNPJWhitelistEntry, CNPJBlacklistEntry, CNPJUsedEntry } from './local-storage';

export class SupabaseCache {
    /**
     * Fetch whitelist from Supabase
     */
    static async fetchWhitelist(): Promise<CNPJWhitelistEntry[]> {
        if (!supabase) return []; // Supabase not available

        try {
            const { data, error } = await supabase
                .from('cnpj_whitelist')
                .select('*')
                .order('found_at', { ascending: false });

            if (error) {
                console.error('Error fetching whitelist:', error);
                return [];
            }

            return (data || []).map(row => ({
                cnpj: row.cnpj,
                razao_social: row.razao_social,
                nome_fantasia: row.nome_fantasia,
                uf: row.uf,
                municipio: row.municipio,
                capital_social: row.capital_social,
                porte: row.porte,
                trust_score: row.trust_score,
                found_at: row.found_at,
                times_verified: row.times_verified,
            }));
        } catch (error) {
            console.error('Supabase whitelist fetch failed:', error);
            return [];
        }
    }

    /**
     * Fetch blacklist from Supabase
     */
    static async fetchBlacklist(): Promise<CNPJBlacklistEntry[]> {
        if (!supabase) return []; // Supabase not available

        try {
            const { data, error } = await supabase
                .from('cnpj_blacklist')
                .select('*')
                .order('added_at', { ascending: false });

            if (error) {
                console.error('Error fetching blacklist:', error);
                return [];
            }

            return (data || []).map(row => ({
                cnpj: row.cnpj,
                reason: row.reason as CNPJBlacklistEntry['reason'],
                added_at: row.added_at,
            }));
        } catch (error) {
            console.error('Supabase blacklist fetch failed:', error);
            return [];
        }
    }

    /**
     * Fetch used CNPJs from Supabase
     */
    static async fetchUsed(): Promise<CNPJUsedEntry[]> {
        if (!supabase) return []; // Supabase not available

        try {
            const { data, error } = await supabase
                .from('cnpj_used')
                .select('*')
                .order('used_at', { ascending: false });

            if (error) {
                console.error('Error fetching used:', error);
                return [];
            }

            return (data || []).map(row => ({
                cnpj: row.cnpj,
                used_at: row.used_at,
            }));
        } catch (error) {
            console.error('Supabase used fetch failed:', error);
            return [];
        }
    }

    /**
     * Insert or update whitelist entry
     */
    static async upsertWhitelist(entry: CNPJWhitelistEntry): Promise<void> {
        if (!supabase) return; // Supabase not available

        try {
            const { error } = await supabase
                .from('cnpj_whitelist')
                .upsert({
                    cnpj: entry.cnpj,
                    razao_social: entry.razao_social,
                    nome_fantasia: entry.nome_fantasia || null,
                    uf: entry.uf,
                    municipio: entry.municipio,
                    capital_social: entry.capital_social,
                    porte: entry.porte,
                    trust_score: entry.trust_score,
                    times_verified: entry.times_verified,
                    last_verified: new Date().toISOString(),
                }, {
                    onConflict: 'cnpj',
                });

            if (error) {
                console.error('Error upserting whitelist:', error);
            } else {
                console.log(`✅ Synced to Supabase whitelist: ${entry.cnpj}`);
            }
        } catch (error) {
            console.error('Supabase whitelist upsert failed:', error);
        }
    }

    /**
     * Insert blacklist entry
     */
    static async insertBlacklist(entry: CNPJBlacklistEntry): Promise<void> {
        if (!supabase) return; // Supabase not available

        try {
            const { error } = await supabase
                .from('cnpj_blacklist')
                .insert({
                    cnpj: entry.cnpj,
                    reason: entry.reason,
                });

            if (error) {
                // Ignore duplicate key errors
                if (error.code !== '23505') {
                    console.error('Error inserting blacklist:', error);
                }
            } else {
                console.log(`❌ Synced to Supabase blacklist: ${entry.cnpj}`);
            }
        } catch (error) {
            console.error('Supabase blacklist insert failed:', error);
        }
    }

    /**
     * Insert used entry
     */
    static async insertUsed(cnpj: string): Promise<void> {
        if (!supabase) return; // Supabase not available

        try {
            const { error } = await supabase
                .from('cnpj_used')
                .insert({
                    cnpj,
                });

            if (error) {
                console.error('Error inserting used:', error);
            } else {
                console.log(`🗑️ Synced to Supabase used: ${cnpj}`);
            }
        } catch (error) {
            console.error('Supabase used insert failed:', error);
        }
    }

    /**
     * Get cache statistics from Supabase
     */
    static async getStats() {
        if (!supabase) return { whitelist: 0, blacklist: 0, used: 0 };

        try {
            const [whitelistCount, blacklistCount, usedCount] = await Promise.all([
                supabase.from('cnpj_whitelist').select('*', { count: 'exact', head: true }),
                supabase.from('cnpj_blacklist').select('*', { count: 'exact', head: true }),
                supabase.from('cnpj_used').select('*', { count: 'exact', head: true }),
            ]);

            return {
                whitelist: whitelistCount.count || 0,
                blacklist: blacklistCount.count || 0,
                used: usedCount.count || 0,
            };
        } catch (error) {
            console.error('Error fetching Supabase stats:', error);
            return { whitelist: 0, blacklist: 0, used: 0 };
        }
    }
}
