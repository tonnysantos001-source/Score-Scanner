/**
 * localStorage Cache Manager for CNPJs
 * Provides persistent storage for whitelist, blacklist, and used CNPJs
 * Uses in-memory Sets for O(1) lookup performance
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

// In-memory Sets for O(1) lookups — populated lazily from localStorage
let _blacklistSet: Set<string> | null = null;
let _usedSet: Set<string> | null = null;

function getBlacklistSet(): Set<string> {
    if (!_blacklistSet) {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BLACKLIST);
            const entries: CNPJBlacklistEntry[] = data ? JSON.parse(data) : [];
            _blacklistSet = new Set(entries.map(e => e.cnpj));
        } catch {
            _blacklistSet = new Set();
        }
    }
    return _blacklistSet;
}

function getUsedSet(): Set<string> {
    if (!_usedSet) {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USED);
            const entries: CNPJUsedEntry[] = data ? JSON.parse(data) : [];
            _usedSet = new Set(entries.map(e => e.cnpj));
        } catch {
            _usedSet = new Set();
        }
    }
    return _usedSet;
}

export class LocalStorage {
    /**
     * Invalidate in-memory Sets (call after bulk writes from Supabase sync)
     */
    static invalidateSets(): void {
        _blacklistSet = null;
        _usedSet = null;
    }

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

        const existingIndex = whitelist.findIndex(e => e.cnpj === entry.cnpj);
        if (existingIndex >= 0) {
            whitelist[existingIndex] = {
                ...entry,
                times_verified: whitelist[existingIndex].times_verified + 1,
            };
        } else {
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
     * Save blacklist to localStorage — also invalidates in-memory Set
     */
    static setBlacklist(entries: CNPJBlacklistEntry[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.BLACKLIST, JSON.stringify(entries));
            _blacklistSet = null; // force rebuild on next lookup
        } catch (error) {
            console.error('Error saving blacklist:', error);
        }
    }

    /**
     * Add single entry to blacklist
     */
    static addToBlacklist(cnpj: string, reason: CNPJBlacklistEntry['reason']): void {
        if (getBlacklistSet().has(cnpj)) return; // fast O(1) duplicate check

        const blacklist = this.getBlacklist();
        blacklist.push({ cnpj, reason, added_at: new Date().toISOString() });
        this.setBlacklist(blacklist); // invalidates Set via setBlacklist
        getBlacklistSet().add(cnpj); // update in-memory Set immediately
        console.log(`❌ Added to blacklist: ${cnpj} (${reason})`);
    }

    /**
     * Check if CNPJ is in blacklist — O(1) via in-memory Set
     */
    static isBlacklisted(cnpj: string): boolean {
        return getBlacklistSet().has(cnpj);
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
     * Save used list to localStorage — also invalidates in-memory Set
     */
    static setUsed(entries: CNPJUsedEntry[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.USED, JSON.stringify(entries));
            _usedSet = null; // force rebuild on next lookup
        } catch (error) {
            console.error('Error saving used list:', error);
        }
    }

    /**
     * Mark CNPJ as used
     */
    static markAsUsed(cnpj: string): void {
        if (getUsedSet().has(cnpj)) return; // fast O(1) duplicate check

        const used = this.getUsed();
        used.push({ cnpj, used_at: new Date().toISOString() });
        this.setUsed(used); // invalidates Set via setUsed
        getUsedSet().add(cnpj); // update in-memory Set immediately
        console.log(`🗑️ Marked as used: ${cnpj}`);
    }

    /**
     * Check if CNPJ is marked as used — O(1) via in-memory Set
     */
    static isUsed(cnpj: string): boolean {
        return getUsedSet().has(cnpj);
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
        _blacklistSet = null;
        _usedSet = null;
        console.log('🗑️ All cache cleared');
    }

    /**
     * Get available whitelist entries (not yet used) — with full company data
     */
    static getAvailableWhitelist(): CNPJWhitelistEntry[] {
        const whitelist = this.getWhitelist();
        const usedSet = getUsedSet();
        return whitelist.filter(entry => !usedSet.has(entry.cnpj));
    }
}
