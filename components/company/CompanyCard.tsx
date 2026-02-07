'use client';

import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency } from '@/lib/utils/formatters';
import { getTrustScoreColor, getTrustScoreLabel } from '@/lib/utils/trust-score';
import { Building2, MapPin, TrendingUp, FileText } from 'lucide-react';

interface CompanyCardProps {
    company: EnhancedCompanyData;
    onClick: () => void;
}

export default function CompanyCard({ company, onClick }: CompanyCardProps) {
    const scoreColor = getTrustScoreColor(company.trust_score_breakdown.level);
    const scoreLabel = getTrustScoreLabel(company.trust_score_breakdown.level);

    return (
        <div className="glass-card p-6 cursor-pointer hover:scale-[1.02] transition-transform" onClick={onClick}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{company.razao_social}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        CNPJ: {formatCNPJ(company.cnpj)}
                    </p>
                </div>

                {/* Trust Score Badge */}
                <div className="flex flex-col items-end">
                    <div
                        className="text-3xl font-bold"
                        style={{ color: scoreColor }}
                    >
                        {company.trust_score}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">Trust Score</div>
                </div>
            </div>

            {/* Trust Score Level */}
            <div className="mb-4">
                <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                        backgroundColor: `${scoreColor}20`,
                        color: scoreColor,
                        border: `1px solid ${scoreColor}40`
                    }}
                >
                    {scoreLabel}
                </span>

                {/* Situação */}
                <span className={`ml-2 ${company.tipo_situacao_cadastral.toUpperCase() === 'ATIVA' || company.tipo_situacao_cadastral === '2'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}>
                    {company.tipo_situacao_cadastral}
                </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--color-accent-primary)]" />
                    <div>
                        <div className="text-[var(--color-text-muted)] text-xs">Capital Social</div>
                        <div className="font-semibold">{formatCurrency(company.capital_social)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--color-accent-primary)]" />
                    <div>
                        <div className="text-[var(--color-text-muted)] text-xs">Localização</div>
                        <div className="font-semibold">{company.municipio} - {company.uf}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--color-accent-primary)]" />
                    <div>
                        <div className="text-[var(--color-text-muted)] text-xs">Porte</div>
                        <div className="font-semibold">{company.porte || 'N/A'}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-accent-primary)]" />
                    <div>
                        <div className="text-[var(--color-text-muted)] text-xs">CNAE</div>
                        <div className="font-semibold text-xs truncate">{company.cnae_fiscal}</div>
                    </div>
                </div>
            </div>

            {/* Action hint */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
                Clique para ver detalhes e exportar PDF
            </div>
        </div>
    );
}
