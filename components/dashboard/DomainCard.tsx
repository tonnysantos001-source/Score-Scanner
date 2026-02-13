'use client';

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    Eye,
    Edit3,
    Copy,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';

interface DomainCardProps {
    domain: {
        id: string;
        domain: string;
        company_name: string;
        company_cnpj: string;
        is_verified: boolean;
        verified_at: string | null;
        created_at: string;
        landing_pages?: Array<{
            id: string;
            slug: string;
            is_active: boolean;
        }>;
    };
    onEdit?: (domainId: string) => void;
    onDelete?: (domainId: string) => void;
    onRevalidate?: (domainId: string) => void;
}

export function DomainCard({ domain, onEdit, onDelete, onRevalidate }: DomainCardProps) {
    const landingPage = domain.landing_pages?.[0];
    const publicUrl = landingPage
        ? `https://verifyads.online/l/${landingPage.slug}`
        : null;

    const copyUrl = () => {
        if (publicUrl) {
            navigator.clipboard.writeText(publicUrl);
            toast.success('URL copiada!');
        }
    };

    const openLandingPage = () => {
        if (publicUrl) {
            window.open(publicUrl, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="glass-card p-5 hover:shadow-lg transition-all"
        >
            {/* Header com Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {domain.is_verified ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                            <Clock className="w-5 h-5 text-orange-600" />
                        )}
                        <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${domain.is_verified
                                ? 'bg-green-600/10 text-green-600'
                                : 'bg-orange-600/10 text-orange-600'
                                }`}
                        >
                            {domain.is_verified ? 'Dados Verificados' : 'Validação Pendente'}
                        </span>
                    </div>

                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] break-all leading-tight w-full">
                        {domain.domain}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {domain.company_name}
                    </p>
                </div>
            </div>

            {/* Landing Page Status */}
            <div className="mb-4 p-3 bg-[var(--color-bg-tertiary)]/30 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--color-text-muted)]">Landing Page:</span>
                    <span className={landingPage?.is_active ? 'text-green-600' : 'text-[var(--color-text-muted)]'}>
                        {landingPage?.is_active ? '🟢 Ativa' : '⚪ Inativa'}
                    </span>
                </div>
                {publicUrl && landingPage?.is_active && (
                    <div className="text-xs text-[var(--color-text-muted)] break-all mt-1">
                        {publicUrl}
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-[var(--color-text-muted)] mb-4 space-y-1">
                <div>Criado em: {formatDate(domain.created_at)}</div>
                {domain.verified_at && (
                    <div>Verificado em: {formatDate(domain.verified_at)}</div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {/* Ver Landing Page */}
                {publicUrl && landingPage?.is_active && (
                    <button
                        onClick={openLandingPage}
                        className="flex-1 min-w-[100px] px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center justify-center gap-1"
                    >
                        <Eye className="w-3 h-3" />
                        Ver
                    </button>
                )}

                {/* Editar */}
                {onEdit && (
                    <button
                        onClick={() => onEdit(domain.id)}
                        className="flex-1 min-w-[100px] px-3 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                        <Edit3 className="w-3 h-3" />
                        Editar
                    </button>
                )}

                {/* Copiar URL */}
                {publicUrl && (
                    <button
                        onClick={copyUrl}
                        className="px-3 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)] rounded-lg text-xs transition-all"
                        title="Copiar URL"
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                )}

                {/* Re-validar */}
                {!domain.is_verified && onRevalidate && (
                    <button
                        onClick={() => onRevalidate(domain.id)}
                        className="px-3 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 rounded-lg text-xs transition-all"
                        title="Re-validar domínio"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                )}

                {/* Excluir */}
                {onDelete && (
                    <button
                        onClick={() => onDelete(domain.id)}
                        className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-lg text-xs transition-all"
                        title="Excluir domínio"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
