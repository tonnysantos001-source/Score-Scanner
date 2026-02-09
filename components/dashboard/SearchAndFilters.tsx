'use client';

import { Search, Filter } from 'lucide-react';

interface SearchAndFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    statusFilter: 'all' | 'verified' | 'pending';
    onStatusChange: (status: 'all' | 'verified' | 'pending') => void;
    sortBy: 'recent' | 'alphabetical';
    onSortChange: (sort: 'recent' | 'alphabetical') => void;
}

export function SearchAndFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    sortBy,
    onSortChange,
}: SearchAndFiltersProps) {
    return (
        <div className="glass-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por domínio ou empresa..."
                        className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value as 'all' | 'verified' | 'pending')}
                        className="pl-10 pr-8 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 appearance-none cursor-pointer min-w-[150px]"
                    >
                        <option value="all">Todos</option>
                        <option value="verified">✅ Verificados</option>
                        <option value="pending">⏳ Pendentes</option>
                    </select>
                </div>

                {/* Sort By */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as 'recent' | 'alphabetical')}
                        className="pl-4 pr-8 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 appearance-none cursor-pointer min-w-[150px]"
                    >
                        <option value="recent">Mais Recentes</option>
                        <option value="alphabetical">A-Z</option>
                    </select>
                </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== 'all') && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)]">Filtros ativos:</span>

                    {searchTerm && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/10 text-blue-600 rounded text-xs">
                            Busca: &quot;{searchTerm}&quot;
                            <button
                                onClick={() => onSearchChange('')}
                                className="hover:text-blue-700"
                            >
                                ✕
                            </button>
                        </span>
                    )}

                    {statusFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/10 text-purple-600 rounded text-xs">
                            {statusFilter === 'verified' ? '✅ Verificados' : '⏳ Pendentes'}
                            <button
                                onClick={() => onStatusChange('all')}
                                className="hover:text-purple-700"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
