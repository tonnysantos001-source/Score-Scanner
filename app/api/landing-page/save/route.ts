import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Please login first' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { domain_id, facebook_verification_token, facebook_pixel_id } = body;

        if (!domain_id) {
            return NextResponse.json(
                { success: false, error: 'domain_id is required' },
                { status: 400 }
            );
        }

        // Buscar domínio
        const { data: verifiedDomain, error: domainError } = await supabase
            .from('verified_domains')
            .select('*')
            .eq('id', domain_id)
            .eq('user_id', user.id)
            .single();

        if (domainError || !verifiedDomain) {
            return NextResponse.json(
                { success: false, error: 'Domain not found' },
                { status: 404 }
            );
        }

        // Verificar se DNS está ativo
        if (verifiedDomain.dns_status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'DNS must be configured before publishing' },
                { status: 400 }
            );
        }

        // Atualizar token do Facebook no domínio
        const { error: updateDomainError } = await supabase
            .from('verified_domains')
            .update({
                facebook_verification_token: facebook_verification_token || null,
            })
            .eq('id', domain_id);

        if (updateDomainError) {
            console.error('Error updating domain:', updateDomainError);
            return NextResponse.json(
                { success: false, error: 'Failed to update domain' },
                { status: 500 }
            );
        }

        // Atualizar landing page
        const { error: updateLandingError } = await supabase
            .from('landing_pages')
            .update({
                facebook_pixel_id: facebook_pixel_id || null,
                is_active: true, // Ativar landing page
            })
            .eq('domain_id', domain_id);

        if (updateLandingError) {
            console.error('Error updating landing page:', updateLandingError);
            return NextResponse.json(
                { success: false, error: 'Failed to update landing page' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Landing page publicada com sucesso! Acesse seu domínio para testar.',
        });

    } catch (error) {
        console.error('Error in save landing page endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
