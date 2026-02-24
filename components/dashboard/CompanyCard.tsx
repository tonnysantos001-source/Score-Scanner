'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Building2,
    CheckCircle2,
    Clock,
    ExternalLink,
    Copy,
    Trash2,
    Globe,
    FileText,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import CompanyModal from '@/components/company/CompanyModal';

interface CompanyCardProps {
    company: {
        id: string;
        cnpj: string;
        company_name: string;
        created_at: string;
        domain: string | null;
        domain_id: string | null;
        domain_verified: boolean;
        domain_status: string;
        landing_page_active: boolean;
        landing_page_url: string | null;
        is_active: boolean;
    };
    onDelete?: (id: string) => void;
}

export function CompanyCard({ company, onDelete }: CompanyCardProps) {
    const [showDossie, setShowDossie] = useState(false);
    const [dossieData, setDossieData] = useState<any>(null);
    const [isLoadingDossie, setIsLoadingDossie] = useState(false);

    const formatCNPJ = (cnpj: string) => {
        const clean = cnpj.replace(/\D/g, '');
        if (clean.length !== 14) return cnpj;
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    const copyUrl = () => {
        if (company.landing_page_url) {
            navigator.clipboard.writeText(company.landing_page_url);
            toast.success('URL copiada!');
        }
    };

    const openPage = () => {
        if (company.landing_page_url) {
            window.open(company.landing_page_url, '_blank');
        }
    };

    const handleOpenDossie = async () => {
        setIsLoadingDossie(true);
        try {
            const cleanCnpj = company.cnpj.replace(/\D/g, '');
            const res = await fetch(`/api/cnpj?cnpj=${cleanCnpj}`);
            if (!res.ok) throw new Error('Erro ao buscar dados');
            const data = await res.json();
            setDossieData(data);
            setShowDossie(true);
        } catch (e) {
            toast.error('Não foi possível carregar o dossiê. Tente novamente.');
        } finally {
            setIsLoadingDossie(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="glass-card p-5 hover:shadow-2xl transition-all h-full flex flex-col"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            {company.is_active ? (
                                <span className="badge badge-success">
                                    <CheckCircle2 className="w-3 h-3" /> ATIVA
                                </span>
                            ) : (
                                <span className="badge badge-warning">
                                    <Clock className="w-3 h-3" /> PENDENTE
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-base text-white truncate w-full" title={company.company_name}>
                            {company.company_name}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                            {formatCNPJ(company.cnpj)}
                        </p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
                        <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                </div>

                {/* Domain Info */}
                <div className="mb-3 p-3 bg-[var(--color-bg-tertiary)]/40 rounded-xl border border-[var(--color-border)] flex-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Domínio
                        </span>
                        <span className={`flex items-center gap-1.5 font-bold ${company.domain_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${company.domain_verified ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-yellow-400'}`} />
                            {company.domain_verified ? 'VERIFICADO' : 'DNS PENDENTE'}
                        </span>
                    </div>
                    {company.domain ? (
                        <div className="text-xs text-[var(--color-text-secondary)] font-mono bg-black/20 p-2 rounded-lg truncate">
                            {company.domain}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500 italic">Nenhum domínio associado</div>
                    )}
                </div>

                {/* URL */}
                {company.landing_page_url && (
                    <div className="mb-3 p-2 bg-green-500/5 border border-green-500/10 rounded-lg">
                        <div className="text-[10px] text-green-400 font-bold uppercase mb-0.5">Link Ativo</div>
                        <div className="text-xs text-green-300/80 font-mono truncate">{company.landing_page_url}</div>
                    </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-[var(--color-text-muted)] mb-3">
                    Salvo em: {new Date(company.created_at).toLocaleDateString('pt-BR')}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto">
                    {/* Dossiê Button — always visible */}
                    <button
                        onClick={handleOpenDossie}
                        disabled={isLoadingDossie}
                        className="flex-1 px-3 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow shadow-purple-900/20"
                        title="Abrir Dossiê Empresarial"
                    >
                        {isLoadingDossie ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...</>
                        ) : (
                            <><FileText className="w-3.5 h-3.5" /> Dossiê</>
                        )}
                    </button>

                    {company.landing_page_url && (
                        <>
                            <button
                                onClick={openPage}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow shadow-blue-900/20"
                                title="Abrir Landing Page"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={copyUrl}
                                className="px-2.5 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-white rounded-xl border border-[var(--color-border)] transition-colors"
                                title="Copiar URL"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => onDelete(company.id)}
                            className="px-2.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Dossiê Modal */}
            <AnimatePresence>
                {showDossie && dossieData && (
                    <CompanyModal
                        company={dossieData}
                        onClose={() => {
                            setShowDossie(false);
                            setDossieData(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
