'use client';

import { useState } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import EditableField from '@/components/ui/EditableField';
import { X, FileText, Share2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyModalProps {
    company: EnhancedCompanyData;
    onClose: () => void;
}

export default function CompanyModal({ company, onClose }: CompanyModalProps) {
    const [telefone, setTelefone] = useState(company.telefone || company.ddd_telefone_1 || company.custom_phone || '');
    const [email, setEmail] = useState(company.email || company.custom_email || '');
    const [observacoes, setObservacoes] = useState(company.custom_notes || '');

    const handleExportPDF = async () => {
        try {
            const { generateOfficialPDF } = await import('@/lib/pdf/official-pdf');
            await generateOfficialPDF(company);
            toast.success('PDF gerado!', {
                description: 'Download iniciado automaticamente',
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erro ao gerar PDF', {
                description: 'Tente novamente',
            });
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
🏷️ CNAE: ${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}
${telefone ? `📞 Telefone: ${telefone}` : ''}
${email ? `📧 Email: ${email}` : ''}

Dados verificados pela BrasilAPI
    `.trim();

        navigator.clipboard.writeText(text);
        toast.success('Dados copiados!', {
            description: 'Cole no Facebook agora',
        });
    };

    const validateOnFacebook = () => {
        const url = `https://developers.facebook.com/tools/debug/`;
        window.open(url, '_blank');
    };

    const saveChanges = () => {
        // Save editable fields to localStorage
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

        toast.success('Dados salvos!', {
            description: 'Suas edições foram salvas localmente',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in" onClick={onClose}>
            <div
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] p-6 flex items-start justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">
                            <span className="text-[var(--color-accent-primary)]">DOSSIÊ EMPRESARIAL</span>{' '}
                            <span className="text-white">FULL</span>
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Confira os dados abaixo para o Gerenciador de Negócios
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info - Read Only */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-[var(--color-accent-primary)]">
                            📋 DADOS CADASTRAIS
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField
                                label="RAZÃO SOCIAL COMPLETA"
                                value={company.razao_social}
                                readOnly
                            />
                            <EditableField
                                label="NÚMERO DO CNPJ"
                                value={formatCNPJ(company.cnpj)}
                                readOnly
                            />
                            <EditableField
                                label="DATA DE ABERTURA"
                                value={formatDate(company.data_inicio_atividade)}
                                readOnly
                            />
                            <EditableField
                                label="SITUAÇÃO CADASTRAL"
                                value={company.tipo_situacao_cadastral}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Financial - Read Only */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-[var(--color-accent-primary)]">
                            💰 DADOS FINANCEIROS
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField
                                label="CAPITAL SOCIAL INTEGRALIZADO"
                                value={formatCurrency(company.capital_social)}
                                readOnly
                            />
                            <EditableField
                                label="PORTE DA EMPRESA"
                                value={company.porte}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Activity - Read Only */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-[var(--color-accent-primary)]">
                            🏭 ATIVIDADE ECONÔMICA
                        </h3>
                        <EditableField
                            label="CNAE ATIVIDADE PRINCIPAL"
                            value={
                                company.cnae_principal && company.descricao_cnae
                                    ? `${company.cnae_principal} - ${company.descricao_cnae}`
                                    : company.cnae_fiscal
                                        ? `${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}`
                                        : 'Não informado'
                            }
                            readOnly
                        />
                    </div>

                    {/* Address - Read Only */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-[var(--color-accent-primary)]">
                            📍 ENDEREÇO FISCAL
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField
                                label="LOGRADOURO E NÚMERO"
                                value={
                                    company.logradouro && company.logradouro !== 'undefined'
                                        ? `${company.descricao_tipo_de_logradouro || ''} ${company.logradouro}, ${company.numero}`.trim()
                                        : 'Não informado'
                                }
                                readOnly
                            />
                            <EditableField
                                label="BAIRRO / MUNICÍPIO"
                                value={
                                    company.bairro && company.bairro !== 'undefined'
                                        ? `${company.bairro} - ${company.municipio} / ${company.uf}`
                                        : `${company.municipio} / ${company.uf}`
                                }
                                readOnly
                            />
                            <EditableField
                                label="CEP"
                                value={company.cep || 'Não informado'}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Contact - EDITABLE! */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-[var(--color-accent-primary)]">
                            📞 CONTATO (EDITÁVEL)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField
                                label="TELEFONE"
                                value={telefone}
                                onChange={setTelefone}
                                editable
                                placeholder="(00) 0000-0000"
                            />
                            <EditableField
                                label="EMAIL"
                                value={email}
                                onChange={setEmail}
                                editable
                                placeholder="contato@empresa.com.br"
                            />
                        </div>
                    </div>

                    {/* Notes - EDITABLE! */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-[var(--color-accent-primary)]">
                            📝 OBSERVAÇÕES (EDITÁVEL)
                        </h3>
                        <EditableField
                            label="NOTAS E OBSERVAÇÕES"
                            value={observacoes}
                            onChange={setObservacoes}
                            editable
                            multiline
                            placeholder="Adicione notas sobre esta empresa..."
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={saveChanges}
                        className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                    >
                        💾 SALVAR EDIÇÕES
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] p-6 flex flex-wrap gap-3 z-10">
                    <button
                        onClick={handleExportPDF}
                        className="flex-1 min-w-[200px] py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                        }}
                    >
                        <FileText className="w-4 h-4" />
                        EXPORTAR PDF OFICIAL
                    </button>

                    <button
                        onClick={copyToFacebook}
                        className="flex-1 min-w-[200px] py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                        COPIAR DADOS P/ FACEBOOK
                    </button>

                    <button
                        onClick={validateOnFacebook}
                        className="flex-1 min-w-[200px] py-3 px-6 bg-[var(--color-bg-tertiary)] text-white rounded-lg font-semibold hover:bg-[var(--color-bg-card)] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        VALIDAR NO FACEBOOK
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg font-semibold hover:bg-[var(--color-bg-tertiary)] transition-all"
                    >
                        FECHAR
                    </button>
                </div>
            </div>
        </div>
    );
}
