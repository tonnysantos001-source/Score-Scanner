import { EnhancedCompanyData } from '@/types/company';
import { MiningFilters } from '@/types/filters';

/**
 * Check if a company matches the mining filters
 */
export function matchesFilters(
    company: EnhancedCompanyData,
    filters: MiningFilters
): boolean {
    // ALWAYS filter only ATIVA companies
    const isActive =
        company.tipo_situacao_cadastral.toUpperCase().includes('ATIVA') ||
        company.tipo_situacao_cadastral === '2';

    if (!isActive) return false;

    // Hard requirement: trust score must be >= 65
    if ((company.trust_score ?? 0) < 65) return false;

    // Check capital social minimum - ONLY if filter is enabled
    if (filters.useCapitalFilter) {
        if (company.capital_social < filters.capitalMinimo) return false;
    }

    // Check capital social MAXIMUM - ONLY if filter is enabled
    if (filters.useCapitalMaximoFilter && filters.capitalMaximo > 0) {
        if (company.capital_social > filters.capitalMaximo) return false;
    }

    // Check UF - ONLY if filter is enabled AND not AUTO
    if (filters.useUfFilter && filters.uf !== 'AUTO') {
        if (company.uf !== filters.uf) return false;
    }

    // Check porte - ONLY if filter is enabled AND not TODOS
    if (filters.usePorteFilter && filters.porte !== 'TODOS') {
        if (company.porte !== filters.porte) return false;
    }

    // Check payment institution & related companies - ONLY if filter is enabled
    if (filters.apenasPagamentos) {
        if (!isPaymentInstitution(company)) return false;
    }

    return true;
}

/**
 * Check if a company is a Payment Institution or payment-related entity
 */
export function isPaymentInstitution(company: EnhancedCompanyData): boolean {
    const textToSearch = [
        company.razao_social || '',
        company.nome_fantasia || '',
        company.cnae_fiscal_descricao || '',
        ...(company.cnaes_secundarios || []).map(c => c.descricao || '')
    ].join(' ').toUpperCase();

    const paymentKeywords = [
        'INSTITUICAO DE PAGAMENTO',
        'INSTITUICAO DE PAGAMENTOS',
        'INSTITUCAO DE PAGAMENTO',
        'MEIOS DE PAGAMENTO',
        'MEIO DE PAGAMENTO',
        'SERVICOS DE PAGAMENTO',
        'SOLUCOES DE PAGAMENTO',
        'SOLUCAO DE PAGAMENTO',
        'INTERMEDIACAO DE PAGAMENTO',
        'INTERMEDIACAO DE PAGAMENTOS',
        'PROCESSAMENTO DE PAGAMENTO',
        'PROCESSADORA',
        'SUBADQUIRENTE',
        'ADQUIRENCIA',
        'PAGAMENTO',
        'PAGAMENTOS',
        'PAGAR.ME',
        'PAGBANK',
        'PICPAY',
        'HOTMART',
        'GATEWAY',
        'CHECKOUT',
        'CARTOES DE CREDITO',
        'CARTAO DE CREDITO',
        'ADMINISTRACAO DE CARTOES',
        'OPERADORAS DE CARTOES',
        'AUXILIARES DOS SERVICOS FINANCEIROS',
        'ECOBANK',
        'FINTECH',
        'SOCIEDADE DE CREDITO'
    ];

    return paymentKeywords.some(keyword => textToSearch.includes(keyword));
}

/**
 * Calculate filter score (used for ranking)
 */
export function calculateFilterScore(
    company: EnhancedCompanyData,
    filters: MiningFilters
): number {
    let score = 0;

    // Prefer higher capital
    score += Math.min(30, (company.capital_social / 1000000) * 10);

    // Prefer higher trust score
    score += (company.trust_score / 100) * 50;

    // Prefer ATIVA status
    const isActive =
        company.tipo_situacao_cadastral.toUpperCase().includes('ATIVA') ||
        company.tipo_situacao_cadastral === '2';
    if (isActive) score += 20;

    return Math.min(100, Math.max(0, score));
}
