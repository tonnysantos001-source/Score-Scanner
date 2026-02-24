import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyDomainDNS } from '@/lib/domain/dns-verification';

export const revalidate = 0;

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

            console.log(`[verify-dns] Updating DB for ${domainName}: verified=${isVerified}, dnsStatus=${dnsStatus}`);

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
                // Note: do NOT include columns that don't exist in the table
                // dns_method was removed as it's not a real column
            }

            const { error: updateError } = await supabase
                .from('verified_domains')
                .update(updateData)
                .eq('id', domainId)
                .eq('user_id', user.id);

            if (updateError) {
                console.error(`[verify-dns] Error updating verified_domains:`, updateError);
                // We'll still return the verification result so the user sees the error
            }

            // If DNS verified, also activate associated landing page
            if (isVerified) {
                const { error: lpError } = await supabase
                    .from('landing_pages')
                    .update({ is_active: true })
                    .eq('domain_id', domainId);

                if (lpError) {
                    console.error(`[verify-dns] Error updating landing_pages:`, lpError);
                }

                // ── REGISTER DOMAIN ON VERCEL PROJECT ──────────────────────────
                // Without this, Vercel's CDN drops traffic from custom domains.
                // Requires VERCEL_TOKEN + VERCEL_PROJECT_ID in environment.
                const vercelToken = process.env.VERCEL_TOKEN;
                const vercelProjectId = process.env.VERCEL_PROJECT_ID;

                if (vercelToken && vercelProjectId) {
                    try {
                        const vercelRes = await fetch(
                            `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
                            {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${vercelToken}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ name: domainName }),
                            }
                        );

                        const vercelData = await vercelRes.json();

                        if (vercelRes.ok) {
                            console.log(`[verify-dns] ✅ Domain registered on Vercel: ${domainName}`);
                        } else if (vercelData.error?.code === 'domain_already_in_use') {
                            console.log(`[verify-dns] ℹ️ Domain already on Vercel: ${domainName}`);
                        } else {
                            console.error(`[verify-dns] ⚠️ Vercel domain registration failed:`, vercelData);
                        }
                    } catch (vercelErr) {
                        console.error(`[verify-dns] ⚠️ Vercel API call failed:`, vercelErr);
                    }
                } else {
                    console.warn(`[verify-dns] ⚠️ VERCEL_TOKEN or VERCEL_PROJECT_ID not set — domain not registered on Vercel.`);
                }
            }

        }

        console.log(`[verify-dns] Completed ${domainName}. Result:`, verification.verified ? 'Verified' : 'Failed');

        return NextResponse.json({
            success: true,
            verification: {
                verified: verification.verified,
                error: verification.error,
                method: verification.method,
                record: verification.record,
                details: verification.details,
            },
            dns_status: verification.verified ? 'verified' : 'pending',
        });

    } catch (error) {
        console.error('[verify-dns] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
