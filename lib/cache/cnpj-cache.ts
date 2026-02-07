/**
 * CNPJ Cache Manager
 * Orchestrates caching between localStorage and Supabase
 */

import { LocalStorage, CNPJWhitelistEntry, CNPJBlacklistEntry } from './local-storage';

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
     * Initialize cache (load from localStorage on startup)
     */
    async initialize(): Promise<void> {
        const stats = LocalStorage.getStats();
        console.log('📊 Cache Stats:', stats);

        // TODO: Sync with Supabase (Fase 2)
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

            LocalStorage.addToBlacklist(cnpj, reason);
        }
    }

    /**
     * Mark CNPJ as used
     */
    markAsUsed(cnpj: string): void {
        LocalStorage.markAsUsed(cnpj);
        // TODO: Sync with Supabase (Fase 2)
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
