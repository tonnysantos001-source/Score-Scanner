import { NextRequest, NextResponse } from 'next/server';

// Multi-API configuration - prioritize working APIs first
const CNPJ_APIS = [
    {
        name: 'ReceitaWS',
        buildUrl: (cnpj: string) => `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        priority: 1, // Works! Use first
    },
    {
        name: 'BrasilAPI',
        buildUrl: (cnpj: string) => `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        priority: 2,
    },
    {
        name: 'MinhaReceita',
        buildUrl: (cnpj: string) => `https://minhareceita.org/${cnpj}`,
        priority: 3,
    },
];

/**
 * Fetch from a single API with timeout and proper headers
 */
async function fetchFromAPI(url: string, apiName: string, timeoutMs: number = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ ${apiName} respondeu com sucesso!`);
        return { success: true, data, source: apiName };
    } catch (error) {
        clearTimeout(timeout);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ ${apiName} falhou: ${errorMsg}`);
        throw error;
    }
}

/**
 * Normalize data from different APIs to a common format
 */
function normalizeCompanyData(data: any, source: string) {
    if (source === 'ReceitaWS') {
        // ReceitaWS specific normalization
        return {
            cnpj: data.cnpj,
            razao_social: data.nome || data.razao_social,
            nome_fantasia: data.fantasia || data.nome_fantasia,
            situacao_cadastral: data.situacao || 'ATIVA',
            data_situacao_cadastral: data.data_situacao || data.data_situacao_cadastral,
            uf: data.uf,
            municipio: data.municipio,
            bairro: data.bairro,
            logradouro: data.logradouro,
            numero: data.numero,
            cep: data.cep,
            email: data.email,
            telefone: data.telefone,
            atividade_principal: data.atividade_principal ? [data.atividade_principal] : [],
            atividades_secundarias: data.atividades_secundarias || [],
            natureza_juridica: data.natureza_juridica,
            capital_social: parseFloat(String(data.capital_social || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0,
            porte: data.porte,
            data_inicio_atividade: data.abertura || data.data_inicio_atividade,
            qsa: data.qsa || [],
        };
    }

    if (source === 'MinhaReceita') {
        return {
            cnpj: data.cnpj,
            razao_social: data.razao_social || data.nome,
            nome_fantasia: data.nome_fantasia || data.fantasia,
            situacao_cadastral: data.situacao_cadastral || 'ATIVA',
            data_situacao_cadastral: data.data_situacao_cadastral,
            uf: data.uf,
            municipio: data.municipio,
            bairro: data.bairro,
            logradouro: data.logradouro,
            numero: data.numero,
            cep: data.cep,
            email: data.email,
            telefone: data.telefone || data.telefone1,
            atividade_principal: data.atividade_principal || [],
            atividades_secundarias: data.atividades_secundarias || [],
            natureza_juridica: data.natureza_juridica,
            capital_social: data.capital_social || 0,
            porte: data.porte,
            data_inicio_atividade: data.data_inicio_atividade,
            qsa: data.qsa || [],
        };
    }

    // BrasilAPI (default format)
    return data;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const cnpj = searchParams.get('cnpj');

        if (!cnpj) {
            return NextResponse.json(
                { error: 'CNPJ_REQUIRED', message: 'CNPJ é obrigatório' },
                { status: 400 }
            );
        }

        const cleanCNPJ = cnpj.replace(/\D/g, '');

        if (cleanCNPJ.length !== 14) {
            return NextResponse.json(
                { error: 'INVALID_CNPJ', message: 'CNPJ inválido' },
                { status: 400 }
            );
        }

        console.log(`🔍 Buscando CNPJ ${cleanCNPJ} em ${CNPJ_APIS.length} APIs...`);

        // Create parallel requests
        const apiPromises = CNPJ_APIS.map(api =>
            fetchFromAPI(api.buildUrl(cleanCNPJ), api.name)
        );

        // Use Promise.race to get first successful response
        try {
            const result = await Promise.race(apiPromises);

            if (result.success) {
                const normalizedData = normalizeCompanyData(result.data, result.source);

                // Calculate simple trust score based on available data
                const trustScore = calculateBasicTrustScore(normalizedData);

                const enhancedData = {
                    ...normalizedData,
                    trust_score: trustScore.total,
                    trust_score_breakdown: trustScore,
                    data_source: result.source,
                    cached_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                console.log(`✨ Retornando dados via ${result.source}`);

                return NextResponse.json(enhancedData, {
                    headers: {
                        'X-Data-Source': result.source,
                    },
                });
            }
        } catch (raceError) {
            // If race fails, wait for all and check results
            const allResults = await Promise.allSettled(apiPromises);
            const errors: string[] = [];

            for (const result of allResults) {
                if (result.status === 'rejected') {
                    errors.push(result.reason?.message || 'Unknown error');
                }
            }

            console.error('❌ Todas as APIs falharam:', errors);

            // Check error types
            if (errors.some(e => e.includes('429') || e.includes('403'))) {
                return NextResponse.json(
                    { error: 'RATE_LIMIT', message: 'Limite de requisições excedido' },
                    { status: 429 }
                );
            }

            if (errors.some(e => e.includes('404'))) {
                return NextResponse.json(
                    { error: 'NOT_FOUND', message: 'CNPJ não encontrado' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                {
                    error: 'ALL_APIS_FAILED',
                    message: 'Falha ao buscar CNPJ em todas as APIs',
                    details: errors,
                },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('❌ Erro na API route:', error);
        return NextResponse.json(
            { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

/**
 * Calculate basic trust score
 */
function calculateBasicTrustScore(data: any) {
    let total = 0;

    // Situação cadastral (20 pts)
    const situacaoAtiva = 20;
    if (data.situacao_cadastral === 'ATIVA') total += situacaoAtiva;

    // Capital social (15 pts)
    const capitalScore = Math.min(15, (data.capital_social || 0) > 100000 ? 15 : 5);
    total += capitalScore;

    // Tempo de atividade (20 pts) - simplified
    const tempoAtividade = 20;
    total += tempoAtividade;

    // Porte (10 pts)
    const porteScore = 10;
    total += porteScore;

    // Regularidade fiscal (10 pts) - default
    const regularidade = 10;
    total += regularidade;

    return {
        total,
        tempo_atividade: tempoAtividade,
        capital_social: capitalScore,
        situacao_cadastral: situacaoAtiva,
        porte_empresa: porteScore,
        regularidade_fiscal: regularidade,
    };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
