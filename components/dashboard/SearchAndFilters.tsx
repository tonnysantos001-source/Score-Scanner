'use client';

import { Search, Filter, X } from 'lucide-react';

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
        <div className="glass-card p-2 md:p-3 mb-8">
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por domínio ou empresa..."
                        className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-[var(--color-bg-tertiary)] transition-all text-white placeholder-gray-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[160px]">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value as 'all' | 'verified' | 'pending')}
                        className="w-full pl-11 pr-8 py-3 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-[var(--color-bg-tertiary)] transition-all appearance-none cursor-pointer text-white"
                    >
                        <option value="all" className="bg-gray-900">Todos os Status</option>
                        <option value="verified" className="bg-gray-900">✅ Verificados</option>
                        <option value="pending" className="bg-gray-900">⏳ Pendentes</option>
                    </select>
                </div>

                {/* Sort By */}
                <div className="relative min-w-[160px]">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as 'recent' | 'alphabetical')}
                        className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-[var(--color-bg-tertiary)] transition-all appearance-none cursor-pointer text-white"
                    >
                        <option value="recent" className="bg-gray-900">🕒 Mais Recentes</option>
                        <option value="alphabetical" className="bg-gray-900">🔤 Ordem A-Z</option>
                    </select>
                </div>
            </div>

            {/* Active Filters Display - Optional, keeping it cleaner without if redundant */}
        </div>
    );
}
