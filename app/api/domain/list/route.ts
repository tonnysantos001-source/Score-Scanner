import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Buscar domínios verificados do usuário com suas landing pages
        const { data: domains, error: domainsError } = await supabase
            .from('verified_domains')
            .select(`
                id,
                company_cnpj,
                company_name,
                domain,
                is_verified,
                verified_at,
                created_at,
                landing_pages (
                    id,
                    slug,
                    is_active
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (domainsError) {
            console.error('Erro ao buscar domínios:', domainsError);
            return NextResponse.json(
                { error: 'Erro ao buscar domínios' },
                { status: 500 }
            );
        }

        // Formatar resposta
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const formattedDomains = domains.map(domain => ({
            id: domain.id,
            domain: domain.domain,
            company_name: domain.company_name,
            cnpj: domain.company_cnpj,
            is_verified: domain.is_verified,
            verified_at: domain.verified_at,
            created_at: domain.created_at,
            landing_page_url: domain.landing_pages && domain.landing_pages.length > 0
                ? `${baseUrl}/l/${domain.landing_pages[0].slug}`
                : null,
            landing_page_active: domain.landing_pages && domain.landing_pages.length > 0
                ? domain.landing_pages[0].is_active
                : false,
        }));

        return NextResponse.json({
            success: true,
            domains: formattedDomains,
        });

    } catch (error) {
        console.error('Erro ao listar domínios:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
