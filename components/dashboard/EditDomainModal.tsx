'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
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
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-bg-card)] z-10">
                        <h2 className="text-xl font-bold text-gradient">
                            ✏️ Editar Landing Page
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)]/30 rounded-lg">
                            <div>
                                <p className="font-semibold text-sm">Status da Landing Page</p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {isActive ? 'Página ativa e visível' : 'Página desativada'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Link da Landing Page (Visualização) */}
                        <div className="p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                            <label className="block text-xs font-bold text-blue-600 mb-1">
                                🔗 LINK DA SUA PÁGINA
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm bg-white/50 px-2 py-1.5 rounded border border-blue-600/10 text-[var(--color-text-primary)]">
                                    {window.location.origin.replace('verifyads.com.br', 'verifyads.online')}/l/{slug || '...'}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://verifyads.online/l/${slug}`);
                                        toast.success('Link copiado!');
                                    }}
                                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    title="Copiar Link"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                </button>
                                <button
                                    onClick={() => window.open(`https://verifyads.online/l/${slug}`, '_blank')}
                                    className="p-1.5 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] transition"
                                    title="Abrir Página"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Title Field */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                📝 Título da Página
                            </label>
                            <input
                                type="text"
                                value={titleText}
                                onChange={(e) => setTitleText(e.target.value)}
                                placeholder={genericTitle}
                                className="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
                            />
                            {!titleText && (
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    💡 Usando título padrão: &quot;{genericTitle}&quot;
                                </p>
                            )}
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                📄 Descrição (SEO e Compartilhamento)
                            </label>
                            <textarea
                                value={descriptionText}
                                onChange={(e) => setDescriptionText(e.target.value)}
                                placeholder={genericDescription}
                                rows={3}
                                className="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm resize-none"
                            />
                        </div>

                        {/* Slug Field (Link) */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                🔗 Link Personalizado (Slug)
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2 py-2 rounded-l-lg border border-r-0 border-[var(--color-border)]">
                                    verifyads.online/l/
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="nome-da-empresa"
                                    className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm font-mono"
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                Cuidado ao alterar: O link antigo deixará de funcionar.
                            </p>
                        </div>

                        {/* Facebook Domain Verification */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                🛡️ Token de Verificação de Domínio (Meta-tag)
                            </label>
                            <input
                                type="text"
                                value={verificationToken}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const match = val.match(/content=["']([^"']+)["']/);
                                    setVerificationToken(match ? match[1] : val);
                                }}
                                placeholder="Colar meta-tag inteira ou apenas o token"
                                className="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm font-mono"
                            />
                        </div>

                        {/* Facebook Pixel */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                📊 Facebook Pixel ID
                            </label>
                            <input
                                type="text"
                                value={pixelId}
                                onChange={(e) => setPixelId(e.target.value)}
                                placeholder="123456789012345"
                                className="w-full px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
                            />
                        </div>

                        {/* Preview */}
                        <div className="p-4 bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-[var(--color-border)] rounded-lg">
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
                                👁️ PREVIEW
                            </p>
                            <h3 className="text-lg font-bold mb-2">
                                {titleText || genericTitle}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                {descriptionText || genericDescription}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-[var(--color-border)] flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-card)] rounded-lg font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
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
