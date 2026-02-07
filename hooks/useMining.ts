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
    delayBetweenRequests: 25000, // 25 seconds - ReceitaWS allows 3 req/min!
    delayOnRateLimit: 60000, // 60 seconds wait on rate limit
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
            // Import known CNPJs
            const { getShuffledKnownCNPJs } = await import('@/lib/mining/known-cnpjs');
            const knownCNPJs = getShuffledKnownCNPJs();
            let knownIndex = 0;

            console.log(`🎯 Iniciando mineração com ${knownCNPJs.length} CNPJs conhecidos primeiro...`);

            while (foundCompanies.length < MINING_QUANTITY) {
                // Check if mining was stopped
                if (abortControllerRef.current.signal.aborted) {
                    break;
                }

                // Get CNPJ: first use known CNPJs, then generate random
                let cnpj: string;
                if (knownIndex < knownCNPJs.length) {
                    cnpj = knownCNPJs[knownIndex];
                    knownIndex++;
                    console.log(`📋 Testando CNPJ conhecido ${knownIndex}/${knownCNPJs.length}: ${cnpj}`);
                } else {
                    // Fallback to random generation
                    do {
                        cnpj = generateValidCNPJ();
                    } while (triedCNPJs.current.has(cnpj));
                    console.log(`🎲 Gerando CNPJ aleatório: ${cnpj}`);
                }

                triedCNPJs.current.add(cnpj);
                tried++;

                try {
                    // Apply delay BEFORE making request (except first one)
                    if (tried > 1) {
                        console.log(`⏳ Aguardando ${MINING_CONFIG.delayBetweenRequests / 1000}s antes da próxima requisição...`);
                        await sleep(MINING_CONFIG.delayBetweenRequests);
                    }

                    const company = await fetchCompany(cnpj);

                    if (company && matchesFilters(company, filters)) {
                        foundCompanies.push(company);

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
                    }

                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        break;
                    }

                    // Check for rate limiting
                    if (err instanceof Error && err.message === 'RATE_LIMIT') {
                        console.log(`❌ Rate limit detected! Aguardando ${MINING_CONFIG.delayOnRateLimit / 1000}s...`);
                        await sleep(MINING_CONFIG.delayOnRateLimit);
                        console.log('✅ Retomando mineração após rate limit...');
                        consecutiveErrors = 0; // Reset errors on rate limit
                        tried--; // Don't count rate limited requests
                        continue;
                    }

                    consecutiveErrors++;
                    if (consecutiveErrors >= MINING_CONFIG.maxConsecutiveErrors) {
                        throw new Error('Muitos erros consecutivos. Tente relaxar os filtros.');
                    }
                }

                // Update progress
                if (tried % 5 === 0) {
                    setProgress(prev => ({
                        ...prev,
                        tried,
                    }));
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
