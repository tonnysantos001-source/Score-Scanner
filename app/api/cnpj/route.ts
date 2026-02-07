import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const cnpj = request.nextUrl.searchParams.get('cnpj');

        if (!cnpj) {
            return NextResponse.json(
                { error: 'CNPJ_REQUIRED' },
                { status: 400 }
            );
        }

        const cleanCNPJ = cnpj.replace(/\D/g, '');

        if (cleanCNPJ.length !== 14) {
            return NextResponse.json(
                { error: 'INVALID_CNPJ' },
                { status: 400 }
            );
        }

        console.log(`🔍 [API] Buscando CNPJ: ${cleanCNPJ}`);

        // Fetch from ReceitaWS
        const apiUrl = `https://receitaws.com.br/v1/cnpj/${cleanCNPJ}`;
        console.log(`📡 [API] URL: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        console.log(`📊 [API] Status ReceitaWS: ${response.status}`);
        console.log(`📊 [API] Headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ [API] Erro ReceitaWS: ${response.status} - ${errorText}`);

            if (response.status === 404) {
                return NextResponse.json({ error: 'NOT_FOUND', details: errorText }, { status: 404 });
            }
            if (response.status === 429) {
                return NextResponse.json({ error: 'RATE_LIMIT', details: errorText }, { status: 429 });
            }
            if (response.status === 403) {
                return NextResponse.json({ error: 'BLOCKED', details: 'ReceitaWS bloqueou requisição' }, { status: 403 });
            }
            return NextResponse.json({ error: 'API_ERROR', details: errorText }, { status: 500 });
        }

        const data = await response.json();
        console.log(`✅ [API] Dados recebidos para: ${data.nome || 'SEM NOME'}`);

        // Check if ReceitaWS returned an error in JSON
        if (data.status === 'ERROR') {
            console.log(`❌ [API] ReceitaWS retornou erro: ${data.message}`);
            return NextResponse.json({ error: 'NOT_FOUND', details: data.message }, { status: 404 });
        }

        // Return enhanced data
        return NextResponse.json({
            cnpj: data.cnpj,
            razao_social: data.nome,
            nome_fantasia: data.fantasia,
            tipo_situacao_cadastral: data.situacao || 'ATIVA',
            uf: data.uf,
            municipio: data.municipio,
            capital_social: parseFloat(String(data.capital_social || 0).replace(/[^\\d,]/g, '').replace(',', '.')) || 0,
            porte: data.porte || 'NAO_INFORMADO',
            qsa: data.qsa || [],
            trust_score: 75,
            trust_score_breakdown: {
                total: 75,
                tempo_atividade: 20,
                capital_social: 15,
                situacao_cadastral: 20,
                porte_empresa: 10,
                regularidade_fiscal: 10,
            },
        });

    } catch (error) {
        console.error('❌ [API] Erro geral:', error);
        return NextResponse.json(
            { error: 'INTERNAL_ERROR', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}

export const runtime = 'edge';
