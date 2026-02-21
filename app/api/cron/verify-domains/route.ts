import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyDomainDNS } from '@/lib/domain/dns-verification';

/**
 * Background DNS Verification Cron Job
 * 
 * Runs every 5 minutes (configured in vercel.json).
 * Checks pending/failed domains and auto-verifies + activates landing pages.
 * 
 * Uses Supabase service role key to bypass RLS (server-to-server).
 */

// Admin client that bypasses RLS
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for cron job');
    }

    return createClient(url, serviceKey);
}

export async function GET(request: Request) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.log('[cron/verify-domains] Unauthorized request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getAdminClient();
        const startTime = Date.now();

        // Fetch domains that need checking
        // Priority: never-checked first, then oldest-checked
        const { data: domains, error: fetchError } = await supabase
            .from('verified_domains')
            .select('id, domain, custom_domain_status, domain_type, is_verified, user_id')
            .eq('domain_type', 'external')
            .in('custom_domain_status', ['pending', 'failed'])
            .order('last_dns_check', { ascending: true, nullsFirst: true })
            .limit(20); // Process max 20 per batch to stay within function time limit

        if (fetchError) {
            console.error('[cron/verify-domains] DB Error:', fetchError);
            return NextResponse.json(
                { error: 'Database error', details: fetchError.message },
                { status: 500 }
            );
        }

        if (!domains || domains.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending domains to check',
                checked: 0,
            });
        }

        console.log(`[cron/verify-domains] Checking ${domains.length} domains...`);

        const results: Array<{
            domain: string;
            verified: boolean;
            method?: string;
            error?: string;
        }> = [];

        for (const domainRecord of domains) {
            try {
                const verification = await verifyDomainDNS(domainRecord.domain);
                const isVerified = verification.verified;
                const dnsStatus = isVerified ? 'verified' : (verification.error ? 'error' : 'pending');
                const now = new Date().toISOString();

                const updateData: Record<string, unknown> = {
                    custom_domain_status: isVerified ? 'active' : domainRecord.custom_domain_status,
                    custom_domain_error: verification.error || null,
                    dns_status: dnsStatus,
                    dns_error_reason: verification.error || null,
                    last_dns_check: now,
                    last_dns_check_at: now,
                };

                // If verified, also mark as is_verified and set verified_at
                if (isVerified) {
                    updateData.is_verified = true;
                    updateData.verified_at = now;
                    updateData.dns_verified_at = now;
                    console.log(`[cron] ✅ Domain verified: ${domainRecord.domain} (${verification.method})`);
                }

                await supabase
                    .from('verified_domains')
                    .update(updateData)
                    .eq('id', domainRecord.id);

                // If verified, auto-activate landing page
                if (isVerified) {
                    await supabase
                        .from('landing_pages')
                        .update({ is_active: true })
                        .eq('domain_id', domainRecord.id);
                }

                results.push({
                    domain: domainRecord.domain,
                    verified: isVerified,
                    method: verification.method,
                    error: verification.error,
                });
            } catch (err) {
                console.error(`[cron] Error checking ${domainRecord.domain}:`, err);
                results.push({
                    domain: domainRecord.domain,
                    verified: false,
                    error: 'Internal error during check',
                });
            }
        }

        const elapsed = Date.now() - startTime;
        const verified = results.filter((r) => r.verified).length;

        console.log(`[cron/verify-domains] Done: ${results.length} checked, ${verified} verified, ${elapsed}ms`);

        return NextResponse.json({
            success: true,
            checked: results.length,
            verified,
            elapsed_ms: elapsed,
            results,
        });
    } catch (error) {
        console.error('[cron/verify-domains] Fatal Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
