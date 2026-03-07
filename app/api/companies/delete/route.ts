import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/companies/delete
 * 
 * Deletes a saved company record from empresas_usadas.
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const companyId = body.company_id;

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
        }

        // Fetch the domain associated with this company before deleting
        const { data: companyData } = await supabase
            .from('empresas_usadas')
            .select('domain_id')
            .eq('id', companyId)
            .eq('user_id', user.id)
            .single();

        // Ensure the company belongs to this user
        const { error: deleteError } = await supabase
            .from('empresas_usadas')
            .delete()
            .eq('id', companyId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('[companies/delete] Error:', deleteError);
            return NextResponse.json({ success: false, error: 'Erro ao excluir empresa' }, { status: 500 });
        }

        // Clean up linked domain and landing page if they existed
        if (companyData?.domain_id) {
            // Remove the landing page
            await supabase
                .from('landing_pages')
                .delete()
                .eq('domain_id', companyData.domain_id);

            // Clears company linkage from domain
            await supabase
                .from('verified_domains')
                .update({ company_cnpj: null, company_name: null, verification_token: null })
                .eq('id', companyData.domain_id)
                .eq('user_id', user.id);
        }

        return NextResponse.json({ success: true, message: 'Empresa excluída com sucesso' });
    } catch (error) {
        console.error('[companies/delete] Error:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
