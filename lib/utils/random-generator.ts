/**
 * Random Data Generator
 * Used for generating valid data for payment gateways when user data is not provided.
 */

/**
 * Generate a valid CPF number (with check digits)
 */
export function generateCPF(formatted: boolean = false): string {
    const rnd = (n: number) => Math.round(Math.random() * n);
    const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));

    const n1 = rnd(9);
    const n2 = rnd(9);
    const n3 = rnd(9);
    const n4 = rnd(9);
    const n5 = rnd(9);
    const n6 = rnd(9);
    const n7 = rnd(9);
    const n8 = rnd(9);
    const n9 = rnd(9);

    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (mod(d1, 11));
    if (d1 >= 10) d1 = 0;

    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (mod(d2, 11));
    if (d2 >= 10) d2 = 0;

    if (formatted) {
        return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
    }

    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

/**
 * Generate a random mobile phone number
 * Format: (11) 9XXXX-XXXX
 */
export function generatePhone(formatted: boolean = false): string {
    const ddd = Math.floor(Math.random() * (99 - 11 + 1)) + 11;
    const part1 = Math.floor(Math.random() * 9000) + 1000;
    const part2 = Math.floor(Math.random() * 9000) + 1000;

    if (formatted) {
        return `(${ddd}) 9${part1}-${part2}`;
    }

    return `${ddd}9${part1}${part2}`;
}

/**
 * Generate a random name if none provided
 */
export function generateName(): string {
    const firstNames = ['Cliente', 'Usuario', 'Membro', 'Assinante'];
    const lastNames = ['VerifyAds', 'Score', 'Scanner', 'Premium', 'Pro'];

    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const id = Math.floor(Math.random() * 10000);

    return `${first} ${last} ${id}`;
}
