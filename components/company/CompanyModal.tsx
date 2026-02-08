'use client';

import { useState } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { X, Share2, CheckCircle2, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CompanyModalProps {
    company: EnhancedCompanyData;
    onClose: () => void;
}

export default function CompanyModal({ company, onClose }: CompanyModalProps) {
    const [telefone, setTelefone] = useState(company.telefone || company.ddd_telefone_1 || company.custom_phone || '');
    const [email, setEmail] = useState(company.email || company.custom_email || '');
    const [observacoes, setObservacoes] = useState(company.custom_notes || '');

    const handleOpenPDF = async () => {
        try {
            const { generateOfficialPDF } = await import('@/lib/pdf/official-pdf');
            const blob = await generateOfficialPDF(company);
            const url = URL.createObjectURL(blob);

            // Open in new tab
            window.open(url, '_blank');

            toast.success('PDF aberto em nova aba!', {
                description: 'Use Ctrl+S para salvar',
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erro ao gerar PDF');
        }
    };

    const copyToFacebook = () => {
        const text = `
🏢 ${company.razao_social}

📋 CNPJ: ${formatCNPJ(company.cnpj)}
📅 Abertura: ${formatDate(company.data_inicio_atividade)}
✅ Situação: ${company.tipo_situacao_cadastral}
💰 Capital Social: ${formatCurrency(company.capital_social)}
📍 ${company.municipio} - ${company.uf}
${telefone ? `📞 ${telefone}` : ''}
${email ? `📧 ${email}` : ''}
    `.trim();

        navigator.clipboard.writeText(text);
        toast.success('Dados copiados!');
    };

    const validateOnFacebook = () => {
        window.open('https://developers.facebook.com/tools/debug/', '_blank');
    };

    const saveChanges = () => {
        const savedData = {
            cnpj: company.cnpj,
            custom_phone: telefone,
            custom_email: email,
            custom_notes: observacoes,
            updated_at: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem('company_edits') || '{}');
        existing[company.cnpj] = savedData;
        localStorage.setItem('company_edits', JSON.stringify(existing));

        toast.success('Dados salvos!');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="glass-card max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">
                            <span className="text-gradient">Dossiê Empresarial</span>
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {company.razao_social}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - 2 columns */}
                <div className="p-5 grid grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                    {/* Column 1: Company Info */}
                    <div className="space-y-4">
                        {/* Basic */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">📋 DADOS CADASTRAIS</h3>
                            <div className="space-y-2 text-sm">
                                <InfoRow label="CNPJ" value={formatCNPJ(company.cnpj)} />
                                <InfoRow label="Abertura" value={formatDate(company.data_inicio_atividade)} />
                                <InfoRow label="Situação" value={company.tipo_situacao_cadastral} />
                            </div>
                        </div>

                        {/* Financial */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">💰 DADOS FINANCEIROS</h3>
                            <div className="space-y-2 text-sm">
                                <InfoRow label="Capital Social" value={formatCurrency(company.capital_social)} />
                                <InfoRow label="Porte" value={company.porte} />
                            </div>
                        </div>

                        {/* Activity */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">🏭 ATIVIDADE</h3>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                                {company.cnae_fiscal} - {company.cnae_fiscal_descricao}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">📍 ENDEREÇO</h3>
                            <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                                <div>{company.descricao_tipo_de_logradouro || ''} {company.logradouro}, {company.numero}</div>
                                <div>{company.bairro} - {company.municipio}/{company.uf}</div>
                                <div>CEP: {company.cep || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Editable */}
                    <div className="space-y-4">
                        {/* Contact */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">📞 CONTATO (Editável)</h3>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    placeholder="(00) 0000-0000"
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@empresa.com.br"
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">📝 OBSERVAÇÕES</h3>
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Adicione notas sobre esta empresa..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveChanges}
                            className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            SALVAR EDIÇÕES
                        </button>

                        {/* Quick Info */}
                        <div className="p-3 bg-[var(--color-bg-tertiary)]/50 rounded-lg border border-[var(--color-border)]">
                            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                                <div>✅ Dados verificados via BrasilAPI</div>
                                <div>🔒 Edições salvas localmente</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
                    <button
                        onClick={handleOpenPDF}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        ABRIR PDF
                    </button>

                    <button
                        onClick={copyToFacebook}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        COPIAR P/ FB
                    </button>

                    <button
                        onClick={validateOnFacebook}
                        className="flex-1 py-2 px-3 bg-[var(--color-bg-tertiary)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-bg-card)] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        VALIDAR FB
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Helper component
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">{label}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
