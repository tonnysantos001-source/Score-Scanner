import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyDomainDNS } from '@/lib/domain/dns-verification';

export async function POST(request: NextRequest) {
    try {
        const { domain, domainId } = await request.json();

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // 1. Check Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Perform DNS Lookup
        const verification = await verifyDomainDNS(domain);

        // 3. Update Status in DB (if domainId provided)
        if (domainId) {
            const status = verification.verified ? 'active' : 'pending';
            const error = verification.error || null;

            await supabase
                .from('verified_domains')
                .update({
                    custom_domain_status: status,
                    custom_domain_error: error,
                    last_dns_check: new Date().toISOString(),
                    // If verified, update the main domain field to be this custom one
                    // OR keep it separate. Strategy: domain_type 'external'
                    domain_type: 'external'
                })
                .eq('id', domainId)
                .eq('user_id', user.id);
        }

        return NextResponse.json({
            success: true,
            verification
        });

    } catch (error) {
        console.error('DNS API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
