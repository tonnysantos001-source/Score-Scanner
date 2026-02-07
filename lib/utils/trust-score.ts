import { CompanyData, TrustScoreBreakdown } from '@/types/company';

/**
 * Calculate trust score for a company based on multiple factors
 */
export function calculateTrustScore(company: CompanyData): TrustScoreBreakdown {
    let cadastralScore = 0;
    let capitalScore = 0;
    let activityTimeScore = 0;
    let companySizeScore = 0;
    let locationScore = 0;

    // 1. Situação Cadastral (40 points)
    switch (company.tipo_situacao_cadastral?.toUpperCase()) {
        case 'ATIVA':
        case '2': // Code for ATIVA
            cadastralScore = 40;
            break;
        case 'SUSPENSA':
            cadastralScore = 20;
            break;
        case 'INAPTA':
            cadastralScore = 10;
            break;
        default:
            cadastralScore = 0;
    }

    // 2. Capital Social (25 points)
    const capital = company.capital_social || 0;
    if (capital >= 1000000) {
        capitalScore = 25;
    } else if (capital >= 500000) {
        capitalScore = 22;
    } else if (capital >= 100000) {
        capitalScore = 20;
    } else if (capital >= 50000) {
        capitalScore = 17;
    } else if (capital >= 10000) {
        capitalScore = 15;
    } else if (capital >= 1000) {
        capitalScore = 12;
    } else {
        capitalScore = 10;
    }

    // 3. Tempo de Atividade (20 points)
    if (company.data_inicio_atividade) {
        const startDate = new Date(company.data_inicio_atividade);
        const now = new Date();
        const yearsActive = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

        if (yearsActive >= 20) {
            activityTimeScore = 20;
        } else if (yearsActive >= 10) {
            activityTimeScore = 18;
        } else if (yearsActive >= 5) {
            activityTimeScore = 15;
        } else if (yearsActive >= 2) {
            activityTimeScore = 12;
        } else if (yearsActive >= 1) {
            activityTimeScore = 8;
        } else {
            activityTimeScore = 5;
        }
    }

    // 4. Porte da Empresa (10 points)
    switch (company.porte?.toUpperCase()) {
        case 'DEMAIS':
        case '05': // Code for DEMAIS
            companySizeScore = 10;
            break;
        case 'EPP':
        case 'EMPRESA DE PEQUENO PORTE':
        case '03':
            companySizeScore = 8;
            break;
        case 'ME':
        case 'MICROEMPRESA':
        case '01':
            companySizeScore = 6;
            break;
        case 'MEI':
        case '00':
            companySizeScore = 4;
            break;
        default:
            companySizeScore = 5;
    }

    // 5. Localização (5 points) - Major cities bonus
    const majorCities = [
        'SÃO PAULO',
        'RIO DE JANEIRO',
        'BRASÍLIA',
        'BELO HORIZONTE',
        'CURITIBA',
        'PORTO ALEGRE',
        'SALVADOR',
        'FORTALEZA',
        'RECIFE',
        'MANAUS',
    ];

    if (majorCities.includes(company.municipio?.toUpperCase())) {
        locationScore = 5;
    } else {
        locationScore = 3;
    }

    const total = cadastralScore + capitalScore + activityTimeScore + companySizeScore + locationScore;

    // Determine trust level
    let level: 'low' | 'medium' | 'good' | 'excellent';
    if (total >= 90) {
        level = 'excellent';
    } else if (total >= 75) {
        level = 'good';
    } else if (total >= 50) {
        level = 'medium';
    } else {
        level = 'low';
    }

    return {
        cadastral_situation: cadastralScore,
        capital_social: capitalScore,
        activity_time: activityTimeScore,
        company_size: companySizeScore,
        location: locationScore,
        total,
        level,
    };
}

/**
 * Get color for trust score level
 */
export function getTrustScoreColor(level: 'low' | 'medium' | 'good' | 'excellent'): string {
    switch (level) {
        case 'excellent':
            return '#14b8a6'; // Teal
        case 'good':
            return '#10b981'; // Green
        case 'medium':
            return '#f59e0b'; // Orange
        case 'low':
            return '#ef4444'; // Red
    }
}

/**
 * Get label for trust score level
 */
export function getTrustScoreLabel(level: 'low' | 'medium' | 'good' | 'excellent'): string {
    switch (level) {
        case 'excellent':
            return 'Excelente';
        case 'good':
            return 'Boa Confiança';
        case 'medium':
            return 'Confiança Moderada';
        case 'low':
            return 'Baixa Confiança';
    }
}
