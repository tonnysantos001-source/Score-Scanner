import { CompanyData } from '@/types/company';

const BRASILAPI_BASE_URL = process.env.NEXT_PUBLIC_BRASILAPI_URL || 'https://brasilapi.com.br/api';

/**
 * Fetch company data from BrasilAPI by CNPJ
 */
export async function fetchCompanyByCNPJ(cnpj: string): Promise<CompanyData> {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    try {
        const response = await fetch(`${BRASILAPI_BASE_URL}/cnpj/v1/${cleanCNPJ}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Disable cache for testing
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('CNPJ não encontrado');
            }
            if (response.status === 429 || response.status === 403) {
                throw new Error('RATE_LIMIT'); // Rate limiting
            }
            throw new Error(`Erro ao buscar CNPJ: ${response.statusText}`);
        }

        const data: CompanyData = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Erro desconhecido ao buscar CNPJ');
    }
}

/**
 * Simple in-memory cache
 */
class SimpleCache<T> {
    private cache: Map<string, { data: T; timestamp: number }> = new Map();
    private ttl: number;

    constructor(ttlSeconds: number = 86400) {
        this.ttl = ttlSeconds * 1000; // Convert to milliseconds
    }

    get(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    set(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Global cache instance
export const cnpjCache = new SimpleCache<CompanyData>(86400); // 24 hours

/**
 * Fetch company with caching
 */
export async function fetchCompanyWithCache(cnpj: string): Promise<CompanyData> {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Check cache first
    const cached = cnpjCache.get(cleanCNPJ);
    if (cached) {
        return cached;
    }

    // Fetch from API
    const data = await fetchCompanyByCNPJ(cleanCNPJ);

    // Store in cache
    cnpjCache.set(cleanCNPJ, data);

    return data;
}
