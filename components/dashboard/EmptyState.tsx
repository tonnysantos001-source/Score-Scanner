'use client';

import { motion } from 'framer-motion';
import { Globe, Plus, FileText, SearchX } from 'lucide-react';

interface EmptyStateProps {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    message = 'Você ainda não tem domínios cadastrados',
    actionLabel = 'Adicionar Primeiro Domínio',
    onAction,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center border-dashed border border-gray-700/50"
        >
            {/* Illustration */}
            <div className="mb-6 relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-full flex items-center justify-center relative border border-white/5">
                    <Globe className="w-10 h-10 text-blue-400/50" />

                    {/* Floating icons using absolute positioning within the circle */}
                    <motion.div
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-4 right-5"
                    >
                        <SearchX className="w-5 h-5 text-purple-400/60" />
                    </motion.div>
                </div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-bold mb-2 text-white">Nenhum domínio encontrado</h3>
            <p className="text-[var(--color-text-muted)] text-sm mb-6 max-w-sm mx-auto">
                {message}
            </p>

            {/* Action Button */}
            {onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-white/90 rounded-xl font-semibold hover:shadow-lg transition-all border border-[var(--color-border)] hover:border-blue-500/30 hover:text-white"
                >
                    <Plus className="w-5 h-5 text-blue-400" />
                    {actionLabel}
                </button>
            )}

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-muted)] mb-3 bg-[var(--color-bg-tertiary)]/50 inline-block px-3 py-1 rounded-full border border-white/5">
                    💡 <strong>Dica Rápida</strong>
                </p>
                <div className="text-xs text-[var(--color-text-secondary)] text-left max-w-md mx-auto space-y-2 bg-[var(--color-bg-tertiary)]/30 p-4 rounded-xl border border-white/5">
                    <div className="flex gap-2">
                        <span className="text-blue-400 font-bold">1.</span>
                        <p>Busque por um CNPJ no Score-Scanner e abra o <span className="text-white">Dossiê Empresarial</span>.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-blue-400 font-bold">2.</span>
                        <p>Role até a seção <span className="text-white">📊 Verificação de Domínio</span>.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-blue-400 font-bold">3.</span>
                        <p>Clique em <span className="text-white">Adicionar Domínio</span> para começar a rastrear.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
