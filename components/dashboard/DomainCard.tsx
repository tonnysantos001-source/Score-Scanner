'use client';

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    Edit3,
    Copy,
    Trash2,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
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
    const normalizedDomain = domain.domain.toLowerCase();
    // Logic: If verified, use custom domain. If not, use system domain?
    // User requirement: "clients can only use THEIR domains".
    // So if not verified, maybe we shouldn't show a public URL at all? 
    // Or we show it but user knows it's system.
    // Let's use custom domain if verified, else null?
    // "o outro erro esta quando eu abro o editar ladpage e mostra o dominio do nosso sistema que os cliente jamais poderam usar"
    // This implies they SHOUD NOT see system domain.

    const baseUrl = domain.is_verified
        ? `https://${normalizedDomain}`
        : null; // Hide if not verified, or strict: null.

    // If we return null, the "Ver" button won't appear.
    // However, for "Minhas Empresas" (mined companies), do they HAVE a URL before adding a domain?
    // User says: "habilitar o dominio dele ai sim sera salvo dentro do painel"
    // So if it is in the panel, does it have a domain?
    // If it's in "Minhas Empresas" (from mining), it might NOT have a custom domain yet?
    // But the DomainCard props has `domain.domain`.

    // If the domain is "verifyads.com.br" (system), we might want to show it?
    // But the user says "eu nao minero dominios".
    // Let's assume: If verified custom domain -> Use it.
    // If not verified -> No public URL (or maybe we shouldn't show the card in this list if it's not ready?).
    // But the list is "Minhas Empresas".

    // Safety check:
    const publicUrl = (baseUrl && landingPage)
        ? `${baseUrl}` // Assuming root for custom domain logic based on "white label" usually being CNAME root.
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

                {/* Re-validar - Show full button if pending */}
                {!domain.is_verified && onRevalidate && (
                    <div className="flex flex-col gap-2 w-full mt-4">
                        <div className="text-[10px] text-yellow-500/80 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20 text-center">
                            ⏳ Propagação de DNS: até 48h
                        </div>
                        <button
                            onClick={() => onRevalidate(domain.id)}
                            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all flex items-center justify-center gap-2"
                            title="Verificar se o domínio já está ativo"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Verificar Conexão
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
