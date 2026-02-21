import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/companies/list
 * 
 * Lists all companies saved by the user (from empresas_usadas table).
 * Joins with verified_domains and landing_pages for full context.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
        }

        // Fetch companies with their associated domain and landing page data
        const { data: companies, error } = await supabase
            .from('empresas_usadas')
            .select(`
                id,
                cnpj,
                company_name,
                domain_id,
                created_at,
                verified_domains (
                    id,
                    domain,
                    is_verified,
                    custom_domain_status,
                    domain_type,
                    landing_pages (
                        id,
                        slug,
                        is_active,
                        title_text,
                        description_text
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[companies/list] DB Error:', error);
            return NextResponse.json({ success: false, error: 'Erro ao buscar empresas' }, { status: 500 });
        }

        // Format response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = (companies || []).map((c: any) => {
            const domain = c.verified_domains;
            const landingPage = domain?.landing_pages?.[0];
            const isActive = domain?.is_verified && domain?.custom_domain_status === 'active' && landingPage?.is_active;

            return {
                id: c.id,
                cnpj: c.cnpj,
                company_name: c.company_name,
                created_at: c.created_at,
                domain: domain?.domain || null,
                domain_id: c.domain_id,
                domain_verified: domain?.is_verified || false,
                domain_status: domain?.custom_domain_status || 'pending',
                landing_page_active: landingPage?.is_active || false,
                landing_page_url: isActive ? `https://${domain.domain}` : null,
                is_active: isActive,
            };
        });

        return NextResponse.json({ success: true, companies: formatted });
    } catch (error) {
        console.error('[companies/list] Error:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
