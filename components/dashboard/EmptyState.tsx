'use client';

import { motion } from 'framer-motion';
import { Globe, Plus, FileText } from 'lucide-react';

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
            className="glass-card p-12 text-center"
        >
            {/* Illustration */}
            <div className="mb-6 relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-full flex items-center justify-center relative">
                    <Globe className="w-12 h-12 text-[var(--color-text-muted)]" />

                    {/* Floating icons */}
                    <motion.div
                        animate={{
                            y: [-5, 5, -5],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-600/20 to-green-500/20 rounded-full flex items-center justify-center"
                    >
                        <FileText className="w-5 h-5 text-green-600" />
                    </motion.div>
                </div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-bold mb-2">Nenhum domínio encontrado</h3>
            <p className="text-[var(--color-text-muted)] text-sm mb-6">
                {message}
            </p>

            {/* Action Button */}
            {onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                    <Plus className="w-5 h-5" />
                    {actionLabel}
                </button>
            )}

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                    💡 <strong>Dica:</strong> Para adicionar um domínio:
                </p>
                <ol className="text-xs text-[var(--color-text-muted)] text-left max-w-md mx-auto space-y-1">
                    <li>1. Busque por um CNPJ no Score-Scanner</li>
                    <li>2. Abra o "Dossiê Empresarial"</li>
                    <li>3. Role até "📊 VERIFICAÇÃO DE DOMÍNIO"</li>
                    <li>4. Adicione e verifique seu domínio</li>
                </ol>
            </div>
        </motion.div>
    );
}
