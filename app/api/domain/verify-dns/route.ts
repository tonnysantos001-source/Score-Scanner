import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyDomainDNS } from '@/lib/domain/dns-verification';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Accept both param styles for backwards compatibility
        const domain = body.domain;
        const domainId = body.domainId || body.domain_id;

        if (!domain && !domainId) {
            return NextResponse.json(
                { error: 'domain or domainId is required' },
                { status: 400 }
            );
        }

        // 1. Check Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. If only domainId is given, look up the domain name from DB
        let domainName = domain;
        if (!domainName && domainId) {
            const { data: domainRecord } = await supabase
                .from('verified_domains')
                .select('domain')
                .eq('id', domainId)
                .eq('user_id', user.id)
                .single();

            if (!domainRecord) {
                return NextResponse.json(
                    { error: 'Domínio não encontrado' },
                    { status: 404 }
                );
            }
            domainName = domainRecord.domain;
        }

        // 3. Perform DNS Lookup
        const verification = await verifyDomainDNS(domainName);

        // 4. Update Status in DB
        if (domainId) {
            const isVerified = verification.verified;
            const newStatus = isVerified ? 'active' : 'pending';
            const dnsStatus = isVerified ? 'verified' : (verification.error ? 'error' : 'pending');

            const now = new Date().toISOString();
            const updateData: Record<string, unknown> = {
                custom_domain_status: newStatus,
                custom_domain_error: verification.error || null,
                dns_status: dnsStatus,
                last_dns_check: now,
                domain_type: 'external',
            };

            // If DNS verified, also mark domain flags
            if (isVerified) {
                updateData.is_verified = true;
                updateData.verified_at = now;
                updateData.dns_method = verification.method || 'CNAME';
            }

            await supabase
                .from('verified_domains')
                .update(updateData)
                .eq('id', domainId)
                .eq('user_id', user.id);

            // If DNS verified, also activate associated landing page
            if (isVerified) {
                await supabase
                    .from('landing_pages')
                    .update({ is_active: true })
                    .eq('domain_id', domainId);
            }
        }

        return NextResponse.json({
            success: true,
            verification: {
                verified: verification.verified,
                error: verification.error,
                method: verification.method,
                record: verification.record,
                details: verification.details,
            },
            dns_status: verification.verified ? 'active' : 'pending',
        });

    } catch (error) {
        console.error('[verify-dns] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
