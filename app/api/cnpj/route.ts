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

        // Fetch from ReceitaWS
        const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
            }
            if (response.status === 429) {
                return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });
            }
            return NextResponse.json({ error: 'API_ERROR' }, { status: 500 });
        }

        const data = await response.json();

        // Return enhanced data
        return NextResponse.json({
            cnpj: data.cnpj,
            razao_social: data.nome,
            nome_fantasia: data.fantasia,
            situacao_cadastral: data.situacao || 'ATIVA',
            uf: data.uf,
            municipio: data.municipio,
            capital_social: parseFloat(String(data.capital_social || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0,
            porte: data.porte,
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
        return NextResponse.json(
            { error: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

export const runtime = 'edge';
