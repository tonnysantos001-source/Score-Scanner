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

        // Fetch the company info (including CNPJ and domain) before deleting
        const { data: companyData, error: fetchError } = await supabase
            .from('empresas_usadas')
            .select('id, cnpj, domain_id, company_name')
            .eq('id', companyId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !companyData) {
            return NextResponse.json({ success: false, error: 'Empresa não encontrada ou permissão negada' }, { status: 404 });
        }

        const cleanCnpj = companyData.cnpj ? companyData.cnpj.replace(/\D/g, '') : null;

        if (cleanCnpj) {
            console.log(`🚫 [companies/delete] Enviando CNPJ ${cleanCnpj} (${companyData.company_name}) para a blacklist permanente...`);

            // 1. Inserir na tabela cnpj_blacklist com motivo DISCARDED
            await supabase
                .from('cnpj_blacklist')
                .upsert({
                    cnpj: cleanCnpj,
                    reason: 'DISCARDED',
                }, {
                    onConflict: 'cnpj',
                });

            // 2. Remover da tabela cnpj_whitelist para que nunca mais apareça na mineração
            await supabase
                .from('cnpj_whitelist')
                .delete()
                .eq('cnpj', cleanCnpj);

            // 3. Garantir presença em cnpj_used
            const { data: existingUsed } = await supabase
                .from('cnpj_used')
                .select('id')
                .eq('cnpj', cleanCnpj)
                .maybeSingle();

            if (!existingUsed) {
                await supabase
                    .from('cnpj_used')
                    .insert({ cnpj: cleanCnpj });
            }
        }

        // Ensure the company is deleted from empresas_usadas
        const { error: deleteError } = await supabase
            .from('empresas_usadas')
            .delete()
            .eq('id', companyId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('[companies/delete] Error deleting from empresas_usadas:', deleteError);
            return NextResponse.json({ success: false, error: 'Erro ao excluir empresa' }, { status: 500 });
        }

        // Clean up linked domain and landing page if they existed
        if (companyData.domain_id) {
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

        return NextResponse.json({
            success: true,
            cnpj: cleanCnpj,
            company_name: companyData.company_name,
            message: 'Empresa excluída e movida para a blacklist com sucesso'
        });
    } catch (error) {
        console.error('[companies/delete] Error:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
