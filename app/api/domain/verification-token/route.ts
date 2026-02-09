import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateVerificationToken, generateMetaTag, validateDomainFormat, generateSlugFromName } from '@/lib/utils/domain-utils';

export async function POST(request: NextRequest) {
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

        // Parse do body
        const body = await request.json();
        const { cnpj, domain, company_name } = body;

        if (!cnpj || !domain || !company_name) {
            return NextResponse.json(
                { error: 'CNPJ, domínio e nome da empresa são obrigatórios' },
                { status: 400 }
            );
        }

        // Validar formato do domínio
        const domainValidation = validateDomainFormat(domain);
        if (!domainValidation.valid) {
            return NextResponse.json(
                { error: domainValidation.error },
                { status: 400 }
            );
        }

        const cleanDomain = domainValidation.cleanDomain;

        // Verificar se o domínio já está cadastrado
        const { data: existingDomain } = await supabase
            .from('verified_domains')
            .select('id, is_verified')
            .eq('domain', cleanDomain)
            .single();

        if (existingDomain) {
            return NextResponse.json(
                {
                    error: 'Este domínio já está cadastrado',
                    domain_id: existingDomain.id,
                    is_verified: existingDomain.is_verified
                },
                { status: 409 }
            );
        }

        // Gerar token de verificação
        const token = generateVerificationToken();
        const metaTag = generateMetaTag(token);

        // Inserir domínio no banco
        const { data: verifiedDomain, error: insertError } = await supabase
            .from('verified_domains')
            .insert({
                user_id: user.id,
                company_cnpj: cnpj,
                company_name,
                domain: cleanDomain,
                verification_token: token,
                is_verified: false,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Erro ao inserir domínio:', insertError);
            return NextResponse.json(
                { error: 'Erro ao salvar domínio no banco de dados' },
                { status: 500 }
            );
        }

        // Criar slug e preparar landing page
        const slug = generateSlugFromName(company_name);

        // Criar landing page inicial (será configurada depois)
        const { data: landingPage, error: landingPageError } = await supabase
            .from('landing_pages')
            .insert({
                domain_id: verifiedDomain.id,
                slug,
                use_generic: true,
                is_active: false, // Ativa apenas após validação
            })
            .select()
            .single();

        if (landingPageError) {
            console.error('Erro ao criar landing page:', landingPageError);
        }

        return NextResponse.json({
            success: true,
            domain_id: verifiedDomain.id,
            token,
            metaTag,
            domain: cleanDomain,
            landing_page_id: landingPage?.id,
            slug,
        });

    } catch (error) {
        console.error('Erro ao gerar token de verificação:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
