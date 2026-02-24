/**
 * Filter types for intelligent CNPJ mining
 */

export interface MiningFilters {
    // Capital Social minimum
    capitalMinimo: number;
    // Capital Social maximum (0 = no limit)
    capitalMaximo: number;

    // Toggle to enable/disable capital filters
    useCapitalFilter: boolean;    // minimum
    useCapitalMaximoFilter: boolean; // maximum

    // Toggle to enable/disable UF filter
    useUfFilter: boolean;

    // Geographic filters - single UF or 'AUTO'
    uf: string;

    // Toggle to enable/disable porte filter
    usePorteFilter: boolean;

    // Company size
    porte: 'ME' | 'EPP' | 'DEMAIS' | 'TODOS';
}


export const DEFAULT_MINING_FILTERS: MiningFilters = {
    capitalMinimo: 1000,            // R$ 1.000
    useCapitalFilter: false,        // Disabled by default
    capitalMaximo: 20000,           // R$ 20.000 — default max
    useCapitalMaximoFilter: true,   // ENABLED by default
    uf: 'AUTO',
    useUfFilter: false,
    porte: 'TODOS',
    usePorteFilter: false,
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
