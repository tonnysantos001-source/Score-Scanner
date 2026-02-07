import { NextRequest, NextResponse } from 'next/server';

// Multi-API configuration for parallel requests
const CNPJ_APIS = [
    {
        name: 'BrasilAPI',
        buildUrl: (cnpj: string) => `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        priority: 1,
    },
    {
        name: 'ReceitaWS',
        buildUrl: (cnpj: string) => `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        priority: 2,
    },
    {
        name: 'MinhaReceita',
        buildUrl: (cnpj: string) => `https://minhareceita.org/${cnpj}`,
        priority: 3,
    },
];

/**
 * Fetch from a single API with timeout
 */
async function fetchFromAPI(url: string, apiName: string, timeoutMs: number = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`${apiName}: HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ ${apiName} respondeu com sucesso!`);
        return { success: true, data, source: apiName };
    } catch (error) {
        clearTimeout(timeout);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ ${apiName} falhou: ${errorMsg}`);
        throw new Error(`${apiName}: ${errorMsg}`);
    }
}

/**
 * Normalize data from different APIs to a common format
 */
function normalizeCompanyData(data: any, source: string) {
    // Different APIs return slightly different field names
    // Normalize to a common structure

    if (source === 'MinhaReceita') {
        // MinhaReceita uses different field names
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
            capital_social: data.capital_social,
            porte: data.porte,
            data_inicio_atividade: data.data_inicio_atividade,
            qsa: data.qsa || [],
        };
    }

    if (source === 'ReceitaWS') {
        return {
            cnpj: data.cnpj,
            razao_social: data.nome,
            nome_fantasia: data.fantasia,
            situacao_cadastral: data.situacao || 'ATIVA',
            data_situacao_cadastral: data.data_situacao,
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
            capital_social: parseFloat(String(data.capital_social || 0).replace(/[^\d,]/g, '').replace(',', '.')),
            porte: data.porte,
            data_inicio_atividade: data.abertura,
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

        // Clean CNPJ
        const cleanCNPJ = cnpj.replace(/\D/g, '');

        // Simple validation
        if (cleanCNPJ.length !== 14) {
            return NextResponse.json(
                { error: 'INVALID_CNPJ', message: 'CNPJ inválido' },
                { status: 400 }
            );
        }

        console.log(`🔍 Buscando CNPJ ${cleanCNPJ} em ${CNPJ_APIS.length} APIs simultaneamente...`);

        // Create parallel requests to all APIs
        const apiPromises = CNPJ_APIS.map(api =>
            fetchFromAPI(api.buildUrl(cleanCNPJ), api.name)
        );

        // Race: use the first successful response
        try {
            const result = await Promise.race(apiPromises);

            if (result.success) {
                // Normalize data
                const normalizedData = normalizeCompanyData(result.data, result.source);

                // Add trust score and metadata
                const enhancedData = {
                    ...normalizedData,
                    trust_score: 75,
                    trust_score_breakdown: {
                        total: 75,
                        tempo_atividade: 20,
                        capital_social: 15,
                        situacao_cadastral: 20,
                        porte_empresa: 10,
                        regularidade_fiscal: 10,
                    },
                    data_source: result.source, // Track which API responded
                    cached_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                console.log(`✨ Dados retornados com sucesso via ${result.source}`);

                return NextResponse.json(enhancedData, {
                    headers: {
                        'X-Data-Source': result.source,
                    },
                });
            }
        } catch (raceError) {
            // All APIs failed - try to get more details
            const allResults = await Promise.allSettled(apiPromises);
            const errors = allResults
                .filter(r => r.status === 'rejected')
                .map((r: any) => r.reason?.message || 'Unknown error');

            console.error('❌ Todas as APIs falharam:', errors);

            // Check if it's a rate limit issue
            if (errors.some(e => e.includes('429') || e.includes('403'))) {
                return NextResponse.json(
                    { error: 'RATE_LIMIT', message: 'Limite de requisições excedido em todas as APIs' },
                    { status: 429 }
                );
            }

            // Check if CNPJ was not found
            if (errors.some(e => e.includes('404'))) {
                return NextResponse.json(
                    { error: 'NOT_FOUND', message: 'CNPJ não encontrado' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                {
                    error: 'ALL_APIS_FAILED',
                    message: 'Todas as APIs falharam ao buscar o CNPJ',
                    details: errors,
                },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('❌ Erro geral na API route:', error);
        return NextResponse.json(
            { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// Vercel configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
