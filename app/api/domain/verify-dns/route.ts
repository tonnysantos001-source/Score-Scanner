import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import dns from 'dns/promises';

// IPs da Vercel (para verificação)
const VERCEL_IPS = [
    '76.76.21.21',
    '76.76.21.22',
    '76.223.126.88',
    '76.223.126.90',
];

// CNAME esperado
const VERCEL_CNAME = 'cname.vercel-dns.com';

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

        const domain = verifiedDomain.domain;
        let dnsStatus = 'failed';
        let dnsRecords: any = {};

        try {
            // Tentar resolver A records
            const aRecords = await dns.resolve4(domain).catch(() => []);
            dnsRecords.a_records = aRecords;

            // Verificar se algum IP aponta para Vercel
            const pointsToVercel = aRecords.some((ip: string) => VERCEL_IPS.includes(ip));

            if (pointsToVercel) {
                dnsStatus = 'active';
            } else {
                // Tentar resolver CNAME
                try {
                    const cnameRecords = await dns.resolveCname(domain);
                    dnsRecords.cname_records = cnameRecords;

                    // Verificar se CNAME aponta para Vercel
                    const cnamePointsToVercel = cnameRecords.some((cname: string) =>
                        cname.includes('vercel-dns.com')
                    );

                    if (cnamePointsToVercel) {
                        dnsStatus = 'active';
                    }
                } catch (cnameError) {
                    // CNAME não encontrado
                    dnsRecords.cname_error = 'No CNAME records found';
                }
            }
        } catch (error) {
            console.error('DNS lookup error:', error);
            dnsRecords.error = 'DNS lookup failed';
        }

        // Atualizar status no banco
        const updateData: any = {
            dns_status: dnsStatus,
            dns_records: dnsRecords,
            last_dns_check: new Date().toISOString(),
        };

        if (dnsStatus === 'active') {
            updateData.dns_verified_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('verified_domains')
            .update(updateData)
            .eq('id', domain_id);

        if (updateError) {
            console.error('Error updating DNS status:', updateError);
        }

        return NextResponse.json({
            success: true,
            dns_status: dnsStatus,
            dns_records: dnsRecords,
            message: dnsStatus === 'active'
                ? 'DNS configurado corretamente!'
                : 'DNS ainda não está apontando para Vercel. Aguarde a propagação ou verifique a configuração.',
        });

    } catch (error) {
        console.error('Error in verify-dns endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
