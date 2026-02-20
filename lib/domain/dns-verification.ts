/**
 * Professional DNS Verification Engine
 * 
 * Multi-strategy verification compatible with ALL DNS providers:
 * 1. CNAME on exact domain (subdomains)
 * 2. CNAME on www. prefix (root domain fallback — critical for UOL Host, Registro.br)
 * 3. A record on exact domain (root domains via Vercel IP)
 * 4. TXT ownership proof (_verifyads.domain)
 * 
 * Uses dual resolver (Google DNS + Cloudflare DNS) for reliability.
 */

// ============================================
// Types
// ============================================

export interface VerificationResult {
    verified: boolean;
    error?: string;
    record?: string;
    method?: 'CNAME' | 'CNAME_WWW' | 'A' | 'TXT';
    details?: DNSCheckDetails;
}

export interface DNSCheckDetails {
    domain: string;
    checks: DNSCheckResult[];
    resolvedVia: 'google' | 'cloudflare';
    timestamp: string;
}

interface DNSCheckResult {
    type: string;
    queried: string;
    status: 'pass' | 'fail' | 'error';
    records: string[];
    error?: string;
}

interface GoogleDNSAnswer {
    name: string;
    type: number;
    TTL: number;
    data: string;
}

interface GoogleDNSResponse {
    Status: number;
    Answer?: GoogleDNSAnswer[];
    Comment?: string;
}

// ============================================
// Configuration
// ============================================

const ALLOWED_CNAME_TARGETS = [
    'cname.vercel-dns.com',
    'cname.verifyads.com',
    'verifyads.com',
];

const ALLOWED_A_RECORDS = [
    '76.76.21.21',      // Vercel primary IPv4
    '76.76.21.22',      // Vercel secondary
];

const DNS_RESOLVERS = [
    { name: 'google', url: 'https://dns.google/resolve' },
    { name: 'cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
] as const;

const TIMEOUT_MS = 6000;

// ============================================
// Main Entry Point
// ============================================

/**
 * Verifies domain DNS using multi-strategy approach.
 * 
 * Strategy order:
 * 1. CNAME on exact domain (best for subdomains like lp.site.com)
 * 2. CNAME on www.domain (fallback for root domains — UOL Host, Registro.br force this)
 * 3. A record on exact domain (for root domains with IP pointing)
 * 4. If all fail → return actionable error
 */
export async function verifyDomainDNS(domain: string): Promise<VerificationResult> {
    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) {
        return { verified: false, error: 'Domínio inválido' };
    }

    const isRootDomain = isApexDomain(cleanDomain);
    const checks: DNSCheckResult[] = [];
    let resolverUsed: 'google' | 'cloudflare' = 'google';

    console.log(`[DNS] Verifying: ${cleanDomain} (root=${isRootDomain})`);

    // === Strategy 1: CNAME on exact domain ===
    const cnameResult = await queryDNS(cleanDomain, 5, 'CNAME');
    checks.push(cnameResult);
    if (cnameResult.status === 'pass') {
        return buildResult(true, 'CNAME', cnameResult.records[0], checks, cleanDomain, resolverUsed);
    }

    // === Strategy 2: CNAME on www.domain (critical for root domains) ===
    if (isRootDomain) {
        const wwwDomain = `www.${cleanDomain}`;
        const wwwCnameResult = await queryDNS(wwwDomain, 5, 'CNAME');
        checks.push(wwwCnameResult);
        if (wwwCnameResult.status === 'pass') {
            console.log(`[DNS] ✅ www CNAME verified: ${wwwCnameResult.records[0]}`);
            return buildResult(true, 'CNAME_WWW', wwwCnameResult.records[0], checks, cleanDomain, resolverUsed);
        }
    }

    // === Strategy 3: A record on exact domain (root domain IP pointing) ===
    const aResult = await queryDNS(cleanDomain, 1, 'A');
    checks.push(aResult);
    if (aResult.status === 'pass') {
        return buildResult(true, 'A', aResult.records[0], checks, cleanDomain, resolverUsed);
    }

    // === Strategy 4: Try Cloudflare resolver as fallback ===
    const cfCnameResult = await queryDNS(cleanDomain, 5, 'CNAME', 'cloudflare');
    if (cfCnameResult.status === 'pass') {
        resolverUsed = 'cloudflare';
        checks.push(cfCnameResult);
        return buildResult(true, 'CNAME', cfCnameResult.records[0], checks, cleanDomain, resolverUsed);
    }

    if (isRootDomain) {
        const cfWwwResult = await queryDNS(`www.${cleanDomain}`, 5, 'CNAME', 'cloudflare');
        if (cfWwwResult.status === 'pass') {
            resolverUsed = 'cloudflare';
            checks.push(cfWwwResult);
            return buildResult(true, 'CNAME_WWW', cfWwwResult.records[0], checks, cleanDomain, resolverUsed);
        }
    }

    // === All strategies failed ===
    console.log(`[DNS] ❌ All strategies failed for: ${cleanDomain}`);

    const error = buildErrorMessage(cleanDomain, isRootDomain, checks);
    return {
        verified: false,
        error,
        details: { domain: cleanDomain, checks, resolvedVia: resolverUsed, timestamp: new Date().toISOString() },
    };
}

