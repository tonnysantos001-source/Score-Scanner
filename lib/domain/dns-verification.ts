interface VerificationResult {
    verified: boolean;
    error?: string;
    record?: string;
}

/**
 * Verify if a domain CNAME points to our infrastructure
 * Target CNAME: verifyads.com (or cname.verifyads.com)
 * Uses Google Public DNS API for reliability across environments (Edge/Node/Local)
 */
export async function verifyDomainDNS(domain: string): Promise<VerificationResult> {
    try {
        // Remove protocol and trailing slashes
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        console.log(`Verifying DNS for: ${cleanDomain}`);

        // Use Google DNS API (DoH)
        // Type 5 = CNAME
        const response = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=5`);
        const data = await response.json();

        // Expected targets
        const allowedTargets = [
            'verifyads.com',
            'cname.verifyads.com',
            'cname.vercel-dns.com',
            process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'verifyads.com'
        ].map(t => t.toLowerCase());

        console.log('Google DNS Response:', data);

        if (!data.Answer) {
            // Try checking basic A record (Type 1) just in case they flattened it, 
            // but strictly we want CNAME. 
            // If Status is 0 (NOERROR) but no Answer, it means record doesn't exist.
            if (data.Status === 0) {
                return { verified: false, error: 'Registro CNAME não encontrado (Propagação)' };
            }
            return { verified: false, error: 'Domínio não encontrado ou erro DNS' };
        }

        // Check CNAME records
        // Answers structure: { name, type, TTL, data }
        const record = data.Answer.find((ans: any) => ans.type === 5); // 5 is CNAME

        if (!record) {
            return { verified: false, error: 'Nenhum registro CNAME encontrado' };
        }

        const targetValue = record.data.replace(/\.$/, '').toLowerCase(); // Remove trailing dot
        console.log('Found CNAME Target:', targetValue);

        const isValid = allowedTargets.some(target => targetValue.includes(target));

        if (isValid) {
            return { verified: true, record: targetValue };
        }

        return {
            verified: false,
            error: `CNAME aponta para ${targetValue}, deveria apontar para verifyads.com`,
            record: targetValue
        };

    } catch (error: any) {
        console.error('DNS Verification Error:', error);
        return { verified: false, error: 'Erro ao consultar DNS (Falha na conexão)' };
    }
}
