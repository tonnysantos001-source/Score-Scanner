'use client';

import { MiningFilters, DEFAULT_MINING_FILTERS, MINING_QUANTITY } from '@/types/filters';
import { Sparkles } from 'lucide-react';

interface SearchFiltersProps {
    onStartMining: (filters: MiningFilters) => void;
    disabled?: boolean;
}

// Filtro fixo — Instituições de Pagamento com capital de R$ 20.000.000 até R$ 1.000.000.000
const FIXED_FILTERS: MiningFilters = {
    ...DEFAULT_MINING_FILTERS,
    capitalMinimo: 20000000,
    useCapitalFilter: true,
    capitalMaximo: 1000000000,
    useCapitalMaximoFilter: true,
    apenasPagamentos: true,
};

export default function SearchFilters({ onStartMining, disabled = false }: SearchFiltersProps) {
    return (
        <div className="mb-8 space-y-4">
            {/* Info Label */}
            <div className="text-center p-4 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl">
                <p className="text-sm font-semibold">
                    🎯 O sistema vai buscar{' '}
                    <span className="text-[var(--color-accent-primary)] text-lg">{MINING_QUANTITY} empresas ATIVAS</span>
                    {' '}de{' '}
                    <span className="text-emerald-400 font-black">INSTITUIÇÃO DE PAGAMENTO</span>
                    {' '}com capital de{' '}
                    <span className="text-blue-400 font-black">R$ 20 milhões até R$ 1 bilhão</span>
                </p>
            </div>

            {/* Mine Button */}
            <button
                onClick={() => onStartMining(FIXED_FILTERS)}
                disabled={disabled}
                className="btn-primary w-full text-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide font-black"
            >
                {disabled ? (
                    <>
                        <Sparkles className="w-6 h-6 inline-block mr-3 animate-spin" />
                        MINERANDO...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-6 h-6 inline-block mr-3" />
                        🔄 MINERAR DADOS REAIS
                    </>
                )}
            </button>
        </div>
    );
}
