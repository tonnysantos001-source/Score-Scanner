import { NextRequest, NextResponse } from 'next/server';
import { fetchCNPJFromAnyProvider } from '@/lib/api/cnpj-providers';

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

        // Try all providers with automatic fallback
        const result = await fetchCNPJFromAnyProvider(cleanCNPJ);

        if (!result.success) {
            console.log(`❌ [API] CNPJ não encontrado em nenhum provider`);
            return NextResponse.json(
                { error: 'NOT_FOUND', details: result.error },
                { status: 404 }
            );
        }

        console.log(`✅ [API] Sucesso com ${result.provider}`);

        // Add trust score calculation
        const trust_score = 75; // Placeholder

        return NextResponse.json({
            ...result.data,
            trust_score,
            trust_score_breakdown: {
                total: trust_score,
                tempo_atividade: 20,
                capital_social: 15,
                situacao_cadastral: 20,
                porte_empresa: 10,
                regularidade_fiscal: 10,
            },
            provider: result.provider, // Include which provider was used
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
