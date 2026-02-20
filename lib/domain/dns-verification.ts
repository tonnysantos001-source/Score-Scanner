/**
 * DNS Verification Service
 * Supports: CNAME (type 5), A record (type 1), AAAA (type 28)
 * Uses Google Public DNS API (DoH) for reliability across environments
 */

interface VerificationResult {
    verified: boolean;
    error?: string;
    record?: string;
    method?: 'CNAME' | 'A' | 'AAAA';
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
}

// Allowed targets — exact match only (no partial .includes)
const ALLOWED_CNAME_TARGETS = [
    'cname.vercel-dns.com',
    'cname.verifyads.com',
    'verifyads.com',
];

const ALLOWED_A_RECORDS = [
    '76.76.21.21',      // Vercel primary
    '76.76.21.22',      // Vercel secondary (some setups)
];

/**
 * Main entry: Verifies domain DNS for our infrastructure.
 * Tries CNAME first, then A record as fallback (for root domains).
 */
export async function verifyDomainDNS(domain: string): Promise<VerificationResult> {
    const cleanDomain = sanitizeDomain(domain);

    if (!cleanDomain) {
        return { verified: false, error: 'Domínio inválido' };
    }

    console.log(`[DNS] Verifying: ${cleanDomain}`);

    // Step 1: Try CNAME (preferred for subdomains)
    const cnameResult = await checkRecord(cleanDomain, 5, 'CNAME');
    if (cnameResult.verified) {
        console.log(`[DNS] ✅ CNAME verified: ${cnameResult.record}`);
        return cnameResult;
    }

    // Step 2: Try A record (required for root domains like example.com.br)
    const aResult = await checkRecord(cleanDomain, 1, 'A');
    if (aResult.verified) {
        console.log(`[DNS] ✅ A record verified: ${aResult.record}`);
        return aResult;
    }

    // Step 3: Return the most helpful error
    console.log(`[DNS] ❌ Not verified. CNAME error: ${cnameResult.error}, A error: ${aResult.error}`);

    // Prefer CNAME error message if both failed (more actionable)
    const error = cnameResult.error?.includes('não encontrado')
        ? 'Registro DNS não encontrado. Configure CNAME ou A record conforme instruções.'
        : cnameResult.error || aResult.error || 'DNS não configurado';

    return { verified: false, error };
}

/**
 * Check a specific DNS record type via Google DoH
 */
async function checkRecord(
    domain: string,
    type: number,
    label: 'CNAME' | 'A' | 'AAAA'
): Promise<VerificationResult> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!response.ok) {
            return {
                verified: false,
                error: `Erro ao consultar DNS (HTTP ${response.status})`,
            };
        }

        const data: GoogleDNSResponse = await response.json();

        // Status 0 = NOERROR, Status 3 = NXDOMAIN
        if (data.Status === 3) {
            return {
                verified: false,
                error: 'Domínio não existe (NXDOMAIN)',
            };
        }

        if (!data.Answer || data.Answer.length === 0) {
            return {
                verified: false,
                error: `Registro ${label} não encontrado (pode estar em propagação)`,
            };
        }

        // Filter answers by the requested type
        const relevantRecords = data.Answer.filter((ans) => ans.type === type);

        if (relevantRecords.length === 0) {
            // Sometimes Google DNS returns chain (CNAME -> A).
            // If we asked for A and got answers but none are type 1,
            // check if final answer resolves to our IP
            if (label === 'A') {
                const anyARecord = data.Answer.find((ans) => ans.type === 1);
                if (anyARecord) {
                    relevantRecords.push(anyARecord);
                }
            }

            if (relevantRecords.length === 0) {
                return {
                    verified: false,
                    error: `Registro ${label} não encontrado entre as respostas DNS`,
                };
            }
        }

        // Validate records
        for (const record of relevantRecords) {
            const value = record.data.replace(/\.$/, '').toLowerCase().trim();

            if (label === 'CNAME') {
                // Exact match only — no partial matching for security
                const isValid = ALLOWED_CNAME_TARGETS.some(
                    (target) => value === target.toLowerCase()
                );
                if (isValid) {
                    return { verified: true, record: value, method: 'CNAME' };
                }
            } else if (label === 'A') {
                const isValid = ALLOWED_A_RECORDS.includes(value);
                if (isValid) {
                    return { verified: true, record: value, method: 'A' };
                }
            } else if (label === 'AAAA') {
                // Future: add IPv6 validation
                return { verified: false, error: 'IPv6 check not yet supported' };
            }
        }

        // Records found but pointing to wrong target
        const foundValues = relevantRecords.map((r) => r.data.replace(/\.$/, '')).join(', ');
        const expectedTargets = label === 'CNAME'
            ? ALLOWED_CNAME_TARGETS.join(' ou ')
            : ALLOWED_A_RECORDS.join(' ou ');

        return {
            verified: false,
            error: `${label} aponta para ${foundValues}. Deveria apontar para: ${expectedTargets}`,
            record: foundValues,
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return {
                verified: false,
                error: `Timeout ao consultar DNS (${label}). Tente novamente.`,
            };
        }
        console.error(`[DNS] Error checking ${label}:`, error);
        return {
            verified: false,
            error: `Erro ao consultar DNS (${label}): ${error.message || 'Falha na conexão'}`,
        };
    }
}

/**
 * Sanitize domain input
 */
function sanitizeDomain(domain: string): string {
    return domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .trim()
        .toLowerCase();
}
