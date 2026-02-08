/**
 * Real Trust Score Algorithm
 * Calculates a realistic score (50-99) based on company data
 */

import { EnhancedCompanyData } from '@/types/company';

export interface TrustScoreBreakdown {
    score: number;
    capital: number;
    age: number;
    size: number;
    completeness: number;
}

/**
 * Calculate years since company opening
 */
function getYearsSinceOpening(dataAbertura: string): number {
    try {
        const [year, month, day] = dataAbertura.split('-').map(Number);
        const openingDate = new Date(year, month - 1, day);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - openingDate.getTime());
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        return Math.floor(diffYears);
    } catch {
        return 0;
    }
}

/**
 * Calculate real trust score based on company data
 */
export function calculateTrustScore(company: EnhancedCompanyData): TrustScoreBreakdown {
    let score = 50; // Base score
    let capitalPoints = 0;
    let agePoints = 0;
    let sizePoints = 0;
    let completenessPoints = 0;

    // 1. CAPITAL SOCIAL SCORE (0-20 points)
    // Banco do Brasil: R$ 120 bilhões → 20 pts
    // Empresa média: R$ 100k → 10-15 pts
    // Micro: R$ 10k → 5 pts
    const capital = company.capital_social || 0;

    if (capital >= 1000000000) {
        // >= 1 bilhão
        capitalPoints = 20;
    } else if (capital >= 100000000) {
        // >= 100 milhões
        capitalPoints = 18;
    } else if (capital >= 10000000) {
        // >= 10 milhões
        capitalPoints = 16;
    } else if (capital >= 1000000) {
        // >= 1 milhão
        capitalPoints = 14;
    } else if (capital >= 100000) {
        // >= 100k
        capitalPoints = 10;
    } else if (capital >= 10000) {
        // >= 10k
        capitalPoints = 6;
    } else {
        capitalPoints = 2;
    }

    // 2. AGE SCORE (0-20 points)
    // Banco do Brasil: 200+ anos → 20 pts
    // Empresa consolidada: 10+ anos → 15-18 pts
    // Empresa nova: 1-2 anos → 5 pts
    const years = getYearsSinceOpening(company.data_abertura || '');

    if (years >= 50) {
        agePoints = 20; // Instituição histórica
    } else if (years >= 20) {
        agePoints = 18; // Muito consolidada
    } else if (years >= 10) {
        agePoints = 15; // Consolidada
    } else if (years >= 5) {
        agePoints = 12; // Estabelecida
    } else if (years >= 2) {
        agePoints = 8;  // Em crescimento
    } else if (years >= 1) {
        agePoints = 5;  // Nova
    } else {
        agePoints = 2;  // Muito nova
    }

    // 3. SIZE SCORE (0-15 points)
    // DEMAIS (grandes): 15 pts
    // MEDIO: 10 pts
    // EPP: 7 pts
    // ME: 5 pts
    const porte = company.porte || '';

    if (porte === 'DEMAIS') {
        sizePoints = 15;
    } else if (porte === 'MEDIO') {
        sizePoints = 10;
    } else if (porte === 'EPP') {
        sizePoints = 7;
    } else if (porte === 'ME' || porte === 'MICRO EMPRESA') {
        sizePoints = 5;
    } else {
        sizePoints = 3;
    }

    // 4. DATA COMPLETENESS SCORE (0-15 points)
    // Full data = higher trust
    let completeFields = 0;

    if (company.telefone) completeFields++;
    if (company.email) completeFields++;
    if (company.cnae_principal) completeFields++;
    if (company.logradouro && company.logradouro !== 'undefined') completeFields++;
    if (company.bairro && company.bairro !== 'undefined') completeFields++;

    completenessPoints = Math.min(completeFields * 3, 15);

    // TOTAL SCORE
    score += capitalPoints + agePoints + sizePoints + completenessPoints;

    // Cap at 99 (never 100 - always room for improvement)
    score = Math.min(score, 99);

    return {
        score,
        capital: capitalPoints,
        age: agePoints,
        size: sizePoints,
        completeness: completenessPoints,
    };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 80) return '#84cc16'; // Lime
    if (score >= 70) return '#eab308'; // Yellow
    if (score >= 60) return '#f97316'; // Orange
    return '#ef4444'; // Red
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
    if (score >= 90) return 'EXCELENTE';
    if (score >= 80) return 'ÓTIMO';
    if (score >= 70) return 'BOM';
    if (score >= 60) return 'REGULAR';
    return 'BAIXO';
}
