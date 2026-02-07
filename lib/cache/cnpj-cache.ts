/**
 * CNPJ Cache Manager
 * Orchestrates caching between localStorage and Supabase
 */

import { LocalStorage, CNPJWhitelistEntry, CNPJBlacklistEntry } from './local-storage';
import { SupabaseCache } from './supabase-cache';

export interface CompanyData {
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string;
    tipo_situacao_cadastral: string;
    uf: string;
    municipio: string;
    capital_social: number;
    porte: string;
    trust_score?: number;
}

export class CNPJCache {
    /**
     * Initialize cache (pull from Supabase + merge with localStorage)
     */
    async initialize(): Promise<void> {
        console.log('📥 Initializing cache with Supabase sync...');

        try {
            // Fetch from Supabase ("pull")
            const [remoteWhitelist, remoteBlacklist, remoteUsed] = await Promise.all([
                SupabaseCache.fetchWhitelist(),
                SupabaseCache.fetchBlacklist(),
                SupabaseCache.fetchUsed(),
            ]);

            console.log(`🌐 Supabase: ${remoteWhitelist.length} whitelist, ${remoteBlacklist.length} blacklist, ${remoteUsed.length} used`);

            // Merge with localStorage
            const localWhitelist = LocalStorage.getWhitelist();
            const localBlacklist = LocalStorage.getBlacklist();
            const localUsed = LocalStorage.getUsed();

            // Merge whitelist (Supabase + Local, unique by CNPJ)
            const mergedWhitelistMap = new Map<string, CNPJWhitelistEntry>();

            remoteWhitelist.forEach(entry => mergedWhitelistMap.set(entry.cnpj, entry));
            localWhitelist.forEach(entry => {
                const existing = mergedWhitelistMap.get(entry.cnpj);
                if (!existing || (entry.times_verified || 1) > (existing.times_verified || 1)) {
                    mergedWhitelistMap.set(entry.cnpj, entry);
                }
            });

            LocalStorage.setWhitelist(Array.from(mergedWhitelistMap.values()));

            // Merge blacklist (unique by CNPJ)
            const mergedBlacklistMap = new Map<string, CNPJBlacklistEntry>();
            remoteBlacklist.forEach(entry => mergedBlacklistMap.set(entry.cnpj, entry));
            localBlacklist.forEach(entry => mergedBlacklistMap.set(entry.cnpj, entry));
            LocalStorage.setBlacklist(Array.from(mergedBlacklistMap.values()));

            // Merge used (unique by CNPJ)
            const mergedUsedMap = new Map<string, typeof remoteUsed[0]>();
            remoteUsed.forEach(entry => mergedUsedMap.set(entry.cnpj, entry));
            localUsed.forEach(entry => mergedUsedMap.set(entry.cnpj, entry));
            LocalStorage.setUsed(Array.from(mergedUsedMap.values()));

            const stats = LocalStorage.getStats();
            console.log(`📊 Merged cache: ${stats.whitelist} whitelist, ${stats.blacklist} blacklist, ${stats.used} used`);

        } catch (error) {
            console.error('❌ Supabase sync failed, using local cache only:', error);
            const stats = LocalStorage.getStats();
            console.log(`📊 Local cache: ${stats.whitelist} whitelist, ${stats.blacklist} blacklist, ${stats.used} used`);
        }
    }

    /**
     * Get available CNPJs for mining (prioritize whitelist)
     */
    getAvailableCNPJs(): string[] {
        const available = LocalStorage.getAvailableWhitelist();
        return available.map(e => e.cnpj);
    }

    /**
     * Check if CNPJ should be skipped
     */
    shouldSkip(cnpj: string): boolean {
        if (LocalStorage.isBlacklisted(cnpj)) {
            console.log(`⏭️  Skipping blacklisted: ${cnpj}`);
            return true;
        }

        if (LocalStorage.isUsed(cnpj)) {
            console.log(`⏭️  Skipping used: ${cnpj}`);
            return true;
        }

        return false;
    }

    /**
     * Process mining result - add to whitelist or blacklist
     * AUTO-SYNCS TO SUPABASE
     */
    processMiningResult(cnpj: string, result: {
        found: boolean;
        active?: boolean;
        data?: CompanyData;
        reason?: string;
    }): void {
        if (result.found && result.active && result.data) {
            // Add to whitelist
            const entry: CNPJWhitelistEntry = {
                cnpj: result.data.cnpj,
                razao_social: result.data.razao_social,
                nome_fantasia: result.data.nome_fantasia,
                uf: result.data.uf,
                municipio: result.data.municipio,
                capital_social: result.data.capital_social,
                porte: result.data.porte,
                trust_score: result.data.trust_score || 75,
                found_at: new Date().toISOString(),
                times_verified: 1,
            };

            LocalStorage.addToWhitelist(entry);

            // Sync to Supabase (async, don't wait)
            SupabaseCache.upsertWhitelist(entry).catch(err =>
                console.error('Supabase whitelist sync error:', err)
            );

        } else {
            // Add to blacklist
            let reason: CNPJBlacklistEntry['reason'] = 'NOT_FOUND';

            if (result.found && !result.active) {
                reason = 'INACTIVE';
            } else if (result.reason === 'FILTERED') {
                reason = 'FILTERED';
            } else if (result.reason) {
                reason = 'ERROR';
            }

            const entry: CNPJBlacklistEntry = {
                cnpj,
                reason,
                added_at: new Date().toISOString(),
            };

            LocalStorage.addToBlacklist(cnpj, reason);

            // Sync to Supabase (async, don't wait)
            SupabaseCache.insertBlacklist(entry).catch(err =>
                console.error('Supabase blacklist sync error:', err)
            );
        }
    }

    /**
     * Mark CNPJ as used
     * AUTO-SYNCS TO SUPABASE
     */
    markAsUsed(cnpj: string): void {
        LocalStorage.markAsUsed(cnpj);

        // Sync to Supabase (async, don't wait)
        SupabaseCache.insertUsed(cnpj).catch(err =>
            console.error('Supabase used sync error:', err)
        );
    }

    /**
     * Get statistics
     */
    getStats() {
        return LocalStorage.getStats();
    }

    /**
     * Clear all cache (for testing)
     */
    clearAll(): void {
        LocalStorage.clearAll();
    }
}

// Singleton instance
export const cnpjCache = new CNPJCache();
