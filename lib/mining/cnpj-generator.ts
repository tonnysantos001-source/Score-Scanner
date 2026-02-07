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
 * Generate a valid CNPJ using known bases
 */
export function generateValidCNPJ(): string {
    // Random strategy: 70% use known base, 30% completely random
    const useKnownBase = Math.random() < 0.7;

    let base: string;

    if (useKnownBase && CNPJ_BASES.length > 0) {
        // Pick random known base
        base = CNPJ_BASES[Math.floor(Math.random() * CNPJ_BASES.length)];
    } else {
        // Generate completely random base
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
