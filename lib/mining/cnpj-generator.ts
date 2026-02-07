/**
 * CNPJ prefixes by Brazilian state (first 2 digits)
 * These indicate the state where the company was registered
 */
const UF_PREFIXES: Record<string, string[]> = {
    'SP': ['62', '61', '60', '59', '05', '04', '03', '02', '01', '00'], // São Paulo
    'RJ': ['33', '34', '42', '31', '32'], // Rio de Janeiro
    'MG': ['17', '26', '18', '25', '16'], // Minas Gerais
    'RS': ['87', '88', '96', '97'], // Rio Grande do Sul
    'PR': ['76', '77', '78', '79', '80', '81'], // Paraná
    'SC': ['82', '83', '84'], // Santa Catarina
    'BA': ['13', '14', '15', '40', '41'], // Bahia
    'PE': ['09', '10', '11'], // Pernambuco
    'CE': ['07', '08'], // Ceará
    'GO': ['01', '02', '03'], // Goiás
    'PA': ['04', '05'], // Pará
    'ES': ['27', '28'], // Espírito Santo
    'DF': ['00', '01', '02', '03'], // Distrito Federal
    'AUTO': ['00', '01', '02', '03', '04', '05', '33', '60', '61', '62'], // Most common
};

/**
 * Known CNPJ bases from real companies (first 8 digits)
 * These improve success rate when generating random CNPJs
 */
const CNPJ_BASES = [
    '00000000', // Banco do Brasil
    '00360305', // Caixa Econômica Federal
    '00000208', // Receita Federal
    '33000167', // Petrobras
    '60746948', // Bradesco
    '02038232', // Santander
    '61182408', // Itaú
    '33014556', // BB Administradora
    '00517645', // Vale
    '07526557', // Ambev
    '45242914', // Magazine Luiza
    '47960950', // Creditas
    '47508411', // Mercado Livre
    '08774815', // Centauro
    '05570714', // Globo
    '60394079', // Ipiranga
    '04206050', // Totvs
    '06947283', // Cyrela
    '02658435', // Gerdau
    '33041260', // Usiminas
];

/**
 * Calculate CNPJ verification digit
 */
function calculateCNPJDigit(cnpjBase: string, weights: number[]): string {
    let sum = 0;
    for (let i = 0; i < cnpjBase.length; i++) {
        sum += parseInt(cnpjBase[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? '0' : (11 - remainder).toString();
}

/**
 * Generate a valid CNPJ using smart strategies
 * @param preferredUF - Optional UF to prefer in generation
 */
export function generateValidCNPJ(preferredUF?: string): string {
    // Strategy distribution:
    // 50% - Use UF prefix (more likely to exist)
    // 30% - Use known base (guaranteed to exist)
    // 20% - Completely random

    const random = Math.random();
    let base: string;

    if (random < 0.5) {
        // Strategy 1: Use UF prefix (50%)
        const uf = preferredUF && UF_PREFIXES[preferredUF] ? preferredUF : 'AUTO';
        const prefixes = UF_PREFIXES[uf];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

        // Generate remaining 6 digits randomly
        const remaining = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        base = prefix + remaining;

    } else if (random < 0.8) {
        // Strategy 2: Use known base (30%)
        base = CNPJ_BASES[Math.floor(Math.random() * CNPJ_BASES.length)];

    } else {
        // Strategy 3: Completely random (20%)
        base = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    }

    // Generate random filial (0001-9999)
    const filial = Math.floor(Math.random() * 9999 + 1).toString().padStart(4, '0');

    // Calculate verification digits
    const cnpjBase = base + filial;
    const digit1 = calculateCNPJDigit(cnpjBase, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const digit2 = calculateCNPJDigit(cnpjBase + digit1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return cnpjBase + digit1 + digit2;
}

/**
 * Generate multiple unique CNPJs
 */
export function generateUniqueCNPJs(count: number): string[] {
    const cnpjs = new Set<string>();

    while (cnpjs.size < count) {
        const cnpj = generateValidCNPJ();
        cnpjs.add(cnpj);
    }

    return Array.from(cnpjs);
}

/**
 * Generate CNPJs in a specific range (for sequential search)
 */
export function generateSequentialCNPJ(base: string, start: number, end: number): string[] {
    const cnpjs: string[] = [];

    for (let filial = start; filial <= end; filial++) {
        const filialStr = filial.toString().padStart(4, '0');
        const cnpjBase = base + filialStr;
        const digit1 = calculateCNPJDigit(cnpjBase, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        const digit2 = calculateCNPJDigit(cnpjBase + digit1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

        cnpjs.push(cnpjBase + digit1 + digit2);
    }

    return cnpjs;
}
