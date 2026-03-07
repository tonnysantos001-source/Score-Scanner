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

// Re-export so useMining can use the type directly
export type { CNPJWhitelistEntry };

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

            // Rebuild in-memory Sets from the freshly merged data
            LocalStorage.invalidateSets();

            const stats = LocalStorage.getStats();
            console.log(`📊 Merged cache: ${stats.whitelist} whitelist, ${stats.blacklist} blacklist, ${stats.used} used`);

        } catch (error) {
            console.error('❌ Supabase sync failed, using local cache only:', error);
            LocalStorage.invalidateSets(); // rebuild Sets from whatever is in localStorage
            const stats = LocalStorage.getStats();
            console.log(`📊 Local cache: ${stats.whitelist} whitelist, ${stats.blacklist} blacklist, ${stats.used} used`);
        }
    }

    /**
     * Get available CNPJ strings for mining (backwards compat)
     */
    getAvailableCNPJs(): string[] {
        return LocalStorage.getAvailableWhitelist().map(e => e.cnpj);
    }

    /**
     * Get available whitelist entries WITH full company data.
     * Use this for the fast-path: whitelist companies can be shown
     * directly without making an API call.
     */
    getAvailableWithData(): CNPJWhitelistEntry[] {
        return LocalStorage.getAvailableWhitelist();
    }

    /**
     * Check if CNPJ should be skipped (O(1) via in-memory Sets)
     */
    shouldSkip(cnpj: string): boolean {
        return LocalStorage.isBlacklisted(cnpj) || LocalStorage.isUsed(cnpj);
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

            // Sanitize CNPJ
            const sanitizedCnpj = entry.cnpj.replace(/\D/g, '');

            // Sync to Supabase (async, don't wait)
            SupabaseCache.upsertWhitelist({
                ...entry,
                cnpj: sanitizedCnpj
            }).catch(err =>
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

            // Sanitize CNPJ
            const sanitizedCnpj = cnpj.replace(/\D/g, '');

            // Sync to Supabase (async, don't wait)
            SupabaseCache.insertBlacklist({
                ...entry,
                cnpj: sanitizedCnpj
            }).catch(err =>
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