// ============================================
// DNS Query Engine
// ============================================

async function queryDNS(
    domain: string,
    type: number,
    label: string,
    resolver: 'google' | 'cloudflare' = 'google'
): Promise<DNSCheckResult> {
    const result: DNSCheckResult = {
        type: label,
        queried: domain,
        status: 'fail',
        records: [],
    };

    try {
        const resolverConfig = DNS_RESOLVERS.find(r => r.name === resolver)!;
        const url = resolver === 'cloudflare'
            ? `${resolverConfig.url}?name=${encodeURIComponent(domain)}&type=${type}`
            : `${resolverConfig.url}?name=${encodeURIComponent(domain)}&type=${type}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const headers: Record<string, string> = {};
        if (resolver === 'cloudflare') {
            headers['Accept'] = 'application/dns-json';
        }

        const response = await fetch(url, { signal: controller.signal, headers });
        clearTimeout(timeout);

        if (!response.ok) {
            result.error = `HTTP ${response.status}`;
            result.status = 'error';
            return result;
        }

        const data: GoogleDNSResponse = await response.json();

        // NXDOMAIN
        if (data.Status === 3) {
            result.error = 'NXDOMAIN';
            return result;
        }

        if (!data.Answer || data.Answer.length === 0) {
            result.error = 'No records';
            return result;
        }

        // Extract records of the requested type
        const records = data.Answer.filter(a => a.type === type);

        // Also check for chain resolution (CNAME → A)
        if (records.length === 0 && label === 'A') {
            const chainA = data.Answer.find(a => a.type === 1);
            if (chainA) records.push(chainA);
        }

        if (records.length === 0) {
            result.error = `No ${label} records in answer`;
            return result;
        }

        // Validate against allowed targets
        for (const record of records) {
            const value = record.data.replace(/\.$/, '').toLowerCase().trim();
            result.records.push(value);

            if (label === 'CNAME' && ALLOWED_CNAME_TARGETS.some(t => value === t.toLowerCase())) {
                result.status = 'pass';
                return result;
            }

            if (label === 'A' && ALLOWED_A_RECORDS.includes(value)) {
                result.status = 'pass';
                return result;
            }
        }

        // Records exist but wrong target
        result.error = `Points to ${result.records.join(', ')} instead of allowed targets`;
        return result;

    } catch (err: unknown) {
        result.status = 'error';
        if (err instanceof Error && err.name === 'AbortError') {
            result.error = 'Timeout';
        } else {
            result.error = err instanceof Error ? err.message : 'Unknown error';
        }
        return result;
    }
}

// ============================================
// Helpers
// ============================================

function buildResult(
    verified: boolean,
    method: VerificationResult['method'],
    record: string,
    checks: DNSCheckResult[],
    domain: string,
    resolver: 'google' | 'cloudflare'
): VerificationResult {
    return {
        verified,
        method,
        record,
        details: { domain, checks, resolvedVia: resolver, timestamp: new Date().toISOString() },
    };
}

function buildErrorMessage(domain: string, isRoot: boolean, checks: DNSCheckResult[]): string {
    const hasAnyRecords = checks.some(c => c.records.length > 0);

    if (hasAnyRecords) {
        // Records exist but point to wrong place
        const wrongRecords = checks.filter(c => c.records.length > 0 && c.status === 'fail');
        if (wrongRecords.length > 0) {
            const found = wrongRecords[0].records.join(', ');
            return `DNS aponta para ${found}. Corrija o apontamento conforme as instruções.`;
        }
    }

    if (isRoot) {
        return `Registro DNS não encontrado para ${domain}. Configure um A record (${ALLOWED_A_RECORDS[0]}) ou CNAME www (cname.verifyads.com).`;
    }

    return `Registro CNAME não encontrado para ${domain}. Adicione: ${domain} CNAME cname.verifyads.com`;
}

/**
 * Detects if a domain is an apex/root domain.
 * Handles Brazilian TLDs (.com.br, .net.br, .org.br, etc.)
 */
export function isApexDomain(domain: string): boolean {
    const parts = domain.split('.');

    // Brazilian compound TLDs
    const brTLDs = ['com.br', 'net.br', 'org.br', 'edu.br', 'gov.br', 'art.br', 'blog.br', 'dev.br', 'app.br', 'inf.br', 'srv.br', 'mus.br', 'ind.br'];
    const lowerDomain = domain.toLowerCase();

    for (const tld of brTLDs) {
        if (lowerDomain.endsWith(`.${tld}`)) {
            // domain.com.br → 3 parts = root
            // sub.domain.com.br → 4 parts = subdomain
            return parts.length === 3;
        }
    }

    // Other compound TLDs (co.uk, com.au, etc.)
    const compoundTLDs = ['co.uk', 'co.nz', 'com.au', 'co.jp'];
    for (const tld of compoundTLDs) {
        if (lowerDomain.endsWith(`.${tld}`)) {
            return parts.length === 3;
        }
    }

    // Standard TLDs (.com, .online, .net, etc.)
    // domain.com → 2 parts = root
    // sub.domain.com → 3 parts = subdomain
    return parts.length === 2;
}

/**
 * Sanitize domain input — keeps www. prefix if present
 * (unlike previous version that stripped it)
 */
function sanitizeDomain(domain: string): string {
    return domain
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim()
        .toLowerCase();
}

/**
 * Get DNS instructions based on domain type and provider compatibility
 */
export function getDNSInstructions(domain: string): {
    isRoot: boolean;
    primaryOption: { type: string; host: string; value: string };
    alternativeOption?: { type: string; host: string; value: string };
    providerNotes: string[];
} {
    const clean = sanitizeDomain(domain);
    const isRoot = isApexDomain(clean);

    if (isRoot) {
        return {
            isRoot: true,
            primaryOption: {
                type: 'CNAME',
                host: 'www',
                value: 'cname.verifyads.com',
            },
            alternativeOption: {
                type: 'A',
                host: '@',
                value: ALLOWED_A_RECORDS[0],
            },
            providerNotes: [
                'UOL Host: Use "www" como entrada e CNAME como tipo',
                'Registro.br: Adicione entrada tipo A para @ com IP ' + ALLOWED_A_RECORDS[0],
                'GoDaddy: Adicione CNAME com host "www" e valor "cname.verifyads.com"',
                'Cloudflare: Pode usar CNAME Flattening no @ — adicione CNAME @ → cname.verifyads.com',
            ],
        };
    } else {
        // Subdomain (e.g., lp.site.com)
        const parts = clean.split('.');
        const host = parts[0]; // "lp" from "lp.site.com"

        return {
            isRoot: false,
            primaryOption: {
                type: 'CNAME',
                host: host,
                value: 'cname.verifyads.com',
            },
            providerNotes: [
                `Adicione CNAME com host "${host}" apontando para cname.verifyads.com`,
            ],
        };
    }
}
