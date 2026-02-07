'use client';

import { useState } from 'react';
import { MiningFilters, DEFAULT_MINING_FILTERS, BRAZILIAN_STATES, MINING_QUANTITY } from '@/types/filters';
import { Sparkles, TrendingUp, MapPin } from 'lucide-react';

interface SearchFiltersProps {
    onStartMining: (filters: MiningFilters) => void;
    disabled?: boolean;
}

export default function SearchFilters({ onStartMining, disabled = false }: SearchFiltersProps) {
    const [filters, setFilters] = useState<MiningFilters>(DEFAULT_MINING_FILTERS);

    const handleStartMining = () => {
        onStartMining(filters);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        }).format(value);
    };

    return (
        <div className="glass-card p-8 mb-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-[var(--color-accent-primary)]" />
                <h2 className="text-2xl font-bold">Filtros de Mineração</h2>
            </div>

            <div className="space-y-6">
                {/* Capital Social - Only Minimum */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4" />
                        Capital Social Mínimo
                    </label>
                    <input
                        type="number"
                        value={filters.capitalMinimo}
                        onChange={(e) => setFilters({ ...filters, capitalMinimo: Number(e.target.value) })}
                        className="input text-lg font-semibold"
                        min="0"
                        step="10000"
                        placeholder="Ex: 10000"
                    />
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">
                        {formatCurrency(filters.capitalMinimo)}
                    </p>
                </div>

                {/* UF Selection - Dropdown */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 uppercase tracking-wide">
                        <MapPin className="w-4 h-4" />
                        Estado (UF)
                    </label>
                    <select
                        value={filters.uf}
                        onChange={(e) => setFilters({ ...filters, uf: e.target.value })}
                        className="input text-lg font-semibold"
                    >
                        {BRAZILIAN_STATES.map(({ uf, name }) => (
                            <option key={uf} value={uf}>
                                {uf === 'AUTO' ? '🤖 ' : ''}{name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Porte - Dropdown */}
                <div>
                    <label className="text-sm font-semibold mb-3 block uppercase tracking-wide">
                        Porte da Empresa
                    </label>
                    <select
                        value={filters.porte}
                        onChange={(e) => setFilters({ ...filters, porte: e.target.value as MiningFilters['porte'] })}
                        className="input text-lg font-semibold"
                    >
                        <option value="TODOS">Todos os Portes</option>
                        <option value="ME">🏪 Microempresa (ME)</option>
                        <option value="EPP">🏢 Empresa Pequeno Porte (EPP)</option>
                        <option value="DEMAIS">🏭 Demais</option>
                    </select>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/30 rounded-xl">
                <p className="text-sm text-center font-semibold">
                    🎯 O sistema vai buscar <span className="text-[var(--color-accent-primary)] text-lg">{MINING_QUANTITY} empresas ATIVAS</span> que atendem aos filtros
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
