import { NextRequest, NextResponse } from 'next/server';
import { fetchCompanyWithCache } from '@/lib/api/brasilapi';
import { calculateTrustScore } from '@/lib/utils/trust-score';
import { validateCNPJ } from '@/lib/utils/cnpj';
import { EnhancedCompanyData } from '@/types/company';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const cnpj = searchParams.get('cnpj');

        if (!cnpj) {
            return NextResponse.json(
                { message: 'CNPJ é obrigatório' },
                { status: 400 }
            );
        }

        if (!validateCNPJ(cnpj)) {
            return NextResponse.json(
                { message: 'CNPJ inválido' },
                { status: 400 }
            );
        }

        // Fetch company data with caching
        const companyData = await fetchCompanyWithCache(cnpj);

        // Calculate trust score
        const trustScoreBreakdown = calculateTrustScore(companyData);

        // Enhance company data
        const enhancedData: EnhancedCompanyData = {
            ...companyData,
            trust_score: trustScoreBreakdown.total,
            trust_score_breakdown: trustScoreBreakdown,
            cached_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return NextResponse.json(enhancedData, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
            },
        });
    } catch (error) {
        console.error('CNPJ API Error:', error);

        if (error instanceof Error) {
            // Check for rate limiting
            if (error.message === 'RATE_LIMIT' || error.message.includes('Limite de requisições')) {
                return NextResponse.json(
                    { error: 'RATE_LIMIT', message: 'Limite de requisições excedido' },
                    { status: 429 }
                );
            }

            // Check for not found
            if (error.message.includes('não encontrado') || error.message.includes('CNPJ não encontrado')) {
                return NextResponse.json(
                    { error: 'NOT_FOUND', message: 'CNPJ não encontrado' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: error.message, message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
