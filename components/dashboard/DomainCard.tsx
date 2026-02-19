'use client';

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    Eye,
    Edit3,
    Copy,
    Trash2,
    RefreshCw,
    ExternalLink
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
        ? `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/l/${landingPage.slug}`
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
            className="glass-card p-6 hover:shadow-2xl transition-all h-full flex flex-col"
        >
            {/* Header com Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-4"> {/* min-w-0 for truncate */}
                    <div className="flex items-center gap-2 mb-2">
                        {domain.is_verified ? (
                            <span className="badge badge-success">
                                <CheckCircle2 className="w-3 h-3" /> VERIFICADO
                            </span>
                        ) : (
                            <span className="badge badge-warning">
                                <Clock className="w-3 h-3" /> PENDENTE
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-xl text-white truncate w-full" title={domain.domain}>
                        {domain.domain}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] truncate">
                        {domain.company_name}
                    </p>
                </div>
            </div>

            {/* Landing Page Status */}
            <div className="mb-4 p-4 bg-[var(--color-bg-tertiary)]/40 rounded-xl border border-[var(--color-border)] flex-1">
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider">Landing Page</span>
                    <span className={`flex items-center gap-1.5 font-bold ${landingPage?.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${landingPage?.is_active ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-gray-500'}`} />
                        {landingPage?.is_active ? 'ATIVA' : 'INATIVA'}
                    </span>
                </div>
                {publicUrl && landingPage?.is_active && (
                    <div className="text-xs text-[var(--color-text-secondary)] break-all font-mono bg-black/20 p-2 rounded-lg truncate">
                        {publicUrl}
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-[var(--color-text-muted)] mb-5 flex gap-4">
                <span>Criado: {new Date(domain.created_at).toLocaleDateString()}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto">
                {/* Ver Landing Page */}
                {publicUrl && landingPage?.is_active && (
                    <button
                        onClick={openLandingPage}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 flex items-center justify-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Ver
                    </button>
                )}

                {/* Copiar URL */}
                {publicUrl && (
                    <button
                        onClick={copyUrl}
                        className="p-2.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border)] transition-colors"
                        title="Copiar URL"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                )}

                {/* Editar */}
                {onEdit && (
                    <button
                        onClick={() => onEdit(domain.id)}
                        className="p-2.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border)] transition-colors"
                        title="Editar"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                )}

                {/* Excluir */}
                {onDelete && (
                    <button
                        onClick={() => onDelete(domain.id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors ml-auto"
                        title="Excluir domínio"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}

                {/* Re-validar */}
                {!domain.is_verified && onRevalidate && (
                    <button
                        onClick={() => onRevalidate(domain.id)}
                        className="p-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/20 transition-colors"
                        title="Re-validar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
