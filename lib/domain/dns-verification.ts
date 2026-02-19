import { resolveCname } from 'dns/promises';

interface VerificationResult {
    verified: boolean;
    error?: string;
    record?: string;
}

/**
 * Verify if a domain CNAME points to our infrastructure
 * Target CNAME: verifyads.com (or cname.verifyads.com)
 */
export async function verifyDomainDNS(domain: string): Promise<VerificationResult> {
    try {
        // Remove protocol and trailing slashes
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        console.log(`Verifying DNS for: ${cleanDomain}`);

        const records = await resolveCname(cleanDomain);

        // Expected targets (can be configured via ENV)
        const allowedTargets = [
            'verifyads.com',
            'cname.verifyads.com',
            'cname.vercel-dns.com',
            process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'verifyads.com'
        ];

        console.log('Found CNAME records:', records);

        // Check if any record matches our targets
        const isValid = records.some(record =>
            allowedTargets.some(target => record.includes(target))
        );

        if (isValid) {
            return { verified: true, record: records[0] };
        }

        return {
            verified: false,
            error: `CNAME points to ${records[0]}, but should point to ${allowedTargets[0]}`,
            record: records[0]
        };

    } catch (error: any) {
        console.error('DNS Verification Error:', error);

        let errorMsg = 'Unknown DNS error';
        if (error.code === 'ENODATA') errorMsg = 'No CNAME record found';
        if (error.code === 'ENOTFOUND') errorMsg = 'Domain not found';

        return { verified: false, error: errorMsg };
    }
}
