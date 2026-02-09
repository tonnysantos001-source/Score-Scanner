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
        const { domain_id, title_text, description_text, facebook_pixel_id, is_active } = body;

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
                { success: false, error: 'Domain not found or access denied' },
                { status: 404 }
            );
        }

        // Atualizar landing page
        const { error: updateError } = await supabase
            .from('landing_pages')
            .update({
                title_text,
                description_text,
                is_active: is_active !== undefined ? is_active : true,
                facebook_pixel_id,
                updated_at: new Date().toISOString(),
            })
            .eq('domain_id', domain_id);

        if (updateError) {
            console.error('Error updating landing page:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update landing page' },
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
