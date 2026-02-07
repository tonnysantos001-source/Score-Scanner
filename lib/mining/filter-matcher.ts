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
        console.log(`❌ Rejeitado: ${company.cnpj} - Status: ${company.tipo_situacao_cadastral} (não ativo)`);
        return false;
    }

    // Check capital social - ONLY if filter is enabled
    if (filters.useCapitalFilter) {
        const capital = company.capital_social;
        if (capital < filters.capitalMinimo) {
            console.log(`❌ Rejeitado: ${company.cnpj} - Capital R$ ${capital} < R$ ${filters.capitalMinimo}`);
            return false;
        }
    }

    // Check UF - ONLY if filter is enabled AND not AUTO
    if (filters.useUfFilter && filters.uf !== 'AUTO') {
        if (company.uf !== filters.uf) {
            console.log(`❌ Rejeitado: ${company.cnpj} - UF ${company.uf} !== ${filters.uf}`);
            return false;
        }
    }

    // Check porte - ONLY if filter is enabled AND not TODOS
    if (filters.usePorteFilter && filters.porte !== 'TODOS') {
        if (company.porte !== filters.porte) {
            console.log(`❌ Rejeitado: ${company.cnpj} - Porte ${company.porte} !== ${filters.porte}`);
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
