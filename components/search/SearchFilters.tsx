'use client';

import { useState } from 'react';
import { MiningFilters, DEFAULT_MINING_FILTERS, MINING_QUANTITY } from '@/types/filters';
import { Sparkles } from 'lucide-react';

interface SearchFiltersProps {
    onStartMining: (filters: MiningFilters) => void;
    disabled?: boolean;
}

export default function SearchFilters({ onStartMining, disabled = false }: SearchFiltersProps) {
    const [filters] = useState<MiningFilters>(DEFAULT_MINING_FILTERS);

    const handleStartMining = () => {
        onStartMining(filters);
    };

    return (
        <div className="glass-card p-8 mb-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-[var(--color-accent-primary)]" />
                <h2 className="text-2xl font-bold">Filtros de Mineração</h2>
            </div>

            {/* Info about active filter */}
            <div className="p-6 bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/30 rounded-xl">
                <p className="text-lg text-center font-semibold text-[var(--color-accent-primary)]">
                    ✅ Filtro desativado - Qualquer capital social será aceito
                </p>
            </div>

            {/* Target Info */}
            <div className="mt-6 p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl">
                <p className="text-sm text-center font-semibold">
                    🎯 O sistema vai buscar <span className="text-[var(--color-accent-primary)] text-lg">{MINING_QUANTITY} empresas ATIVAS</span>
                </p>
            </div>

            {/* Mine Button */}
            <button
                onClick={handleStartMining}
                disabled={disabled}
                className="btn-primary w-full mt-6 text-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide font-black"
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
