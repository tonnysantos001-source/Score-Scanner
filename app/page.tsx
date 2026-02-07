'use client';

import { useState } from 'react';
import { useMining } from '@/hooks/useMining';
import SearchFilters from '@/components/search/SearchFilters';
import CompanyTable from '@/components/company/CompanyTable';
import CompanyModal from '@/components/company/CompanyModal';
import { EnhancedCompanyData } from '@/types/company';
import { MiningFilters, MINING_QUANTITY } from '@/types/filters';
import { Loader2, Zap } from 'lucide-react';

export default function HomePage() {
  const { companies, progress, isMining, error, startMining, stopMining } = useMining();
  const [selectedCompany, setSelectedCompany] = useState<EnhancedCompanyData | null>(null);

  const handleStartMining = (filters: MiningFilters) => {
    startMining(filters);
  };

  const handleMarkAsUsed = (cnpj: string) => {
    // Remove from displayed list
    const updatedCompanies = companies.filter(c => c.cnpj !== cnpj);
    // Note: useMining hook will need to expose setCompanies or similar
    // For now this creates a local filter, actual removal happens in cache
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 fade-in">
          <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tight">
            <span className="text-white">INTELLI</span>
            <span className="text-gradient">CORP</span>
            <span className="text-xs ml-4 px-3 py-1 rounded-lg bg-[var(--color-accent-primary)] text-white font-bold">
              V91
            </span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-[0.3em] font-semibold">
            IA DOMAIN VERIFICATION & BI
          </p>
        </header>

        {/* Search Filters */}
        <SearchFilters
          onStartMining={handleStartMining}
          disabled={isMining}
        />

        {/* Mining Progress */}
        {isMining && (
          <div className="glass-card p-6 mb-8 border-l-4 border-[var(--color-accent-primary)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent-primary)]" />
                <span className="font-bold text-lg">Minerando empresas...</span>
              </div>
              <button
                onClick={stopMining}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold text-sm transition-all"
              >
                Parar
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)] font-semibold">Progresso:</span>
                <span className="font-black text-2xl text-[var(--color-accent-primary)]">
                  {progress.found} / {MINING_QUANTITY}
                </span>
              </div>

              <div className="w-full h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-primary transition-all duration-500 ease-out relative"
                  style={{ width: `${progress.percentage}%` }}
                >
                  <div className="absolute inset-0 shimmer"></div>
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-muted)] text-center font-mono">
                {progress.tried} CNPJs testados
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="glass-card p-6 mb-8 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-400 font-bold text-lg">{error}</p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {companies.length > 0 && (
          <div className="mb-8 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <Zap className="w-8 h-8 text-[var(--color-accent-primary)]" />
                Empresas Encontradas
              </h2>
              <div className="px-4 py-2 rounded-lg bg-[var(--color-accent-primary)]/20 border border-[var(--color-accent-primary)]">
                <span className="font-black text-xl text-[var(--color-accent-primary)]">
                  {companies.length}
                </span>
              </div>
            </div>

            <CompanyTable
              companies={companies}
              onOpenCompany={setSelectedCompany}
              onMarkAsUsed={handleMarkAsUsed}
            />
          </div>
        )}

        {/* Empty State */}
        {!isMining && companies.length === 0 && !error && (
          <div className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-[var(--color-text-secondary)] text-xl mb-3 font-semibold">
              Configure os filtros e clique em "MINERAR DADOS REAIS"
            </p>
            <p className="text-[var(--color-text-muted)]">
              O sistema buscará automaticamente {MINING_QUANTITY} empresas que atendem aos critérios
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-[var(--color-border)] text-center">
          <p className="text-[var(--color-text-muted)] text-sm font-semibold">
            © 2026 Score Scanner. Dados fornecidos pela{' '}
            <a
              href="https://brasilapi.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent-primary)] hover:underline font-bold"
            >
              BrasilAPI
            </a>
          </p>
        </footer>
      </div>

      {/* Company Modal */}
      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </main>
  );
}
