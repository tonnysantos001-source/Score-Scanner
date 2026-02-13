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
            company_name,
            custom_notes,
            verification_token,
            pixel_id
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

            // Se já é do usuário, ATUALIZAR dados e retornar
            console.log('Atualizando dados da empresa existente:', verification_token ? 'Com Token' : 'Sem Token');

            // 1. Atualizar verificação (Token)
            if (verification_token) {
                await supabase
                    .from('verified_domains')
                    .update({ verification_token })
                    .eq('id', existingCompany.domain_id);
            }

            // 2. Atualizar Landing Page (Pixel, Notas)
            const updateData: any = {};
            if (pixel_id) updateData.facebook_pixel_id = pixel_id;
            if (custom_notes) updateData.description_text = custom_notes;

            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from('landing_pages')
                    .update(updateData)
                    .eq('domain_id', existingCompany.domain_id);
            }

            // Buscar o slug
            const { data: lp } = await supabase
                .from('landing_pages')
                .select('slug')
                .eq('domain_id', existingCompany.domain_id)
                .single();

            const lpBaseUrl = 'https://verifyads.online';
            const fullUrl = lp ? `${lpBaseUrl}/l/${lp.slug}` : null;

            return NextResponse.json({
                success: true,
                message: 'Dados atualizados com sucesso',
                url: fullUrl,
                slug: lp?.slug
            });
        }

        // --- GERAÇÃO AUTOMÁTICA (NOVA EMPRESA) --- //

        // 1. Gerar Slug Único (Definir variáveis antes do uso)
        const slug = generateSlug(company_name, company_cnpj);
        const internalDomain = `${slug}.verifyads.com.br`;

        // 2. Verificar ou Criar Domínio "Verificado"
        let domainId;

        // Tentar buscar domínio já existente (pode ter sobrado de uma tentativa anterior falha ou deletada manualmente)
        const { data: existingDomain } = await supabase
            .from('verified_domains')
            .select('id')
            .eq('domain', internalDomain)
            .single();

        if (existingDomain) {
            domainId = existingDomain.id;
            // Atualizar token se necessário
            if (verification_token) {
                await supabase
                    .from('verified_domains')
                    .update({ verification_token })
                    .eq('id', domainId);
            }
        } else {
            // Criar novo
            const { data: newDomain, error: domainError } = await supabase
                .from('verified_domains')
                .insert({
                    domain: internalDomain,
                    company_name,
                    company_cnpj,
                    user_id: user.id,
                    is_verified: true,
                    dns_status: 'verified',
                    dns_instructions: 'Auto-generated',
                    verification_token: verification_token || null
                })
                .select('id')
                .single();

            if (domainError) {
                console.error('Erro ao criar domínio automático:', domainError);
                return NextResponse.json({
                    success: false,
                    error: `Erro ao gerar link: ${domainError.message}`
                }, { status: 500 });
            }
            domainId = newDomain.id;
        }

        // 3. Adicionar CNPJ na wordlist
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
        }

        // 4. Criar ou Atualizar Landing Page ATIVA
        // Verificar se já existe LP para este domínio
        const { data: existingLP } = await supabase
            .from('landing_pages')
            .select('id')
            .eq('domain_id', domainId)
            .single();

        let lpError;

        if (existingLP) {
            // Atualizar
            const { error: updateError } = await supabase
                .from('landing_pages')
                .update({
                    description_text: custom_notes || `Conheça a ${company_name}, referência em qualidade e atendimento.Confira nossos dados verificados.`,
                    facebook_pixel_id: pixel_id || null,
                    is_active: true // Garantir que reativa se estiver inativa
                })
                .eq('id', existingLP.id);
            lpError = updateError;
        } else {
            // Criar nova
            const { error: insertError } = await supabase
                .from('landing_pages')
                .insert({
                    domain_id: domainId,
                    slug: slug,
                    use_generic: true,
                    is_active: true,
                    title_text: company_name,
                    description_text: custom_notes || `Conheça a ${company_name}, referência em qualidade e atendimento.Confira nossos dados verificados.`,
                    facebook_pixel_id: pixel_id || null
                });
            lpError = insertError;
        }

        if (lpError) {
            console.error('Erro ao criar landing page:', lpError);
            return NextResponse.json({
                success: false,
                error: 'Erro ao publicar página'
            }, { status: 500 });
        }

        // 5. Retornar Sucesso e URL
        const lpBaseUrl = 'https://verifyads.online';
        const fullUrl = `${lpBaseUrl}/l/${slug}`;

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
