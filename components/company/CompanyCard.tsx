'use client';

import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency } from '@/lib/utils/formatters';
import { calculateTrustScore, getScoreColor, getScoreLabel } from '@/lib/scoring/trust-score';
import { Building2, MapPin, TrendingUp, FileText, Trash2 } from 'lucide-react';
import { cnpjCache } from '@/lib/cache/cnpj-cache';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CompanyCardProps {
    company: EnhancedCompanyData;
    onClick: () => void;
    onMarkAsUsed?: (cnpj: string) => void;
    index?: number;
}

export default function CompanyCard({ company, onClick, onMarkAsUsed, index = 0 }: CompanyCardProps) {
    // ✅ REAL TRUST SCORE CALCULATION
    const trustScoreData = calculateTrustScore(company);
    const scoreColor = getScoreColor(trustScoreData.score);
    const scoreLabel = getScoreLabel(trustScoreData.score);

    const handleMarkAsUsed = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger card click

        cnpjCache.markAsUsed(company.cnpj);
        toast.success(`${company.razao_social} marcada como usada`, {
            description: 'Esta empresa não aparecerá mais em futuras minerações',
        });

        if (onMarkAsUsed) {
            onMarkAsUsed(company.cnpj);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1]
            }}
            whileHover={{
                scale: 1.03,
                y: -8,
                transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
            className="glass-card p-6 cursor-pointer"
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{company.razao_social}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        CNPJ: {formatCNPJ(company.cnpj)}
                    </p>
                </div>

                {/* Trust Score Badge */}
                <motion.div
                    className="flex flex-col items-end"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <div
                        className="text-3xl font-bold"
                        style={{ color: scoreColor }}
                    >
                        {trustScoreData.score}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">Trust Score</div>
                </motion.div>
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

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                <div className="text-xs text-[var(--color-text-muted)]">
                    Clique para ver detalhes
                </div>

                <motion.button
                    onClick={handleMarkAsUsed}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-red-500/10 hover:text-red-500 text-[var(--color-text-muted)]"
                    title="Marcar como usada"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Marcar como Usada
                </motion.button>
            </div>
        </motion.div>
    );
}
