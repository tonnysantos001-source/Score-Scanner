'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { validateCNPJ, formatCNPJInput } from '@/lib/utils/cnpj';

interface SearchBarProps {
    onSearch: (results: unknown[]) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [cnpj, setCnpj] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCNPJInput(e.target.value);
        setCnpj(formatted);
        setError('');
    };

    const handleSearch = useCallback(async () => {
        if (!cnpj) {
            setError('Digite um CNPJ para buscar');
            return;
        }

        if (!validateCNPJ(cnpj)) {
            setError('CNPJ inválido. Verifique o número digitado.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/cnpj?cnpj=${encodeURIComponent(cnpj)}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar CNPJ');
            }

            const data = await response.json();
            onSearch([data]);

            // Clear input after successful search
            // setCnpj('');
        } catch (err) {
            console.error('Search error:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar CNPJ');
        } finally {
            setIsLoading(false);
        }
    }, [cnpj, onSearch]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="glass-card p-8">
                <div className="flex flex-col gap-4">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={cnpj}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Digite o CNPJ (XX.XXX.XXX/XXXX-XX)"
                            className="input pl-12 pr-4 text-lg"
                            maxLength={18}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-400 text-sm px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !cnpj}
                        className="btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                                Buscando...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5 inline-block mr-2" />
                                Buscar Empresa
                            </>
                        )}
                    </button>

                    {/* Helper Text */}
                    <p className="text-xs text-[var(--color-text-muted)] text-center">
                        Exemplo: 00.000.000/0001-91 (Banco do Brasil)
                    </p>
                </div>
            </div>
        </div>
    );
}
