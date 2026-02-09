import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateSlug(companyName: string, cnpj: string): string {
    const clean = companyName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const cnpjSuffix = cnpj.slice(-4);
    return `${clean}-${cnpjSuffix}`;
}

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

        // Gerar slug para landing page
        const slug = generateSlug(company_name, cnpj);

        // Instruções DNS padrão
        const dnsInstructions = `Configure no seu registrador de domínio:

Tipo: CNAME
Nome: @ (ou deixe em branco)
Valor: cname.vercel-dns.com

OU

Tipo: A  
Nome: @ (ou deixe em branco)
Valor: 76.76.21.21`;

        // Inserir domínio no banco
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

        // Criar landing page inicial (inativa)
        const { error: landingPageError } = await supabase
            .from('landing_pages')
            .insert({
                domain_id: verifiedDomain.id,
                slug: slug,
                use_generic: true,
                is_active: false, // Só ativa quando DNS estiver configurado
            });

        if (landingPageError) {
            console.error('Error creating landing page:', landingPageError);
        }

        return NextResponse.json({
            success: true,
            domain_id: verifiedDomain.id,
            slug: slug,
            dns_instructions: dnsInstructions,
            message: 'Domínio adicionado! Configure o DNS conforme as instruções.',
        });

    } catch (error) {
        console.error('Error in add domain endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
