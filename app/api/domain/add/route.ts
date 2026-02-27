import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Vercel API helper ────────────────────────────────────────────────────────

async function registerDomainOnVercel(domain: string): Promise<{ ok: boolean; error?: string }> {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
        console.warn('[Vercel] VERCEL_TOKEN ou VERCEL_PROJECT_ID não configurado');
        return { ok: false, error: 'Vercel credentials not configured' };
    }

    try {
        const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: domain }),
        });

        const data = await res.json();

        if (!res.ok) {
            // 409 = domínio já existe no projeto (não é erro fatal)
            if (res.status === 409) {
                console.log(`[Vercel] Domínio ${domain} já estava registrado na Vercel (409).`);
                return { ok: true };
            }
            console.error('[Vercel] Erro ao registrar domínio:', data);
            return { ok: false, error: data.error?.message || 'Vercel registration failed' };
        }

        console.log(`[Vercel] ✅ Domínio ${domain} registrado com sucesso na Vercel.`);
        return { ok: true };
    } catch (err) {
        console.error('[Vercel] Exceção ao registrar domínio:', err);
        return { ok: false, error: 'Network error calling Vercel API' };
    }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

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

        // ─── 1. Registrar na Vercel ANTES de salvar no banco ─────────────────
        const vercelResult = await registerDomainOnVercel(domain);

        // Instruções de DNS
        const dnsInstructions = `Configure no seu registrador de domínio:

Tipo: CNAME
Nome: @ (ou deixe em branco)
Valor: cname.vercel-dns.com

OU

Tipo: A  
Nome: @ (ou deixe em branco)
Valor: 76.76.21.21`;

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
            vercel_registered: vercelResult.ok,
            message: vercelResult.ok
                ? 'Domínio adicionado e registrado na Vercel! Configure o DNS conforme as instruções.'
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
