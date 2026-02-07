/**
 * List of known valid CNPJs for testing
 * These are real companies that exist in BrasilAPI
 */
export const KNOWN_TEST_CNPJS = [
    '00000000000191', // Banco do Brasil
    '00360305000104', // Caixa Econômica Federal
    '33000167000101', // Petrobras
    '60746948000112', // Bradesco
    '02038232000164', // Santander
    '60701190000104', // Itaú
    '45242914000108', // Magazine Luiza
    '47508411000195', // Mercado Livre (já encontramos uma filial)
    '07526557000162', // Ambev
    '61182408000194', // Banco Citibank
];

/**
 * Get a random known test CNPJ
 */
export function getRandomTestCNPJ(): string {
    return KNOWN_TEST_CNPJS[Math.floor(Math.random() * KNOWN_TEST_CNPJS.length)];
}
