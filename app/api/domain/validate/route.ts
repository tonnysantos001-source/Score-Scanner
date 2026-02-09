import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchDomainHTML, checkMetaTagPresence } from '@/lib/utils/domain-utils';

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
        const { domain_id } = body;

        if (!domain_id) {
            return NextResponse.json(
                { error: 'ID do domínio é obrigatório' },
                { status: 400 }
            );
        }

        // Buscar domínio no banco
        const { data: verifiedDomain, error: domainError } = await supabase
            .from('verified_domains')
            .select('*')
            .eq('id', domain_id)
            .eq('user_id', user.id) // Garantir que é do usuário
            .single();

        if (domainError || !verifiedDomain) {
            return NextResponse.json(
                { error: 'Domínio não encontrado' },
                { status: 404 }
            );
        }

        if (verifiedDomain.is_verified) {
            return NextResponse.json({
                success: true,
                isValid: true,
                message: 'Domínio já está verificado',
                verified_at: verifiedDomain.verified_at,
            });
        }

        // Fazer fetch do HTML do domínio
        const { success, html, error: fetchError } = await fetchDomainHTML(verifiedDomain.domain);

        if (!success || !html) {
            return NextResponse.json(
                {
                    success: false,
                    isValid: false,
                    error: fetchError || 'Não foi possível acessar o domínio'
                },
                { status: 400 }
            );
        }

        // Verificar se a meta tag está presente
        const isMetaTagPresent = checkMetaTagPresence(html, verifiedDomain.verification_token);

        if (!isMetaTagPresent) {
            return NextResponse.json({
                success: false,
                isValid: false,
                error: 'Meta tag de verificação não encontrada no domínio. Certifique-se de que a meta tag está no <head> da sua página inicial.',
            });
        }

        // Meta tag encontrada! Marcar domínio como verificado
        const { data: updatedDomain, error: updateError } = await supabase
            .from('verified_domains')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString(),
            })
            .eq('id', domain_id)
            .select()
            .single();

        if (updateError) {
            console.error('Erro ao atualizar domínio:', updateError);
            return NextResponse.json(
                { error: 'Erro ao atualizar status de verificação' },
                { status: 500 }
            );
        }

        // Ativar landing page associada
        const { error: landingPageError } = await supabase
            .from('landing_pages')
            .update({ is_active: true })
            .eq('domain_id', domain_id);

        if (landingPageError) {
            console.error('Erro ao ativar landing page:', landingPageError);
        }

        return NextResponse.json({
            success: true,
            isValid: true,
            verified_at: updatedDomain.verified_at,
            message: 'Domínio verificado com sucesso! ✅',
        });

    } catch (error) {
        console.error('Erro ao validar domínio:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
