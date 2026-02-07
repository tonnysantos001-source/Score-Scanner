'use client';

import { useState } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { generateAndDownloadCompanyPDF } from '@/lib/pdf/generator';
import { X, Download, FileText, Share2, CheckCircle2 } from 'lucide-react';

interface CompanyModalProps {
    company: EnhancedCompanyData;
    onClose: () => void;
}

export default function CompanyModal({ company, onClose }: CompanyModalProps) {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            await generateAndDownloadCompanyPDF(company);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erro ao gerar PDF. Por favor, tente novamente.');
        } finally {
            setIsGeneratingPDF(false);
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

Dados verificados pela BrasilAPI
    `.trim();

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const validateOnFacebook = () => {
        // Open Facebook domain debugger
        const url = `https://developers.facebook.com/tools/debug/`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="sticky top-0 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] p-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-1">
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
                <div className="p-6 space-y-4">
                    {/* Data Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <DataField
                            label="RAZÃO SOCIAL COMPLETA"
                            value={company.razao_social}
                        />
                        <DataField
                            label="NÚMERO DO CNPJ"
                            value={formatCNPJ(company.cnpj)}
                        />
                        <DataField
                            label="DATA DE ABERTURA"
                            value={formatDate(company.data_inicio_atividade)}
                        />
                        <DataField
                            label="SITUAÇÃO CADASTRAL"
                            value={company.tipo_situacao_cadastral}
                        />
                        <DataField
                            label="CAPITAL SOCIAL INTEGRALIZADO"
                            value={formatCurrency(company.capital_social)}
                        />
                        <DataField
                            label="CNAE ATIVIDADE PRINCIPAL"
                            value={`${company.cnae_fiscal} - ${company.cnae_fiscal_descricao}`}
                            className="col-span-2"
                        />
                        <DataField
                            label="ENDEREÇO FISCAL"
                            value={`${company.descricao_tipo_de_logradouro} ${company.logradouro}, ${company.numero}`}
                            className="col-span-2"
                        />
                        <DataField
                            label="BAIRRO / MUNICÍPIO"
                            value={`${company.bairro} - ${company.municipio} / ${company.uf}`}
                            className="col-span-2"
                        />
                    </div>

                    {/* Optional: Domain Verification Section */}
                    {/* This matches image 4 - can be enabled later
          <div className="mt-6 p-4 border-2 border-dashed border-[var(--color-accent-primary)] rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h3 className="font-semibold text-[var(--color-accent-primary)]">
                VERIFICAÇÃO DE DOMÍNIO
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">
                  TOKEN DA BIM (META-TAG)
                </label>
                <input
                  type="text"
                  placeholder="Cole o token da BIM aqui..."
                  className="input"
                />
              </div>
              
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">
                  META-TAG GERADA
                </label>
                <div className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg text-sm font-mono text-green-400">
                  Aguardando token...
                </div>
              </div>
              
              <button className="btn-secondary w-full">
                COPIAR META-TAG
              </button>
            </div>
          </div>
          */}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] p-6 flex flex-wrap gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="flex-1 min-w-[200px] py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                        }}
                    >
                        <FileText className="w-4 h-4" />
                        {isGeneratingPDF ? 'Gerando...' : 'EXPORTAR PDF OFICIAL'}
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
                        {copied ? 'COPIADO!' : 'COPIAR DADOS P/ FACEBOOK'}
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

function DataField({
    label,
    value,
    className = ''
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block uppercase">
                {label}
            </label>
            <div className="bg-[var(--color-bg-tertiary)] px-4 py-3 rounded-lg font-semibold text-sm">
                {value}
            </div>
        </div>
    );
}
