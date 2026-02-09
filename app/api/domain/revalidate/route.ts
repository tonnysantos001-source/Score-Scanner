import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchDomainHTML, checkMetaTagPresence } from '@/lib/utils/domain-utils';

export async function POST(request: NextRequest) {
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
        const { domain_id } = body;

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

        // Buscar HTML do domínio
        const { success, html, error: fetchError } = await fetchDomainHTML(verifiedDomain.domain);

        if (!success || !html) {
            return NextResponse.json({
                success: false,
                isValid: false,
                error: fetchError || 'Failed to fetch domain HTML',
            });
        }

        // Verificar meta tag
        const isMetaTagPresent = checkMetaTagPresence(html, verifiedDomain.verification_token);

        if (!isMetaTagPresent) {
            return NextResponse.json({
                success: false,
                isValid: false,
                error: 'Meta tag not found in domain HTML. Please ensure the meta tag is in the <head> of your homepage.',
            });
        }

        // Atualizar como verificado
        const { error: updateError } = await supabase
            .from('verified_domains')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString(),
            })
            .eq('id', domain_id);

        if (updateError) {
            console.error('Error updating verification status:', updateError);
            return NextResponse.json({
                success: false,
                isValid: false,
                error: 'Failed to update verification status',
            });
        }

        // Ativar landing page
        const { error: activateError } = await supabase
            .from('landing_pages')
            .update({ is_active: true })
            .eq('domain_id', domain_id);

        if (activateError) {
            console.error('Error activating landing page:', activateError);
        }

        return NextResponse.json({
            success: true,
            isValid: true,
            message: 'Domain verified successfully!',
            verified_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in revalidate endpoint:', error);
        return NextResponse.json(
            { success: false, isValid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
