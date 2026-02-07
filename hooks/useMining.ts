import { useState, useCallback, useRef } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { MiningFilters, MiningProgress, MINING_QUANTITY } from '@/types/filters';
import { generateValidCNPJ } from '@/lib/mining/cnpj-generator';
import { matchesFilters } from '@/lib/mining/filter-matcher';

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
            console.log(`🎯 Iniciando mineração com geração aleatória de CNPJs...`);

            // Global wordlist index to track position
            let wordlistIndex = 0;
            const wordlist = await import('@/lib/mining/cnpj-wordlist').then(m => m.CNPJ_WORDLIST_2025);
            console.log(`📋 Wordlist 2025-2026 loaded: ${wordlist.length} CNPJs`);

            while (foundCompanies.length < MINING_QUANTITY) {
                // Check if mining was stopped
                if (abortControllerRef.current.signal.aborted) {
                    break;
                }

                let cnpj: string;

                // Strategy: 90% wordlist, 10% generation
                const useWordlist = Math.random() < 0.9 && wordlistIndex < wordlist.length;

                if (useWordlist) {
                    // Use wordlist (90%)
                    cnpj = wordlist[wordlistIndex++];
                    console.log(`📋 [Wordlist ${wordlistIndex}/${wordlist.length}] Testing: ${cnpj}`);
                } else {
                    // Generate random (10% or when wordlist exhausted)
                    do {
                        cnpj = generateValidCNPJ(filters.uf);
                    } while (triedCNPJs.current.has(cnpj));
                    console.log(`🎲 [Generated] Testing: ${cnpj}`);
                }

                // Skip if already tried
                if (triedCNPJs.current.has(cnpj)) {
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

                console.log(`🔍 Testando CNPJ ${tried}: ${cnpj}`);

                try {
                    // Apply delay BEFORE making request (except first one)
                    if (tried > 1) {
                        await sleep(MINING_CONFIG.delayBetweenRequests);
                    }

                    const company = await fetchCompany(cnpj);

                    if (!company) {
                        // CNPJ not found (404) or error fetching
                        console.log(`❌ CNPJ ${cnpj} não encontrado (404 ou erro na API)`);
                    } else if (matchesFilters(company, filters)) {
                        foundCompanies.push(company);

                        console.log(`✅ ENCONTRADO! ${company.razao_social} - Total: ${foundCompanies.length}/${MINING_QUANTITY}`)

                            ;

                        // Update state immediately when found
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
                        // Company exists but doesn't match filters
                        console.log(`⚠️ CNPJ ${cnpj} encontrado mas rejeitado pelos filtros`);
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
            abortControllerRef.current = null;
        }
    }, []);

    const stopMining = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsMining(false);
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
