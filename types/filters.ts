/**
 * Filter types for intelligent CNPJ mining
 */

export interface MiningFilters {
    // Capital Social minimum only
    capitalMinimo: number;

    // Toggle to enable/disable capital filter
    useCapitalFilter: boolean; // false = accept any active company

    // Geographic filters - single UF or 'AUTO'
    uf: string; // 'AUTO' for automatic, or specific UF like 'SP'

    // Company size
    porte: 'ME' | 'EPP' | 'DEMAIS' | 'TODOS';
}

export const DEFAULT_MINING_FILTERS: MiningFilters = {
    capitalMinimo: 10000,      // R$ 10.000
    useCapitalFilter: false,   // Disabled by default for faster mining
    uf: 'AUTO',                // Automatic (all states)
    porte: 'TODOS',
};

// Fixed quantity - always 20
export const MINING_QUANTITY = 20;

export const BRAZILIAN_STATES = [
    { uf: 'AUTO', name: 'Automático (Todos)' },
    { uf: 'SP', name: 'São Paulo' },
    { uf: 'RJ', name: 'Rio de Janeiro' },
    { uf: 'MG', name: 'Minas Gerais' },
    { uf: 'RS', name: 'Rio Grande do Sul' },
    { uf: 'PR', name: 'Paraná' },
    { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'BA', name: 'Bahia' },
    { uf: 'PE', name: 'Pernambuco' },
    { uf: 'CE', name: 'Ceará' },
    { uf: 'GO', name: 'Goiás' },
    { uf: 'PA', name: 'Pará' },
    { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'AM', name: 'Amazonas' },
    { uf: 'DF', name: 'Distrito Federal' },
    { uf: 'MA', name: 'Maranhão' },
    { uf: 'MT', name: 'Mato Grosso' },
    { uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'PB', name: 'Paraíba' },
    { uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'AL', name: 'Alagoas' },
    { uf: 'PI', name: 'Piauí' },
    { uf: 'SE', name: 'Sergipe' },
    { uf: 'RO', name: 'Rondônia' },
    { uf: 'AC', name: 'Acre' },
    { uf: 'AP', name: 'Amapá' },
    { uf: 'RR', name: 'Roraima' },
    { uf: 'TO', name: 'Tocantins' },
];

export interface MiningProgress {
    tried: number;
    found: number;
    target: number;
    percentage: number;
    isComplete: boolean;
}
