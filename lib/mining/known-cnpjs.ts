/**
 * List of known valid CNPJs for testing and demonstration
 * These are real, active companies that exist in BrasilAPI
 */
export const KNOWN_VALID_CNPJS = [
    '00000000000191', // Banco do Brasil - ATIVA
    '00360305000104', // Caixa Econômica Federal - ATIVA
    '60701190000104', // Itaú Unibanco - ATIVA
    '33000167000101', // Petrobras - ATIVA
    '60746948000112', // Bradesco - ATIVA
    '02038232000164', // Santander Brasil - ATIVA
    '45242914000105', // Magazine Luiza - ATIVA
    '47508411000114', // Mercado Livre - ATIVA
    '09168704000142', // Americanas - ATIVA
    '47960950000121', // Via Varejo (Casas Bahia) - ATIVA
    '61585865000146', // Pão de Açúcar - ATIVA
    '59291534000107', // Renner - ATIVA
    '33041260000163', // Usiminas - ATIVA
    '02658435000142', // Gerdau - ATIVA
    '50746577000115', // Embraer - ATIVA
    '17184037000109', // JBS - ATIVA
    '07512441000103', // BRF - ATIVA
    '61412615000117', // Eletrobras- ATIVA
    '28665732000163', // Localiza - ATIVA
    '18372277000136', // WEG - ATIVA
];

/**
 * Get a random known valid CNPJ
 */
export function getRandomKnownCNPJ(): string {
    return KNOWN_VALID_CNPJS[Math.floor(Math.random() * KNOWN_VALID_CNPJS.length)];
}

/**
 * Get all known CNPJs shuffled
 */
export function getShuffledKnownCNPJs(): string[] {
    const shuffled = [...KNOWN_VALID_CNPJS];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
