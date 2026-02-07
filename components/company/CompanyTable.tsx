'use client';

import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { getTrustScoreColor } from '@/lib/utils/trust-score';

interface CompanyTableProps {
    companies: EnhancedCompanyData[];
    onOpenCompany: (company: EnhancedCompanyData) => void;
}

export default function CompanyTable({ companies, onOpenCompany }: CompanyTableProps) {
    if (companies.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <p className="text-[var(--color-text-muted)]">
                    Nenhuma empresa encontrada ainda. Configure os filtros e clique em "MINERAR DADOS REAIS"
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                            EMPRESA / CNPJ
                        </th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                            TRUST SCORE
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                            AÇÃO
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map((company, index) => {
                        const scoreColor = getTrustScoreColor(company.trust_score_breakdown.level);

                        return (
                            <tr
                                key={company.cnpj}
                                className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-card)] transition-colors fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Company Name + CNPJ */}
                                <td className="px-6 py-4">
                                    <div className="company-name text-base font-bold text-white mb-1">
                                        {company.razao_social}
                                    </div>
                                    <div className="company-cnpj text-sm font-mono" style={{ color: '#3b82f6' }}>
                                        {formatCNPJ(company.cnpj)}
                                    </div>
                                </td>

                                {/* Trust Score */}
                                <td className="px-6 py-4 text-center">
                                    <div className="score-value text-4xl font-black" style={{ color: scoreColor }}>
                                        {company.trust_score}
                                    </div>
                                    <div className="score-label text-xs uppercase mt-1" style={{ color: scoreColor }}>
                                        {company.tipo_situacao_cadastral === 'ATIVA' || company.tipo_situacao_cadastral === '2' ? 'LÍQUIDA' : 'INATIVA'}
                                    </div>
                                </td>

                                {/* Action Button */}
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onOpenCompany(company)}
                                        className="inline-block px-6 py-2 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        ABRIR BOC
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
