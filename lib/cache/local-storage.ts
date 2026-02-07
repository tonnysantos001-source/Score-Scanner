/**
 * localStorage Cache Manager for CNPJs
 * Provides persistent storage for whitelist, blacklist, and used CNPJs
 */

const STORAGE_KEYS = {
    WHITELIST: 'cnpj_whitelist',
    BLACKLIST: 'cnpj_blacklist',
    USED: 'cnpj_used',
    LAST_SYNC: 'cnpj_last_sync',
} as const;

export interface CNPJWhitelistEntry {
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string;
    uf: string;
    municipio: string;
    capital_social: number;
    porte: string;
    trust_score: number;
    found_at: string; // ISO timestamp
    times_verified: number;
}

export interface CNPJBlacklistEntry {
    cnpj: string;
    reason: 'NOT_FOUND' | 'INACTIVE' | 'ERROR' | 'FILTERED';
    added_at: string; // ISO timestamp
}

export interface CNPJUsedEntry {
    cnpj: string;
    used_at: string; // ISO timestamp
}

export class LocalStorage {
    /**
     * Get whitelist from localStorage
     */
    static getWhitelist(): CNPJWhitelistEntry[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.WHITELIST);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading whitelist:', error);
            return [];
        }
    }

    /**
     * Save whitelist to localStorage
     */
    static setWhitelist(entries: CNPJWhitelistEntry[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(entries));
        } catch (error) {
            console.error('Error saving whitelist:', error);
        }
    }

    /**
     * Add single entry to whitelist
     */
    static addToWhitelist(entry: CNPJWhitelistEntry): void {
        const whitelist = this.getWhitelist();

        // Check if already exists
        const existingIndex = whitelist.findIndex(e => e.cnpj === entry.cnpj);

        if (existingIndex >= 0) {
            // Update existing entry
            whitelist[existingIndex] = {
                ...entry,
                times_verified: whitelist[existingIndex].times_verified + 1,
            };
        } else {
            // Add new entry
            whitelist.push({ ...entry, times_verified: 1 });
        }

        this.setWhitelist(whitelist);
        console.log(`✅ Added to whitelist: ${entry.cnpj} (${entry.razao_social})`);
    }

    /**
     * Get blacklist from localStorage
     */
    static getBlacklist(): CNPJBlacklistEntry[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BLACKLIST);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading blacklist:', error);
            return [];
        }
    }

    /**
     * Save blacklist to localStorage
     */
    static setBlacklist(entries: CNPJBlacklistEntry[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.BLACKLIST, JSON.stringify(entries));
        } catch (error) {
            console.error('Error saving blacklist:', error);
        }
    }

    /**
     * Add single entry to blacklist
     */
    static addToBlacklist(cnpj: string, reason: CNPJBlacklistEntry['reason']): void {
        const blacklist = this.getBlacklist();

        // Avoid duplicates
        if (blacklist.some(e => e.cnpj === cnpj)) {
            return;
        }

        blacklist.push({
            cnpj,
            reason,
            added_at: new Date().toISOString(),
        });

        this.setBlacklist(blacklist);
        console.log(`❌ Added to blacklist: ${cnpj} (${reason})`);
    }

    /**
     * Check if CNPJ is in blacklist
     */
    static isBlacklisted(cnpj: string): boolean {
        const blacklist = this.getBlacklist();
        return blacklist.some(e => e.cnpj === cnpj);
    }

    /**
     * Get used CNPJs from localStorage
     */
    static getUsed(): CNPJUsedEntry[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USED);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading used list:', error);
            return [];
        }
    }

    /**
     * Save used list to localStorage
     */
    static setUsed(entries: CNPJUsedEntry[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.USED, JSON.stringify(entries));
        } catch (error) {
            console.error('Error saving used list:', error);
        }
    }

    /**
     * Mark CNPJ as used
     */
    static markAsUsed(cnpj: string): void {
        const used = this.getUsed();

        // Avoid duplicates
        if (used.some(e => e.cnpj === cnpj)) {
            return;
        }

        used.push({
            cnpj,
            used_at: new Date().toISOString(),
        });

        this.setUsed(used);
        console.log(`🗑️ Marked as used: ${cnpj}`);
    }

    /**
     * Check if CNPJ is marked as used
     */
    static isUsed(cnpj: string): boolean {
        const used = this.getUsed();
        return used.some(e => e.cnpj === cnpj);
    }

    /**
     * Get statistics
     */
    static getStats() {
        return {
            whitelist: this.getWhitelist().length,
            blacklist: this.getBlacklist().length,
            used: this.getUsed().length,
            lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'never',
        };
    }

    /**
     * Clear all cache (for testing)
     */
    static clearAll(): void {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🗑️ All cache cleared');
    }

    /**
     * Get available CNPJs from whitelist (not used)
     */
    static getAvailableWhitelist(): CNPJWhitelistEntry[] {
        const whitelist = this.getWhitelist();
        const used = this.getUsed();
        const usedCNPJs = new Set(used.map(e => e.cnpj));

        return whitelist.filter(entry => !usedCNPJs.has(entry.cnpj));
    }
}
