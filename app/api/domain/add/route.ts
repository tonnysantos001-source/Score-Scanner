import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateDomainOnVercel } from '@/lib/vercel/domain-manager';

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
        const { cnpj, domain, company_name } = body;

        if (!cnpj || !domain || !company_name) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validar formato de domínio
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        if (!domainRegex.test(domain)) {
            return NextResponse.json(
                { success: false, error: 'Formato de domínio inválido' },
                { status: 400 }
            );
        }

        // Verificar se domínio já existe
        const { data: existingDomain } = await supabase
            .from('verified_domains')
            .select('id')
            .eq('domain', domain)
            .single();

        if (existingDomain) {
            return NextResponse.json(
                { success: false, error: 'Este domínio já foi adicionado' },
                { status: 400 }
            );
        }

        // ─── 1. Registrar na Vercel + atribuir alias ao deployment de produção ──
        // activateDomainOnVercel faz 3 passos:
        //   a) Registra o domínio no projeto Vercel
        //   b) Busca o deployment de produção ativo (READY + PROMOTED)
        //   c) Atribui o domínio como alias desse deployment
        // Sem o passo c), a Vercel retorna timeout mesmo com DNS e SSL corretos.
        const vercelResult = await activateDomainOnVercel(domain);

        console.log(`[domain/add] Vercel activation for ${domain}:`, {
            registered: vercelResult.registered,
            aliasAssigned: vercelResult.aliasAssigned,
            deploymentId: vercelResult.deploymentId,
            error: vercelResult.error,
        });

        // Instruções de DNS
        const dnsInstructions = `Configure no seu registrador de domínio:\n\nTipo: CNAME\nNome: www\nValor: cname.vercel-dns.com\n\nOU\n\nTipo: A\nNome: @ (ou deixe em branco)\nValor: 76.76.21.21`;

        // ─── 2. Inserir domínio no banco ─────────────────────────────────────
        const { data: verifiedDomain, error: insertError } = await supabase
            .from('verified_domains')
            .insert({
                user_id: user.id,
                domain: domain,
                company_name: company_name,
                company_cnpj: cnpj,
                dns_status: 'pending',
                dns_instructions: dnsInstructions,
                is_verified: false,
                domain_type: 'external',
                custom_domain_status: 'pending',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting domain:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to add domain' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            domain_id: verifiedDomain.id,
            dns_instructions: dnsInstructions,
            vercel_registered: vercelResult.registered,
            vercel_alias_assigned: vercelResult.aliasAssigned,
            message: vercelResult.aliasAssigned
                ? 'Domínio adicionado e ativado na Vercel! Configure o DNS conforme as instruções.'
                : vercelResult.registered
                    ? 'Domínio salvo e registrado na Vercel. Configure o DNS e verifique para ativar.'
                    : `Domínio salvo, mas falha ao registrar na Vercel: ${vercelResult.error}`,
        });

    } catch (error) {
        console.error('Error in add domain endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
