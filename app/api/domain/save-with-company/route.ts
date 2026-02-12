import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateSlug(companyName: string, cnpj: string): string {
    const cleanName = companyName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
        .replace(/^-+|-+$/g, ''); // Remove hifens do início/fim

    const cnpjSuffix = cnpj.slice(-6); // Últimos 6 dígitos para garantir unicidade
    return `${cleanName}-${cnpjSuffix}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            company_cnpj,
            company_name
        } = body;

        if (!company_cnpj || !company_name) {
            return NextResponse.json({
                success: false,
                error: 'Dados incompletos'
            }, { status: 400 });
        }

        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Não autenticado'
            }, { status: 401 });
        }

        // Verificar se CNPJ já está em uso (Wordlist)
        const { data: existingCompany } = await supabase
            .from('empresas_usadas')
            .select('id, user_id, domain_id')
            .eq('cnpj', company_cnpj)
            .single();

        if (existingCompany) {
            // Se já existe e não é do usuário atual
            if (existingCompany.user_id !== user.id) {
                return NextResponse.json({
                    success: false,
                    error: 'Esta empresa já está sendo utilizada por outro cliente'
                }, { status: 409 });
            }

            // Se já é do usuário, retornar os dados existentes
            // Buscar o slug da landing page associada
            const { data: lp } = await supabase
                .from('landing_pages')
                .select('slug')
                .eq('domain_id', existingCompany.domain_id)
                .single();

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifyads.com.br';
            const fullUrl = lp ? `${baseUrl}/l/${lp.slug}` : null;

            return NextResponse.json({
                success: true,
                message: 'Empresa já estava salva',
                url: fullUrl,
                slug: lp?.slug
            });
        }

        // --- GERAÇÃO AUTOMÁTICA --- //

        // 1. Gerar Slug Único
        const slug = generateSlug(company_name, company_cnpj);
        const internalDomain = `${slug}.verifyads.com.br`; // Domínio interno para registro

        // 2. Criar Domínio "Verificado" (Internal)
        const { data: newDomain, error: domainError } = await supabase
            .from('verified_domains')
            .insert({
                domain: internalDomain,
                company_name,
                company_cnpj,
                user_id: user.id,
                is_verified: true, // Auto-verificado pois é nosso
                dns_status: 'verified',
                dns_instructions: 'Auto-generated'
            })
            .select('id')
            .single();

        if (domainError) {
            console.error('Erro ao criar domínio automático:', domainError);
            return NextResponse.json({
                success: false,
                error: 'Erro ao gerar link da empresa'
            }, { status: 500 });
        }

        const domainId = newDomain.id;

        // 3. Adicionar CNPJ na wordlist (empresas_usadas)
        const { error: wordlistError } = await supabase
            .from('empresas_usadas')
            .insert({
                cnpj: company_cnpj,
                user_id: user.id,
                domain_id: domainId,
                company_name
            });

        if (wordlistError) {
            console.error('Erro ao adicionar na wordlist:', wordlistError);
            // Idealmente faria rollback, mas vamos seguir
        }

        // 4. Criar Landing Page ATIVA
        const { error: lpError } = await supabase
            .from('landing_pages')
            .insert({
                domain_id: domainId,
                slug: slug,
                use_generic: true,
                is_active: true, // Já nasce ativa!
                title_text: company_name,
                description_text: `Conheça a ${company_name}, referência em qualidade e atendimento.Confira nossos dados verificados.`
            });

        if (lpError) {
            console.error('Erro ao criar landing page:', lpError);
            return NextResponse.json({
                success: false,
                error: 'Erro ao publicar página'
            }, { status: 500 });
        }

        // 5. Retornar Sucesso e URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://verifyads.com.br';
        const fullUrl = `${baseUrl}/l/${slug}`;

        return NextResponse.json({
            success: true,
            message: 'Página gerada com sucesso!',
            domain_id: domainId,
            slug: slug,
            url: fullUrl
        });

    } catch (error) {
        console.error('Erro na API save-with-company:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
