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

    if (!isActive) {
        return false;
    }

    // Check capital social (minimum only)
    const capital = company.capital_social;
    if (capital < filters.capitalMinimo) {
        return false;
    }

    // Check UF (if not AUTO)
    if (filters.uf !== 'AUTO' && company.uf !== filters.uf) {
        return false;
    }

    // Check porte (if not "TODOS")
    if (filters.porte !== 'TODOS') {
        if (company.porte !== filters.porte) {
            return false;
        }
    }

    return true;
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
