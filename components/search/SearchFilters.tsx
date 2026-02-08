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
        <div className="mb-8 space-y-4">
            {/* Info Label */}
            <div className="text-center p-4 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl">
                <p className="text-sm font-semibold">
                    🎯 O sistema vai buscar <span className="text-[var(--color-accent-primary)] text-lg">{MINING_QUANTITY} empresas ATIVAS</span>
                </p>
            </div>

            {/* Mine Button */}
            <button
                onClick={handleStartMining}
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
