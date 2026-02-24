'use client';

import { useState } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { X, Share2, CheckCircle2, Eye, Info, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';

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
    const [verificationToken, setVerificationToken] = useState('');
    const [pixelId, setPixelId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const handleOpenPDF = async () => {
        try {
            setIsPdfLoading(true);
            const { generateOfficialPDF } = await import('@/lib/pdf/official-pdf');
            // Pass the currently-edited phone and email so the PDF reflects what the user typed
            const blob = await generateOfficialPDF(company, {
                telefone: telefone || undefined,
                email: email || undefined,
            });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success('PDF gerado e aberto em nova aba!', {
                description: 'Use Ctrl+S para salvar',
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsPdfLoading(false);
        }
    };


    const validateOnFacebook = () => {
        window.open('https://developers.facebook.com/tools/debug/', '_blank');
    };

    // Função saveChanges removida pois agora é tudo salvo ao gerar o link

    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [userDomains, setUserDomains] = useState<any[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(true);

    // Fetch domains on mount
    useState(() => {
        const fetchDomains = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await supabase
                    .from('verified_domains')
                    .select('id, domain')
                    .eq('domain_type', 'external')
                    .order('created_at', { ascending: false });

                if (data) {
                    setUserDomains(data);
                    if (data.length > 0) {
                        setSelectedDomainId(data[0].id);
                    }
                }
            } catch (err) {
                console.error('Error fetching domains:', err);
            } finally {
                setIsLoadingDomains(false);
            }
        };
        fetchDomains();
    });

    const handleSaveCompany = async () => {
        if (!selectedDomainId) {
            toast.error('Selecione um domínio para continuar.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/domain/save-with-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_cnpj: company.cnpj,
                    company_name: company.razao_social,
                    // Dados editáveis
                    custom_phone: telefone,
                    custom_email: email,
                    custom_notes: observacoes,
                    // Dados do Facebook
                    verification_token: verificationToken,
                    pixel_id: pixelId,
                    // WHITE LABEL
                    domain_id: selectedDomainId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Erro API:', data);
                throw new Error(data.error || 'Erro desconhecido ao gerar link');
            }

            setIsSaved(true);
            setGeneratedUrl(data.url);
            toast.success('Página gerada e dados salvos!', {
                description: 'Seu link exclusivo está pronto e verificado.'
            });
        } catch (error: any) {
            console.error('Erro handleSaveCompany:', error);
            toast.error('Falha ao gerar link', {
                description: error.message || 'Verifique sua conexão e tente novamente.'
            });
        } finally {
            setIsSaving(false);
        }
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
                className="glass-card max-w-5xl w-full flex flex-col" style={{ maxHeight: '92vh' }}
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

                {/* Content — inner scroll hidden so footer button is always visible */}
                <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Column 1: Informações da Empresa (Compactado) */}
                        <div className="space-y-4">
                            {/* Bloco Unificado: Cadastrais e Financeiros */}
                            <div className="p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-tertiary)]/20">
                                <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-3 flex items-center gap-2">
                                    📋 DADOS DA EMPRESA
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <InfoRow label="CNPJ" value={formatCNPJ(company.cnpj)} />
                                    <InfoRow label="Abertura" value={formatDate(company.data_inicio_atividade)} />
                                    <InfoRow label="Situação" value={company.tipo_situacao_cadastral} />
                                    <InfoRow label="Capital" value={formatCurrency(company.capital_social)} />
                                    <InfoRow label="Porte" value={company.porte} />
                                </div>
                                <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50">
                                    <div className="text-xs text-[var(--color-text-secondary)]">
                                        <span className="font-semibold text-[var(--color-text-muted)]">Atividade: </span>
                                        {company.cnae_fiscal} - {company.cnae_fiscal_descricao}
                                    </div>
                                </div>
                            </div>

                            {/* Bloco Endereço */}
                            <div className="p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-tertiary)]/20">
                                <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-2">📍 ENDEREÇO</h3>
                                <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                    {company.descricao_tipo_de_logradouro} {company.logradouro}, {company.numero}
                                    <br />
                                    {company.bairro} - {company.municipio}/{company.uf} • CEP: {company.cep}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Editáveis (Compactado) */}
                        <div className="space-y-4">
                            {/* Contact e Notas */}
                            <div className="p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-tertiary)]/20">
                                <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-3">✏️ EDITAR INFORMAÇÕES</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={telefone}
                                            onChange={(e) => setTelefone(e.target.value)}
                                            placeholder="Telefone"
                                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                                        />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email"
                                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                                        />
                                    </div>
                                    <textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Observações internas..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                                    />
                                </div>
                            </div>

                            {/* Quick Info Compacto */}
                            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] px-2">
                                <span className="flex items-center gap-1">✅ BrasilAPI</span>
                                <span className="flex items-center gap-1">🔒 Salvo localmente</span>
                            </div>
                        </div>
                    </div>

                    {/* Meta-tag e Pixel Section */}
                    {!isSaved && (
                        <div className="mb-6 p-5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-tertiary)]/30">
                            <h3 className="text-sm font-bold text-[var(--color-accent-primary)] mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                VERIFICAÇÃO DE DOMÍNIO (FACEBOOK BUSINESS)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
                                        Token de Verificação de Domínio (Meta-tag)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: <meta name='facebook-domain-verification' content='...' />"
                                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] font-mono"
                                        value={verificationToken}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Tenta extrair o content se for uma tag completa
                                            const match = val.match(/content=["']([^"']+)["']/);
                                            const token = match ? match[1] : val;
                                            setVerificationToken(token);
                                        }}
                                        id="verificationTokenInput"
                                    />
                                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                                        Cole o código completo da meta-tag ou apenas o token.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
                                        ID do Pixel do Facebook
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 1234567890"
                                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] font-mono"
                                        value={pixelId}
                                        onChange={(e) => setPixelId(e.target.value.replace(/[^0-9]/g, ''))}
                                        id="pixelIdInput"
                                    />
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Área de Link Gerado (Substitui Verificação de Domínio) */}
                    {isSaved && generatedUrl ? (
                        <div className="mt-6 p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
                            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6" />
                                Página Verificada Gerada com Sucesso!
                            </h3>

                            <div className="flex flex-col md:flex-row gap-3 items-center">
                                <div className="flex-1 w-full relative">
                                    <input
                                        readOnly
                                        value={generatedUrl}
                                        className="w-full pl-4 pr-12 py-3 bg-[var(--color-bg-primary)] border border-green-500/30 rounded-lg text-sm text-[var(--color-text-primary)] font-mono"
                                    />
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedUrl);
                                            toast.success('Link copiado!');
                                        }}
                                        className="flex-1 md:flex-none px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Copiar
                                    </button>
                                    <button
                                        onClick={() => window.open(generatedUrl, '_blank')}
                                        className="flex-1 md:flex-none px-4 py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Abrir
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-[var(--color-text-muted)] mt-3">
                                Este link é exclusivo para esta empresa e já foi salvo no seu painel.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 flex flex-col gap-4">
                            {/* Aviso Informativo */}
                            <div className="flex items-start gap-3 p-4 bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Info className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                                        Geração de Página Verificada (White Label)
                                    </h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                        Selecione um de seus domínios verificados para hospedar esta página. Isso garante conformidade total com o Facebook Ads.
                                    </p>
                                </div>
                            </div>

                            {/* SELEÇÃO DE DOMÍNIO */}
                            {!isLoadingDomains && userDomains.length === 0 ? (
                                <div className="p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-xl text-center">
                                    <h4 className="text-yellow-400 font-bold mb-2">⚠️ Nenhum Domínio Conectado</h4>
                                    <p className="text-sm text-yellow-200/80 mb-4">
                                        Para gerar páginas verificadas, você precisa conectar seu próprio domínio primeiro.
                                    </p>
                                    <a
                                        href="/minha-area?tab=domains"
                                        className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Conectar Domínio Agora
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">
                                        Selecione o Domínio
                                    </label>
                                    <select
                                        value={selectedDomainId}
                                        onChange={(e) => setSelectedDomainId(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                        disabled={isLoadingDomains || isSaving}
                                    >
                                        {isLoadingDomains && <option>Carregando domínios...</option>}
                                        {!isLoadingDomains && userDomains.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.domain}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Botão de Ação Principal */}
                            <button
                                onClick={handleSaveCompany}
                                disabled={isSaving || userDomains.length === 0}
                                className={`w-full py-4 rounded-xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-3 group ${userDomains.length === 0
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white hover:shadow-purple-500/20'
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        VINCULANDO DOMÍNIO...
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        {verificationToken || pixelId ? 'SALVAR & INJETAR CÓDIGO' : 'GERAR LINK & SALVAR'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-[var(--color-border)] flex gap-2">
                    <button
                        onClick={handleOpenPDF}
                        disabled={isPdfLoading}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow shadow-red-900/30"
                    >
                        {isPdfLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                GERANDO PDF...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                GERAR PDF
                            </>
                        )}
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
