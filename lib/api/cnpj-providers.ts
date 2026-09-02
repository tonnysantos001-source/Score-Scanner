/**
 * CNPJ API Providers - Multi-source fallback system
 * 
 * This module provides a unified interface for querying CNPJ data
 * from multiple API providers with automatic fallback.
 */

export interface CNPJData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    tipo_situacao_cadastral: string;
    uf: string;
    municipio: string;
    capital_social: number;
    porte: string;
    qsa: any[];

    // Contact info
    ddd_telefone_1?: string;
    email?: string;

    // Full address
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;

    // Activity
    cnae_fiscal?: string | number;
    cnae_fiscal_descricao?: string;
    cnaes_secundarios?: Array<{ codigo: number | string; descricao: string }>;
    data_inicio_atividade?: string;
    data_situacao_cadastral?: string;
    motivo_situacao_cadastral?: string;
    data_especial?: string;
    codigo_natureza_juridica?: string;
    ente_federativo_responsavel?: string;
}

export interface ProviderResponse {
    success: boolean;
    data?: CNPJData;
    error?: string;
    status?: number;
    provider: string;
}

/**
 * Provider 1: ReceitaWS (Free, has cache limitations)
 */
export async function fetchFromReceitaWS(cnpj: string): Promise<ProviderResponse> {
    try {
        console.log(`🔍 [ReceitaWS] Tentando: ${cnpj}`);

        const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.log(`❌ [ReceitaWS] Status: ${response.status}`);
            return { success: false, status: response.status, error: `HTTP ${response.status}`, provider: 'ReceitaWS' };
        }

        const data = await response.json();

        // Check for ReceitaWS error responses
        if (data.status === 'ERROR') {
            console.log(`❌ [ReceitaWS] Erro: ${data.message}`);
            const isNotFound = data.message?.toLowerCase().includes('não existe') || data.message?.toLowerCase().includes('inválido');
            return { success: false, status: isNotFound ? 404 : 400, error: data.message, provider: 'ReceitaWS' };
        }

        console.log(`✅ [ReceitaWS] Sucesso: ${data.nome}`);

        return {
            success: true,
            status: 200,
            provider: 'ReceitaWS',
            data: {
                cnpj: data.cnpj,
                razao_social: data.nome,
                nome_fantasia: data.fantasia || data.nome,
                tipo_situacao_cadastral: data.situacao || 'ATIVA',
                uf: data.uf,
                municipio: data.municipio,
                capital_social: (function (val: any) {
                    let str = String(val || '0');
                    if (str.includes(',')) {
                        str = str.replace(/\./g, '').replace(',', '.');
                    }
                    return parseFloat(str) || 0;
                })(data.capital_social),
                porte: data.porte || 'NAO_INFORMADO',
                qsa: data.qsa || [],

                // ✅ Contact (ReceitaWS has these!)
                ddd_telefone_1: data.telefone || undefined,
                email: data.email || undefined,

                // ✅ Full address
                logradouro: data.logradouro || undefined,
                numero: data.numero || undefined,
                complemento: data.complemento || undefined,
                bairro: data.bairro || undefined,
                cep: data.cep || undefined,

                // ✅ Activity & Additional Data
                cnae_fiscal: data.atividade_principal?.[0]?.code || undefined,
                cnae_fiscal_descricao: data.atividade_principal?.[0]?.text || undefined,
                cnaes_secundarios: data.atividades_secundarias?.map((a: any) => ({ codigo: a.code, descricao: a.text })) || [],
                data_inicio_atividade: data.abertura ? data.abertura.split('/').reverse().join('-') : undefined,
                data_situacao_cadastral: data.data_situacao ? data.data_situacao.split('/').reverse().join('-') : undefined,
                motivo_situacao_cadastral: data.motivo_situacao || undefined,
                data_especial: data.data_situacao_especial || undefined,
                codigo_natureza_juridica: data.natureza_juridica || undefined,
                ente_federativo_responsavel: data.efr || undefined,
            },

        };
    } catch (error) {
        console.error(`❌ [ReceitaWS] Erro de rede:`, error);
        return { success: false, status: 500, error: 'Network error', provider: 'ReceitaWS' };
    }
}

/**
 * Provider 2: BrasilAPI (Free, more reliable, official data)
 */
