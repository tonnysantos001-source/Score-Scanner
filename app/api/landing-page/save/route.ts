import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        const { domain_id, title_text, description_text, use_generic, facebook_pixel_id } = body;

        if (!domain_id) {
            return NextResponse.json(
                { error: 'ID do domínio é obrigatório' },
                { status: 400 }
            );
        }

        // Verificar se o domínio pertence ao usuário
        const { data: verifiedDomain, error: domainError } = await supabase
            .from('verified_domains')
            .select('id, domain, company_name')
            .eq('id', domain_id)
            .eq('user_id', user.id)
            .single();

        if (domainError || !verifiedDomain) {
            return NextResponse.json(
                { error: 'Domínio não encontrado' },
                { status: 404 }
            );
        }

        // Buscar landing page existente
        const { data: existingLandingPage } = await supabase
            .from('landing_pages')
            .select('*')
            .eq('domain_id', domain_id)
            .single();

        let landingPageId: string;
        let slug: string;

        if (existingLandingPage) {
            // Atualizar landing page existente
            const { data: updatedLandingPage, error: updateError } = await supabase
                .from('landing_pages')
                .update({
                    title_text,
                    description_text,
                    use_generic: use_generic ?? true,
                    facebook_pixel_id,
                })
                .eq('id', existingLandingPage.id)
                .select()
                .single();

            if (updateError) {
                console.error('Erro ao atualizar landing page:', updateError);
                return NextResponse.json(
                    { error: 'Erro ao salvar landing page' },
                    { status: 500 }
                );
            }

            landingPageId = updatedLandingPage.id;
            slug = updatedLandingPage.slug;
        } else {
            return NextResponse.json(
                { error: 'Landing page não encontrada. Crie o token de verificação primeiro.' },
                { status: 404 }
            );
        }

        // Se houver Facebook Pixel, salvar ou atualizar configuração
        if (facebook_pixel_id) {
            const { data: existingConfig } = await supabase
                .from('facebook_configs')
                .select('id')
                .eq('landing_page_id', landingPageId)
                .single();

            if (existingConfig) {
                // Atualizar config existente
                await supabase
                    .from('facebook_configs')
                    .update({ pixel_id: facebook_pixel_id })
                    .eq('id', existingConfig.id);
            } else {
                // Criar nova config
                await supabase
                    .from('facebook_configs')
                    .insert({
                        landing_page_id: landingPageId,
                        pixel_id: facebook_pixel_id,
                    });
            }
        }

        // Montar URL pública
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const publicUrl = `${baseUrl}/l/${slug}`;

        return NextResponse.json({
            success: true,
            landing_page_id: landingPageId,
            slug,
            public_url: publicUrl,
            message: 'Landing page salva com sucesso! 🎉',
        });

    } catch (error) {
        console.error('Erro ao salvar landing page:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
