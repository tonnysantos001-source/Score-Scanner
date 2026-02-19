'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Link as LinkIcon, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface EditDomainModalProps {
    domainId: string;
    initialData: {
        title?: string;
        description?: string;
        pixel_id?: string;
        is_active?: boolean;
        use_generic?: boolean;
        slug?: string;
        verification_token?: string;
    };
    companyData: {
        razao_social?: string;
        nome_fantasia?: string;
    };
    onClose: () => void;
    onSave: () => void;
}

export function EditDomainModal({
    domainId,
    initialData,
    companyData,
    onClose,
    onSave,
}: EditDomainModalProps) {
    const [titleText, setTitleText] = useState(initialData.title || '');
    const [descriptionText, setDescriptionText] = useState(initialData.description || '');
    const [pixelId, setPixelId] = useState(initialData.pixel_id || '');
    const [slug, setSlug] = useState(initialData.slug || '');
    const [verificationToken, setVerificationToken] = useState(initialData.verification_token || '');
    const [isActive, setIsActive] = useState(initialData.is_active !== false);
    const [isSaving, setIsSaving] = useState(false);

    // Gerar texto genérico
    const companyName = companyData.razao_social || companyData.nome_fantasia || 'Empresa';
    const genericTitle = companyName;
    const genericDescription = `Somos a ${companyName}, oferecendo serviços de qualidade com excelência e compromisso.`;

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const response = await fetch('/api/domain/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain_id: domainId,
                    title_text: titleText || genericTitle,
                    description_text: descriptionText || genericDescription,
                    facebook_pixel_id: pixelId || null,
                    is_active: isActive,
                    slug: slug,
                    verification_token: verificationToken
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Landing page atualizada com sucesso!');
                onSave();
                onClose();
            } else {
                toast.error(data.error || 'Erro ao atualizar');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar border border-[var(--color-glass-border)] shadow-2xl shadow-blue-900/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[#0f172a]/95 backdrop-blur z-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Edit3 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Editar Landing Page
                                </h2>
                                <p className="text-xs text-[var(--color-text-muted)]">Personalize as informações da sua página</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)]/50 rounded-xl border border-[var(--color-border)]">
                            <div>
                                <p className="font-semibold text-sm text-white">Status da Página</p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {isActive ? 'A página está visível para o público' : 'A página está oculta'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Link Preview */}
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <label className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">
                                <LinkIcon className="w-3 h-3" />
                                Link da Página
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm bg-black/30 px-3 py-2.5 rounded-lg border border-blue-500/10 text-gray-300 font-mono select-all">
                                    {window.location.origin}/l/{slug || '...'}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/l/${slug}`);
                                        toast.success('Link copiado!');
                                    }}
                                    className="p-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-blue-600/20 transition-colors"
                                    title="Copiar Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => window.open(`/l/${slug}`, '_blank')}
                                    className="p-2.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-gray-400 hover:text-white rounded-lg border border-[var(--color-border)] transition-colors"
                                    title="Abrir Página"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[var(--color-border)] pb-2 mb-4">
                                Informações Básicas
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    Título da Página
                                </label>
                                <input
                                    type="text"
                                    value={titleText}
                                    onChange={(e) => setTitleText(e.target.value)}
                                    placeholder={genericTitle}
                                    className="modern-input"
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                                    Aparece na aba do navegador e no Google.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    Descrição SEO
                                </label>
                                <textarea
                                    value={descriptionText}
                                    onChange={(e) => setDescriptionText(e.target.value)}
                                    placeholder={genericDescription}
                                    rows={3}
                                    className="modern-input min-h-[80px] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    Slug do URL
                                </label>
                                <div className="flex items-center">
                                    <span className="text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-3 py-3 rounded-l-xl border border-r-0 border-[var(--color-border)] h-full flex items-center">
                                        /l/
                                    </span>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        placeholder="nome-da-empresa"
                                        className="modern-input rounded-l-none pl-3"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Integration Section */}
                        <div className="space-y-4 pt-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[var(--color-border)] pb-2 mb-4">
                                Integrações e Rastreamento
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    Meta-tag de Verificação (Facebook)
                                </label>
                                <input
                                    type="text"
                                    value={verificationToken}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const match = val.match(/content=["']([^"']+)["']/);
                                        setVerificationToken(match ? match[1] : val);
                                    }}
                                    placeholder="Cole a meta-tag inteira ou apenas o código"
                                    className="modern-input font-mono text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    ID do Pixel do Facebook
                                </label>
                                <input
                                    type="text"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value)}
                                    placeholder="Ex: 123456789012345"
                                    className="modern-input font-mono"
                                />
                            </div>
                        </div>

                        {/* Info Warning */}
                        <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/10 rounded-xl flex gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                                <span className="text-xl">🚀</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-200 mb-1">Atualização Instantânea</h4>
                                <p className="text-xs text-blue-200/70 leading-relaxed">
                                    Ao clicar em <strong>Salvar</strong>, suas alterações (incluindo pixels e meta-tags) são aplicadas automaticamente em tempo real. Não é necessário gerar um novo link.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-[var(--color-border)] flex gap-4 bg-[var(--color-bg-tertiary)]/30">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-card)] rounded-xl font-medium transition-colors text-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
// Helper icon component
function Edit3(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    )
}