export async function fetchFromBrasilAPI(cnpj: string): Promise<ProviderResponse> {
    try {
        console.log(`🔍 [BrasilAPI] Tentando: ${cnpj}`);

        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.log(`❌ [BrasilAPI] Status: ${response.status}`);
            return { success: false, status: response.status, error: `HTTP ${response.status}`, provider: 'BrasilAPI' };
        }

        const data = await response.json();

        console.log(`✅ [BrasilAPI] Sucesso: ${data.razao_social}`);

        return {
            success: true,
            status: 200,
            provider: 'BrasilAPI',
            data: {
                cnpj: data.cnpj,
                razao_social: data.razao_social,
                nome_fantasia: data.nome_fantasia || data.razao_social,
                tipo_situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
                uf: data.uf,
                municipio: data.municipio,
                capital_social: data.capital_social || 0,
                porte: data.porte || 'NAO_INFORMADO',
                qsa: data.qsa || [],

                // ✅ Contact (BrasilAPI has phone!)
                ddd_telefone_1: data.ddd_telefone_1 || data.ddd_telefone_2 || undefined,
                email: undefined, // BrasilAPI doesn't have email

                // ✅ Full address
                logradouro: (data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + ' ' : '') + data.logradouro || undefined,
                numero: data.numero || undefined,
                complemento: data.complemento || undefined,
                bairro: data.bairro || undefined,
                cep: data.cep || undefined,

                // ✅ Activity & Additional Data
                cnae_fiscal: data.cnae_fiscal_principal?.codigo || data.cnae_fiscal || undefined,
                cnae_fiscal_descricao: data.cnae_fiscal_principal?.descricao || data.cnae_fiscal_descricao || undefined,
                cnaes_secundarios: data.cnaes_secundarios || [],
                data_inicio_atividade: data.data_inicio_atividade || undefined,
                data_situacao_cadastral: data.data_situacao_cadastral || undefined,
                motivo_situacao_cadastral: data.motivo_situacao_cadastral || undefined,
                data_especial: data.data_especial || undefined,
                codigo_natureza_juridica: data.natureza_juridica || (data.codigo_natureza_juridica ? `${data.codigo_natureza_juridica}` : undefined),
                ente_federativo_responsavel: data.ente_federativo_responsavel || undefined,
            },

        };
    } catch (error) {
        console.error(`❌ [BrasilAPI] Erro de rede:`, error);
        return { success: false, status: 500, error: 'Network error', provider: 'BrasilAPI' };
    }
}

/**
 * Provider 3: CNPJ.WS (Free tier: 3 req/min, more comprehensive)
 */
export async function fetchFromCNPJWS(cnpj: string): Promise<ProviderResponse> {
    try {
        console.log(`🔍 [CNPJ.WS] Tentando: ${cnpj}`);

        const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.log(`❌ [CNPJ.WS] Status: ${response.status}`);
            return { success: false, status: response.status, error: `HTTP ${response.status}`, provider: 'CNPJ.WS' };
        }

        const data = await response.json();

        console.log(`✅ [CNPJ.WS] Sucesso: ${data.razao_social}`);

        return {
            success: true,
            status: 200,
            provider: 'CNPJ.WS',
            data: {
                cnpj: data.estabelecimento?.cnpj || cnpj,
                razao_social: data.razao_social,
                nome_fantasia: data.estabelecimento?.nome_fantasia || data.razao_social,
                tipo_situacao_cadastral: data.estabelecimento?.situacao_cadastral || 'ATIVA',
                uf: data.estabelecimento?.estado?.sigla || 'SP',
                municipio: data.estabelecimento?.cidade?.nome || '',
                capital_social: data.capital_social || 0,
                porte: data.porte?.descricao || 'NAO_INFORMADO',
                qsa: data.socios || [],

                // ✅ Activity & Additional Data
                cnae_fiscal: data.estabelecimento?.atividade_principal?.classificacao || undefined,
                cnae_fiscal_descricao: data.estabelecimento?.atividade_principal?.descricao || undefined,
                cnaes_secundarios: data.estabelecimento?.atividades_secundarias?.map((a: any) => ({ codigo: a.classificacao, descricao: a.descricao })) || [],
                data_inicio_atividade: data.estabelecimento?.data_inicio_atividade || undefined,
                data_situacao_cadastral: data.estabelecimento?.data_situacao_cadastral || undefined,
                motivo_situacao_cadastral: data.estabelecimento?.motivo_situacao_cadastral?.descricao || undefined,
                data_especial: data.estabelecimento?.data_situacao_especial || undefined,
                codigo_natureza_juridica: data.natureza_juridica?.descricao ? `${data.natureza_juridica.codigo} - ${data.natureza_juridica.descricao}` : undefined,
                ente_federativo_responsavel: data.ente_federativo_responsavel || undefined,
            },

        };
    } catch (error) {
        console.error(`❌ [CNPJ.WS] Erro de rede:`, error);
        return { success: false, status: 500, error: 'Network error', provider: 'CNPJ.WS' };
    }
}

/**
 * Main function: Try all providers in sequence until one succeeds
 */
export async function fetchCNPJFromAnyProvider(cnpj: string): Promise<ProviderResponse> {
    const providers = [
        fetchFromBrasilAPI, // 1st priority: BrasilAPI (official, generous rate limits)
        fetchFromReceitaWS, // 2nd priority: ReceitaWS (free tier: 3 req/min)
        fetchFromCNPJWS,    // 3rd priority: CNPJ.WS (free tier: 3 req/min)
    ];

    for (const provider of providers) {
        const result = await provider(cnpj);
        if (result.success) {
            console.log(`✅ Sucesso com ${result.provider}`);
            return result;
        }

        // If the error is a definitive 404 (Not Found), stop immediately to avoid rate limiting other APIs
        if (result.status === 404) {
            console.log(`ℹ️ [API] CNPJ ${cnpj} não cadastrado na Receita (404 de ${result.provider}). Parando.`);
            return {
                success: false,
                status: 404,
                error: 'NOT_FOUND',
                provider: result.provider,
            };
        }
    }

    console.log(`❌ CNPJ ${cnpj} não encontrado em nenhum provider`);
    return {
        success: false,
        status: 500,
        error: 'NOT_FOUND_IN_ANY_PROVIDER',
        provider: 'ALL',
    };
}
