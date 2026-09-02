import { useState, useCallback, useRef } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { MiningFilters, MiningProgress, MINING_QUANTITY } from '@/types/filters';
import { generateValidCNPJ } from '@/lib/mining/cnpj-generator';
import { matchesFilters } from '@/lib/mining/filter-matcher';
import { cnpjCache, CNPJWhitelistEntry } from '@/lib/cache/cnpj-cache';

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
    delayBetweenRequests: 1500, // 1.5 seconds - much faster mining, safe since 404s bypass heavy APIs
    delayOnRateLimit: 30000, // 30 seconds wait on rate limit (reduced)
    retryAttempts: 2,
    maxConsecutiveErrors: 100, // Allow many 404s
};

/**
 * Convert a whitelist cache entry to an EnhancedCompanyData stub.
 * Only the fields needed for filter matching and display are populated.
 */
function whitelistEntryToCompany(entry: CNPJWhitelistEntry): EnhancedCompanyData {
    return {
        cnpj: entry.cnpj,
        razao_social: entry.razao_social,
        nome_fantasia: entry.nome_fantasia,
        cnpj_raiz: entry.cnpj.slice(0, 8),
        data_inicio_atividade: '',
        data_situacao_cadastral: '',
        tipo_situacao_cadastral: 'ATIVA', // whitelist only contains active companies
        motivo_situacao_cadastral: '',
        codigo_natureza_juridica: '',
        opcao_pelo_mei: false,
        opcao_pelo_simples: false,
        capital_social: entry.capital_social,
        porte: entry.porte,
        descricao_tipo_de_logradouro: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cep: '',
        uf: entry.uf,
        codigo_municipio: 0,
        municipio: entry.municipio,
        qualificacao_do_responsavel: 0,
        cnae_fiscal: 0,
        cnae_fiscal_descricao: '',
        cnaes_secundarios: [],
        trust_score: entry.trust_score,
        trust_score_breakdown: {
            cadastral_situation: 40,
            capital_social: 0,
            activity_time: 0,
            company_size: 0,
            location: 0,
            total: entry.trust_score,
            level: entry.trust_score >= 80 ? 'excellent' : entry.trust_score >= 60 ? 'good' : entry.trust_score >= 40 ? 'medium' : 'low',
        },
        cached_at: entry.found_at,
        updated_at: entry.found_at,
    };
}

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
                    throw new Error('RATE_LIMIT');
                }
                if (response.status === 500) {
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
                    throw err;
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
                return data.isUsed === true;
            }
            return false;
        } catch {
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
            // Initialize cache (Supabase sync + localStorage merge)
            await cnpjCache.initialize();

            // Get whitelist entries WITH full data — fast-path candidates
            const whitelistEntries = cnpjCache.getAvailableWithData();
            const wordlist = await import('@/lib/mining/cnpj-wordlist').then(m => m.CNPJ_WORDLIST_2025);

            console.log(`[Mining] Cache loaded: ${whitelistEntries.length} whitelist CNPJs, ${wordlist.length} wordlist CNPJs`);

            // ─── PHASE 1: Fast-path whitelist ─────────────────────────────────
            // Process cached whitelist entries directly — no API call, no delay.
            // These are companies already validated in previous sessions.
            if (whitelistEntries.length > 0) {
                console.log(`[Mining] ⚡ Fast-path: testing ${whitelistEntries.length} cached whitelist entries...`);

                for (const entry of whitelistEntries) {
                    if (abortControllerRef.current.signal.aborted) break;
                    if (foundCompanies.length >= MINING_QUANTITY) break;

                    const cnpj = entry.cnpj;
                    if (triedCNPJs.current.has(cnpj)) continue;
                    triedCNPJs.current.add(cnpj);
                    tried++;

                    // Skip if trust_score < 65 (hard requirement)
                    if (entry.trust_score < 65) {
                        cnpjCache.processMiningResult(cnpj, { found: true, active: true, reason: 'FILTERED' });
                        continue;
                    }

                    // Convert to company stub for filter matching
                    const companyStub = whitelistEntryToCompany(entry);

                    // Check filters (synchronous, instant)
                    if (!matchesFilters(companyStub, filters)) {
                        cnpjCache.processMiningResult(cnpj, { found: true, active: true, reason: 'FILTERED' });
                        continue;
                    }

                    // Check if already taken by another user (one network call, no delay)
                    const isUsed = await checkCnpjUsage(cnpj);
                    if (isUsed) {
                        cnpjCache.processMiningResult(cnpj, { found: true, active: false, reason: 'USED' });
                        continue;
                    }

                    // ✅ Good to use — add directly from cache
                    foundCompanies.push(companyStub);
                    setCompanies([...foundCompanies]);
                    setProgress({
                        tried,
                        found: foundCompanies.length,
                        target: MINING_QUANTITY,
                        percentage: (foundCompanies.length / MINING_QUANTITY) * 100,
                        isComplete: false,
                    });

                    console.log(`[Mining] ⚡ Fast-path found: ${cnpj} (${entry.razao_social})`);
                }

                console.log(`[Mining] Fast-path complete: ${foundCompanies.length}/${MINING_QUANTITY} found from cache`);
            }

            // ─── PHASE 2: Slow-path — API mining for remaining slots ──────────
            if (foundCompanies.length < MINING_QUANTITY) {
                console.log(`[Mining] 🔄 API mining: need ${MINING_QUANTITY - foundCompanies.length} more companies...`);

                let wordlistIndex = 0;

                while (foundCompanies.length < MINING_QUANTITY) {
                    if (abortControllerRef.current.signal.aborted) break;

                    let cnpj: string;

                    // Use wordlist (preferred) or generate random
                    if (wordlistIndex < wordlist.length) {
                        cnpj = wordlist[wordlistIndex++];
                    } else {
                        do {
                            cnpj = generateValidCNPJ(filters.uf);
                        } while (triedCNPJs.current.has(cnpj));
                    }

                    // Skip if already tried or in blacklist/used
                    if (triedCNPJs.current.has(cnpj) || cnpjCache.shouldSkip(cnpj)) {
                        continue;
                    }

                    triedCNPJs.current.add(cnpj);
                    tried++;

                    // Update progress
                    setProgress({
                        tried,
                        found: foundCompanies.length,
                        target: MINING_QUANTITY,
                        percentage: (foundCompanies.length / MINING_QUANTITY) * 100,
                        isComplete: false,
                    });

                    try {
                        // Apply delay before each API request (except first)
                        if (tried > 1) {
                            await sleep(MINING_CONFIG.delayBetweenRequests);
                        }

                        const company = await fetchCompany(cnpj);

                        if (!company) {
                            cnpjCache.processMiningResult(cnpj, { found: false, reason: 'NOT_FOUND' });
                        } else if (matchesFilters(company, filters)) {
                            const isUsed = await checkCnpjUsage(cnpj);

                            if (isUsed) {
                                cnpjCache.processMiningResult(cnpj, { found: true, active: false, reason: 'USED' });
                                continue;
                            }

                            foundCompanies.push(company);

                            cnpjCache.processMiningResult(cnpj, {
                                found: true,
                                active: true,
                                data: company,
                            });

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
                            cnpjCache.processMiningResult(cnpj, { found: true, active: true, reason: 'FILTERED' });
                        }

                    } catch (err) {
                        if (err instanceof Error && err.name === 'AbortError') break;

                        if (err instanceof Error && err.message === 'RATE_LIMIT') {
                            console.log(`❌ Rate limit! Aguardando ${MINING_CONFIG.delayOnRateLimit / 1000}s...`);
                            await sleep(MINING_CONFIG.delayOnRateLimit);
                            console.log('✅ Retomando após rate limit...');
                            consecutiveErrors = 0;
                            tried--;
                            continue;
                        }

                        consecutiveErrors++;
                        if (consecutiveErrors >= MINING_CONFIG.maxConsecutiveErrors) {
                            throw new Error('Muitos erros consecutivos. Tente relaxar os filtros.');
                        }
                    }

                    // Safety limit
                    if (tried >= MINING_QUANTITY * 100) {
                        throw new Error('Limite de tentativas excedido. Tente relaxar os filtros.');
                    }
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
            isMiningRef.current = false;
            abortControllerRef.current = null;
        }
    }, []);

    const stopMining = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsMining(false);
        isMiningRef.current = false;
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
