'use client';

import { useState } from 'react';
import { MiningFilters, DEFAULT_MINING_FILTERS, MINING_QUANTITY } from '@/types/filters';
import { Sparkles, TrendingDown, ChevronDown } from 'lucide-react';

interface SearchFiltersProps {
    onStartMining: (filters: MiningFilters) => void;
    disabled?: boolean;
}

const CAPITAL_MAX_OPTIONS = [
    { label: 'R$ 5.000', value: 5000 },
    { label: 'R$ 10.000', value: 10000 },
    { label: 'R$ 20.000', value: 20000 },
    { label: 'R$ 50.000', value: 50000 },
    { label: 'R$ 100.000', value: 100000 },
    { label: 'Sem limite', value: 0 },
];

export default function SearchFilters({ onStartMining, disabled = false }: SearchFiltersProps) {
    const [filters, setFilters] = useState<MiningFilters>(DEFAULT_MINING_FILTERS);

    const handleStartMining = () => {
        onStartMining(filters);
    };

    const selectedLabel = filters.useCapitalMaximoFilter && filters.capitalMaximo > 0
        ? CAPITAL_MAX_OPTIONS.find(o => o.value === filters.capitalMaximo)?.label ?? `R$ ${filters.capitalMaximo.toLocaleString('pt-BR')}`
        : 'Sem limite';

    return (
        <div className="mb-8 space-y-4">
            {/* Capital social máximo filter */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/40">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-white">Capital Social Máximo</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/25">
                            Ativo
                        </span>
                    </div>

                    {/* Toggle */}
                    <button
                        onClick={() => setFilters(f => ({
                            ...f,
                            useCapitalMaximoFilter: !f.useCapitalMaximoFilter,
                        }))}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${filters.useCapitalMaximoFilter ? 'bg-blue-600' : 'bg-gray-700'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${filters.useCapitalMaximoFilter ? 'left-[22px]' : 'left-0.5'
                                }`}
                        />
                    </button>
                </div>

                {filters.useCapitalMaximoFilter && (
                    <div className="flex flex-wrap gap-2">
                        {CAPITAL_MAX_OPTIONS.filter(o => o.value > 0).map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setFilters(f => ({ ...f, capitalMaximo: opt.value, useCapitalMaximoFilter: true }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.capitalMaximo === opt.value
                                        ? 'bg-blue-600 text-white border border-blue-500 shadow shadow-blue-500/30'
                                        : 'bg-[var(--color-bg-secondary)] text-gray-400 border border-[var(--color-border)] hover:border-blue-500/40 hover:text-gray-200'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}

                {!filters.useCapitalMaximoFilter && (
                    <p className="text-xs text-gray-500">Empresas com qualquer capital social serão incluídas.</p>
                )}
            </div>

            {/* Info Label */}
            <div className="text-center p-4 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl">
                <p className="text-sm font-semibold">
                    🎯 O sistema vai buscar{' '}
                    <span className="text-[var(--color-accent-primary)] text-lg">{MINING_QUANTITY} empresas ATIVAS</span>
                    {filters.useCapitalMaximoFilter && filters.capitalMaximo > 0 && (
                        <span className="text-gray-400">
                            {' '}com capital até{' '}
                            <span className="text-blue-400 font-black">
                                R$ {filters.capitalMaximo.toLocaleString('pt-BR')}
                            </span>
                        </span>
                    )}
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
