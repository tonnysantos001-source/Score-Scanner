import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { domain_id, title_text, description_text, facebook_pixel_id, is_active, slug, verification_token } = body;

        if (!domain_id) {
            return NextResponse.json(
                { success: false, error: 'domain_id is required' },
                { status: 400 }
            );
        }

        // Verificar se o domínio pertence ao usuário
        const { data: domain, error: domainError } = await supabase
            .from('verified_domains')
            .select('id')
            .eq('id', domain_id)
            .eq('user_id', user.id)
            .single();

        if (domainError || !domain) {
            return NextResponse.json(
                { success: false, error: 'Domínio não encontrado ou acesso negado' },
                { status: 404 }
            );
        }

        // 1. Atualizar verificação (Token) se fornecido
        if (typeof verification_token !== 'undefined') {
            await supabase
                .from('verified_domains')
                .update({ verification_token: verification_token || null })
                .eq('id', domain_id);
        }

        // 2. Atualizar Landing Page
        // Preparar objeto de update
        const updateData: any = {
            title_text,
            description_text,
            is_active: is_active !== undefined ? is_active : true,
            facebook_pixel_id,
            updated_at: new Date().toISOString(),
        };

        if (slug) updateData.slug = slug;

        const { error: updateError } = await supabase
            .from('landing_pages')
            .update(updateData)
            .eq('domain_id', domain_id);

        if (updateError) {
            console.error('Error updating landing page:', updateError);
            if (updateError.code === '23505') { // Unique violation
                return NextResponse.json(
                    { success: false, error: 'Este link personalizado (slug) já está em uso.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { success: false, error: 'Falha ao atualizar landing page' },
                { status: 500 }
            );
        }

        // Se facebook_pixel_id foi fornecido, atualizar ou criar facebook_configs
        if (facebook_pixel_id) {
            // Buscar landing_page_id
            const { data: landingPage } = await supabase
                .from('landing_pages')
                .select('id')
                .eq('domain_id', domain_id)
                .single();

            if (landingPage) {
                const { error: configError } = await supabase
                    .from('facebook_configs')
                    .upsert({
                        landing_page_id: landingPage.id,
                        pixel_id: facebook_pixel_id,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'landing_page_id'
                    });

                if (configError) {
                    console.error('Error updating facebook config:', configError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Landing page updated successfully',
        });
    } catch (error) {
        console.error('Error in update endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
