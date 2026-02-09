import crypto from 'crypto';

/**
 * Gera um token de verificação único e seguro para o Facebook
 * Formato: string hexadecimal de 32 caracteres
 */
export function generateVerificationToken(): string {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Gera a meta tag HTML completa para verificação do Facebook
 */
export function generateMetaTag(token: string): string {
    return `<meta name="facebook-domain-verification" content="${token}" />`;
}

/**
 * Valida o formato de um domínio
 * Aceita: example.com, subdomain.example.com
 * Não aceita: http://, https://, www. (são removidos automaticamente)
 */
export function validateDomainFormat(domain: string): { valid: boolean; cleanDomain: string; error?: string } {
    // Remove protocolo e www
    let cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, ''); // Remove trailing slash

    // Regex simples para validar domínio
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

    if (!cleanDomain) {
        return { valid: false, cleanDomain: '', error: 'Domínio não pode estar vazio' };
    }

    if (!domainRegex.test(cleanDomain)) {
        return { valid: false, cleanDomain, error: 'Formato de domínio inválido' };
    }

    return { valid: true, cleanDomain };
}

/**
 * Gera um slug URL-friendly a partir do nome da empresa
 * Exemplo: "SOLUÇÕES COMERCIO S.A" -> "solucoes-comercio-sa"
 */
export function generateSlugFromName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD') // Normaliza caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

/**
 * Faz fetch do HTML de um domínio
 */
export async function fetchDomainHTML(domain: string): Promise<{ success: boolean; html?: string; error?: string }> {
    try {
        // Garante que tem protocolo
        const url = domain.startsWith('http') ? domain : `https://${domain}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; VerifyAds-Bot/1.0)',
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Erro ao acessar domínio: ${response.status} ${response.statusText}`,
            };
        }

        const html = await response.text();
        return { success: true, html };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido ao acessar domínio',
        };
    }
}

/**
 * Verifica se a meta tag de verificação está presente no HTML
 */
export function checkMetaTagPresence(html: string, token: string): boolean {
    // Procura pela meta tag com o token específico
    const metaTagRegex = new RegExp(
        `<meta\\s+name=["']facebook-domain-verification["']\\s+content=["']${token}["']\\s*\\/?>`,
        'i'
    );

    return metaTagRegex.test(html);
}

/**
 * Extrai o ano de uma data string
 */
export function getYearFromDate(dateString: string | undefined): string {
    if (!dateString) return new Date().getFullYear().toString();

    try {
        const date = new Date(dateString);
        return date.getFullYear().toString();
    } catch {
        return new Date().getFullYear().toString();
    }
}

/**
 * Gera texto genérico para landing page baseado nos dados da empresa
 */
export function generateGenericLandingPageText(companyData: {
    razao_social?: string;
    nome_fantasia?: string;
    data_abertura?: string;
    descricao_cnae?: string;
}): { title: string; description: string } {
    const title = companyData.razao_social || companyData.nome_fantasia || 'Nossa Empresa';
    const year = getYearFromDate(companyData.data_abertura);
    const activity = companyData.descricao_cnae || 'diversos segmentos';

    const description = `Somos a ${title}, uma empresa estabelecida desde ${year}, oferecendo serviços de qualidade no segmento de ${activity}. Nossa missão é fornecer as melhores soluções para nossos clientes com excelência e compromisso.`;

    return { title, description };
}
