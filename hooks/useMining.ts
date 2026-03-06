import { useState, useCallback, useRef } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { MiningFilters, MiningProgress, MINING_QUANTITY } from '@/types/filters';
import { generateValidCNPJ } from '@/lib/mining/cnpj-generator';
import { matchesFilters } from '@/lib/mining/filter-matcher';
import { cnpjCache } from '@/lib/cache/cnpj-cache';

interface UseMiningReturn {
    companies: EnhancedCompanyData[];
    progress: MiningProgress;
    isMining: boolean;
    error: string | null;
    startMining: (filters: MiningFilters) => Promise<void>;
    stopMining: () => void;
    clearResults: () => void;
}

const MINING_CONFIG = {
    maxParallelRequests: 1,
    delayBetweenRequests: 5000, // 5 seconds - faster mining, accept some rate limits
    delayOnRateLimit: 30000, // 30 seconds wait on rate limit (reduced)
    retryAttempts: 2,
    maxConsecutiveErrors: 100, // Allow many 404s
};

export function useMining(): UseMiningReturn {
    const [companies, setCompanies] = useState<EnhancedCompanyData[]>([]);
    const [progress, setProgress] = useState<MiningProgress>({
        tried: 0,
        found: 0,
        target: MINING_QUANTITY,
        percentage: 0,
        isComplete: false,
    });
    const isMiningRef = useRef(false);
    const [isMining, setIsMining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const triedCNPJs = useRef<Set<string>>(new Set());

    const fetchCompany = async (cnpj: string): Promise<EnhancedCompanyData | null> => {
        try {
            const response = await fetch(`/api/cnpj?cnpj=${encodeURIComponent(cnpj)}`, {
                signal: abortControllerRef.current?.signal,
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // CNPJ doesn't exist
                }
                if (response.status === 429) {
                    // Rate limiting - throw error to be caught by mining loop
                    throw new Error('RATE_LIMIT');
                }
                if (response.status === 500) {
                    // Check if it's rate limit error (just in case)
                    try {
                        const errorData = await response.json();
                        if (errorData.error === 'RATE_LIMIT') {
                            throw new Error('RATE_LIMIT');
                        }
                    } catch {
                        // Couldn't parse error
                    }
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data as EnhancedCompanyData;
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError' || err.message === 'RATE_LIMIT') {
                    throw err; // Re-throw to be handled by mining loop
                }
            }
            return null;
        }
    };

    const checkCnpjUsage = async (cnpj: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/cnpj/check-usage?cnpj=${encodeURIComponent(cnpj)}`, {
                signal: abortControllerRef.current?.signal,
            });
            if (response.ok) {
                const data = await response.json();
                // API retorna { isUsed: boolean } — verificar se já está vinculado a outro usuário
                return data.isUsed === true;
            }
            return false;
        } catch {
            // Em caso de erro na verificação (ex: abort), assume não usado para não travar
            // O backend ainda bloqueará no momento de salvar se estiver usado
            return false;
        }
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const startMining = useCallback(async (filters: MiningFilters) => {
        if (isMiningRef.current) return;

        // Reset state
        setIsMining(true);
        isMiningRef.current = true;
        setCompanies([]);
        setError(null);
        triedCNPJs.current.clear();

        setProgress({
            tried: 0,
            found: 0,
            target: MINING_QUANTITY,
            percentage: 0,
            isComplete: false,
        });

        abortControllerRef.current = new AbortController();

        const foundCompanies: EnhancedCompanyData[] = [];
        let tried = 0;
        let consecutiveErrors = 0;

        try {
            // Initialize cache
            await cnpjCache.initialize();

            // Get available sources
            const cachedCNPJs = cnpjCache.getAvailableCNPJs();
            const wordlist = await import('@/lib/mining/cnpj-wordlist').then(m => m.CNPJ_WORDLIST_2025);

            console.log(`[Mining] Cache loaded: ${cachedCNPJs.length} whitelist CNPJs, ${wordlist.length} wordlist CNPJs`);
            // Indices for tracking
            let cacheIndex = 0;
            let wordlistIndex = 0;

            while (foundCompanies.length < MINING_QUANTITY) {
                // Check if mining was stopped
                if (abortControllerRef.current.signal.aborted) {
                    break;
                }

                let cnpj: string;
                let source: string;

                // INTELLIGENT PRIORITIZATION:
                // 95% Cached (already validated) >>> 4% Wordlist >>> 1% Generation
                const rand = Math.random();

                if (rand < 0.95 && cacheIndex < cachedCNPJs.length) {
                    // Use cache (95% - HIGHEST priority)
                    cnpj = cachedCNPJs[cacheIndex++];
                    source = `💎 Cache ${cacheIndex}/${cachedCNPJs.length}`;
                } else if (rand < 0.99 && wordlistIndex < wordlist.length) {
                    // Use wordlist (4%)
                    cnpj = wordlist[wordlistIndex++];
                    source = `📋 Wordlist ${wordlistIndex}/${wordlist.length}`;
                } else {
                    // Generate random (1% - discovery)
                    do {
                        cnpj = generateValidCNPJ(filters.uf);
                    } while (triedCNPJs.current.has(cnpj));
                    source = `🎲 Generated`;
                }

                // Skip if already tried or should skip (blacklist/used)
                if (triedCNPJs.current.has(cnpj) || cnpjCache.shouldSkip(cnpj)) {
                    continue;
                }

                triedCNPJs.current.add(cnpj);
                tried++;

                // Update progress IMMEDIATELY before testing
                setProgress({
                    tried,
                    found: foundCompanies.length,
                    target: MINING_QUANTITY,
                    percentage: (foundCompanies.length / MINING_QUANTITY) * 100,
                    isComplete: false,
                });

                try {
                    // Apply delay BEFORE making request (except first one)
                    if (tried > 1) {
                        await sleep(MINING_CONFIG.delayBetweenRequests);
                    }

                    const company = await fetchCompany(cnpj);

                    if (!company) {
                        // CNPJ not found (404) or error fetching
                        cnpjCache.processMiningResult(cnpj, {
                            found: false,
                            reason: 'NOT_FOUND',
                        });
                    } else if (matchesFilters(company, filters)) {
                        // Verificar se já está vinculado a outro cliente (exclusividade global)
                        const isUsed = await checkCnpjUsage(cnpj);

                        if (isUsed) {
                            // Adicionar à blacklist local / cache para não tentar novamente
                            cnpjCache.processMiningResult(cnpj, {
                                found: true,
                                active: false,
                                reason: 'USED',
                            });
                            continue;
                        }

                        foundCompanies.push(company);

                        // Add to whitelist cache
                        cnpjCache.processMiningResult(cnpj, {
                            found: true,
                            active: true,
                            data: company,
                        });

                        // Update React state
                        setCompanies([...foundCompanies]);

                        setProgress({
                            tried,
                            found: foundCompanies.length,
                            target: MINING_QUANTITY,
                            percentage: (foundCompanies.length / MINING_QUANTITY) * 100,
                            isComplete: false,
                        });

                        consecutiveErrors = 0;
                    } else {
                        // Doesn't match filters
                        cnpjCache.processMiningResult(cnpj, {
                            found: true,
                            active: true,
                            reason: 'FILTERED',
                        });
                    }

                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        break;
                    }

                    // Check for rate limiting
                    if (err instanceof Error && err.message === 'RATE_LIMIT') {
                        console.log(`❌ Rate limit detectado! Aguardando ${MINING_CONFIG.delayOnRateLimit / 1000}s...`);
                        await sleep(MINING_CONFIG.delayOnRateLimit);
                        console.log('✅ Retomando mineração após rate limit...');
                        consecutiveErrors = 0; // Reset errors on rate limit
                        tried--; // Don't count rate limited requests
                        continue;
                    }

                    console.log(`❌ Erro ao testar CNPJ ${cnpj}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);

                    consecutiveErrors++;
                    if (consecutiveErrors >= MINING_CONFIG.maxConsecutiveErrors) {
                        throw new Error('Muitos erros consecutivos. Tente relaxar os filtros.');
                    }
                }

                // Safety limit - stop after trying too many
                if (tried >= MINING_QUANTITY * 100) {
                    throw new Error('Limite de tentativas excedido. Tente relaxar os filtros.');
                }
            }

            // Mining complete
            setProgress({
                tried,
                found: foundCompanies.length,
                target: MINING_QUANTITY,
                percentage: 100,
                isComplete: true,
            });

        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setIsMining(false);
            isMiningRef.current = false; // FIX: Reset ref so we can start again
            abortControllerRef.current = null;
        }
    }, []);

    const stopMining = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsMining(false);
        isMiningRef.current = false; // FIX: Reset ref on manual stop
    }, []);

    const clearResults = useCallback(() => {
        setCompanies([]);
        setProgress({
            tried: 0,
            found: 0,
            target: MINING_QUANTITY,
            percentage: 0,
            isComplete: false,
        });
        setError(null);
        triedCNPJs.current.clear();
    }, []);

    return {
        companies,
        progress,
        isMining,
        error,
        startMining,
        stopMining,
        clearResults,
    };
}
