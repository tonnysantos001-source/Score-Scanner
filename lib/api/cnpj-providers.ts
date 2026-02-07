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
}

export interface ProviderResponse {
    success: boolean;
    data?: CNPJData;
    error?: string;
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
            return { success: false, error: `HTTP ${response.status}`, provider: 'ReceitaWS' };
        }

        const data = await response.json();

        // Check for ReceitaWS error responses
        if (data.status === 'ERROR') {
            console.log(`❌ [ReceitaWS] Erro: ${data.message}`);
            return { success: false, error: data.message, provider: 'ReceitaWS' };
        }

        console.log(`✅ [ReceitaWS] Sucesso: ${data.nome}`);

        return {
            success: true,
            provider: 'ReceitaWS',
            data: {
                cnpj: data.cnpj,
                razao_social: data.nome,
                nome_fantasia: data.fantasia || data.nome,
                tipo_situacao_cadastral: data.situacao || 'ATIVA',
                uf: data.uf,
                municipio: data.municipio,
                capital_social: parseFloat(String(data.capital_social || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0,
                porte: data.porte || 'NAO_INFORMADO',
                qsa: data.qsa || [],
            },
        };
    } catch (error) {
        console.error(`❌ [ReceitaWS] Erro de rede:`, error);
        return { success: false, error: 'Network error', provider: 'ReceitaWS' };
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
            return { success: false, error: `HTTP ${response.status}`, provider: 'BrasilAPI' };
        }

        const data = await response.json();

        console.log(`✅ [BrasilAPI] Sucesso: ${data.razao_social}`);

        return {
            success: true,
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
            },
        };
    } catch (error) {
        console.error(`❌ [BrasilAPI] Erro de rede:`, error);
        return { success: false, error: 'Network error', provider: 'BrasilAPI' };
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
            return { success: false, error: `HTTP ${response.status}`, provider: 'CNPJ.WS' };
        }

        const data = await response.json();

        console.log(`✅ [CNPJ.WS] Sucesso: ${data.razao_social}`);

        return {
            success: true,
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
            },
        };
    } catch (error) {
        console.error(`❌ [CNPJ.WS] Erro de rede:`, error);
        return { success: false, error: 'Network error', provider: 'CNPJ.WS' };
    }
}

/**
 * Main function: Try all providers in sequence until one succeeds
 */
export async function fetchCNPJFromAnyProvider(cnpj: string): Promise<ProviderResponse> {
    const providers = [
        fetchFromReceitaWS,
        fetchFromBrasilAPI,
        fetchFromCNPJWS,
    ];

    for (const provider of providers) {
        const result = await provider(cnpj);
        if (result.success) {
            console.log(`✅ Sucesso com ${result.provider}`);
            return result;
        }
    }

    console.log(`❌ CNPJ ${cnpj} não encontrado em nenhum provider`);
    return {
        success: false,
        error: 'NOT_FOUND_IN_ANY_PROVIDER',
        provider: 'ALL',
    };
}
