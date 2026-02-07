/**
 * CNPJ validation and formatting utilities
 */

/**
 * Validates CNPJ number (with or without formatting)
 */
export function validateCNPJ(cnpj: string): boolean {
    // Remove non-digit characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Check if has 14 digits
    if (cleanCNPJ.length !== 14) return false;

    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

    // Validate check digits
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}

/**
 * Formats CNPJ to XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return cnpj;

    return cleanCNPJ.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

/**
 * Removes CNPJ formatting
 */
export function cleanCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

/**
 * Formats CNPJ as user types
 */
export function formatCNPJInput(value: string): string {
    const clean = value.replace(/\D/g, '');

    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) {
        return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    }
    if (clean.length <= 12) {
        return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    }
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

/**
 * Validates phone number (Brazilian format)
 */
export function validatePhone(phone: string): boolean {
    const clean = phone.replace(/\D/g, '');
    return clean.length === 10 || clean.length === 11;
}

/**
 * Formats phone number to (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatPhone(phone: string): string {
    const clean = phone.replace(/\D/g, '');

    if (clean.length === 11) {
        return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    if (clean.length === 10) {
        return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return phone;
}

/**
 * Validates email
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
