'use client';

import { useState, useEffect } from 'react';
import { EnhancedCompanyData } from '@/types/company';
import { formatCNPJ } from '@/lib/utils/cnpj';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { X, Share2, CheckCircle2, Eye, Link as LinkIcon, FileText, Loader2, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyModalProps {
    company: EnhancedCompanyData;
    onClose: () => void;
}

export default function CompanyModal({ company, onClose }: CompanyModalProps) {
    const { hasActivePlan } = useAuth();
    const [telefone, setTelefone] = useState(company.telefone || company.ddd_telefone_1 || company.custom_phone || '');
    const [email, setEmail] = useState(company.email || company.custom_email || '');
    const [verificationToken, setVerificationToken] = useState('');
    const [pixelId, setPixelId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [userDomains, setUserDomains] = useState<any[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(true);

    // Fetch domains on mount — useEffect garante que rode sempre que o modal abre
    useEffect(() => {
        let cancelled = false;
        const fetchDomains = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await supabase
                    .from('verified_domains')
                    .select('id, domain')
                    .eq('domain_type', 'external')
                    .order('created_at', { ascending: false });
                if (!cancelled && data) {
                    setUserDomains(data);
                    if (data.length > 0) setSelectedDomainId(data[0].id);
                }
            } catch { /* silent */ }
            finally { if (!cancelled) setIsLoadingDomains(false); }
        };
        fetchDomains();
        return () => { cancelled = true; };
    }, []);

    const handleOpenPDF = async () => {
        try {
            setIsPdfLoading(true);
            const { generateOfficialPDF } = await import('@/lib/pdf/official-pdf');
            const blob = await generateOfficialPDF(company, {
                telefone: telefone || undefined,
                email: email || undefined,
            });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success('PDF gerado!', { description: 'Use Ctrl+S para salvar' });
        } catch {
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsPdfLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        if (!selectedDomainId) { toast.error('Selecione um domínio.'); return; }
        setIsSaving(true);
        try {
            const response = await fetch('/api/domain/save-with-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_cnpj: company.cnpj,
                    company_name: company.razao_social,
                    custom_phone: telefone,
                    custom_email: email,
                    custom_notes: '',
                    verification_token: verificationToken,
                    pixel_id: pixelId,
                    domain_id: selectedDomainId,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
            setIsSaved(true);
            setGeneratedUrl(data.url);
            toast.success('Página gerada!', { description: 'Seu link exclusivo está pronto.' });
        } catch (error: any) {
            toast.error('Falha ao gerar link', { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const endereco = [
        company.descricao_tipo_de_logradouro,
        company.logradouro,
        company.numero ? `nº ${company.numero}` : '',
    ].filter(Boolean).join(' ');

    const cidadeUF = `${company.bairro ? company.bairro + ' · ' : ''}${company.municipio}/${company.uf} · CEP ${company.cep}`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.93, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="glass-card w-full flex flex-col"
                style={{ maxWidth: 900, maxHeight: '95vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── HEADER ── */}
                <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-base font-bold leading-tight">
                                <span className="text-gradient">Dossiê Empresarial</span>
                            </h2>
                            <p className="text-[11px] text-[var(--color-text-muted)] leading-none mt-0.5 max-w-[420px] truncate">
                                {company.razao_social}
                            </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25">
                            {company.tipo_situacao_cadastral}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── BODY — 3 columns, zero scroll ── */}
                <div className="p-3 flex-1 grid grid-cols-3 gap-3 min-h-0">

                    {/* COL 1 — Empresa + Endereço */}
                    <div className="flex flex-col gap-2">
                        {/* Dados da empresa */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/20 p-3 flex-1">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">📋 Dados da Empresa</p>
                            <div className="space-y-1.5 text-xs">
                                <Row label="CNPJ" value={formatCNPJ(company.cnpj)} />
                                <Row label="Abertura" value={formatDate(company.data_inicio_atividade)} />
                                <Row label="Capital" value={formatCurrency(company.capital_social)} />
                                <Row label="Porte" value={company.porte} />
                                <div className="pt-1 border-t border-white/[0.06] mt-1">
                                    <p className="text-[10px] text-gray-500 leading-snug">
                                        <span className="text-gray-400 font-semibold">CNAE: </span>
                                        {company.cnae_fiscal} — {company.cnae_fiscal_descricao}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/20 p-3">
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">📍 Endereço</p>
                            <p className="text-xs text-gray-300 leading-snug">{endereco}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{cidadeUF}</p>
                        </div>
                    </div>

                    {/* COL 2 — Editar + Verificação Facebook */}
                    <div className="flex flex-col gap-2">
                        {/* Editar contato */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/20 p-3">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">✏️ Editar Informações</p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    placeholder="Telefone"
                                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                                />
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                <span>✅ BrasilAPI</span>
                                <span>🔒 Salvo local</span>
                            </div>
                        </div>

                        {/* Verificação Facebook */}
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex-1 flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">🔵 Verificação Facebook</p>
                            <div>
                                <p className="text-[10px] text-gray-500 mb-1">Token Meta-tag</p>
                                <input
                                    type="text"
                                    placeholder="Ex: <meta name='facebook-domain-verification'..."
                                    className="w-full px-2.5 py-1.5 text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                    value={verificationToken}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const match = val.match(/content=["']([^"']+)["']/);
                                        setVerificationToken(match ? match[1] : val);
                                    }}
                                />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 mb-1">ID do Pixel</p>
                                <input
                                    type="text"
                                    placeholder="Ex: 1234567890"
                                    className="w-full px-2.5 py-1.5 text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* COL 3 — Domínio + Gerar Link */}
                    <div className="flex flex-col gap-2">
                        {isSaved && generatedUrl ? (
                            // Sucesso
                            <div className="flex-1 rounded-xl border border-green-500/20 bg-green-500/8 p-4 flex flex-col gap-3" style={{ background: 'rgba(34,197,94,0.06)' }}>
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <p className="font-bold text-sm">Link Gerado!</p>
                                </div>
                                <input readOnly value={generatedUrl}
                                    className="w-full px-3 py-2 bg-black/20 border border-green-500/20 rounded-lg text-xs font-mono text-gray-300" />
                                <div className="flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(generatedUrl); toast.success('Copiado!'); }}
                                        className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
                                        <Share2 className="w-3.5 h-3.5" /> Copiar
                                    </button>
                                    <button onClick={() => window.open(generatedUrl, '_blank')}
                                        className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5" /> Abrir
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Domain info */}
                                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe className="w-3.5 h-3.5 text-purple-400" />
                                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Página White Label</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-snug">
                                        Hospede a landing page verificada no seu domínio para usar no Facebook Ads.
                                    </p>
                                </div>

                                {/* Domain selector or warning */}
                                {isLoadingDomains ? (
                                    <div className="flex items-center justify-center py-4 text-gray-500 text-xs gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando domínios...
                                    </div>
                                ) : userDomains.length === 0 ? (
                                    <div className="flex-1 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 flex flex-col items-center justify-center gap-3 text-center" style={{ background: 'rgba(245,158,11,0.07)' }}>
                                        <p className="text-amber-400 font-bold text-xs">⚠️ Nenhum Domínio Conectado</p>
                                        <p className="text-[10px] text-amber-200/60 leading-snug">
                                            Conecte seu domínio para gerar páginas verificadas.
                                        </p>
                                        <a href="/minha-area?tab=domains"
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition">
                                            Conectar Domínio
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div>
                                            <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Selecione o Domínio</p>
                                            <select
                                                value={selectedDomainId}
                                                onChange={(e) => setSelectedDomainId(e.target.value)}
                                                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                disabled={isSaving}
                                            >
                                                {userDomains.map(d => (
                                                    <option key={d.id} value={d.id}>{d.domain}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Gerar Link button */}
                                        {hasActivePlan ? (
                                            <button
                                                onClick={handleSaveCompany}
                                                disabled={isSaving}
                                                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 disabled:opacity-50 text-white transition flex items-center justify-center gap-2 shadow shadow-purple-900/30"
                                            >
                                                {isSaving ? (
                                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> VINCULANDO...</>
                                                ) : (
                                                    <><LinkIcon className="w-3.5 h-3.5" />
                                                        {verificationToken || pixelId ? 'SALVAR & INJETAR CÓDIGO' : 'GERAR LINK & SALVAR'}
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toast.error('Assine um plano para gerar landing pages', { description: 'Acesse Minha Conta → Planos.' })}
                                                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-800 border border-gray-700 text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed"
                                            >
                                                <Lock className="w-3.5 h-3.5" /> GERAR LINK — Plano necessário
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div className="px-3 pb-3 shrink-0">
                    {hasActivePlan ? (
                        <button
                            onClick={handleOpenPDF}
                            disabled={isPdfLoading}
                            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:opacity-60 text-white transition flex items-center justify-center gap-2 shadow shadow-red-900/30"
                        >
                            {isPdfLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> GERANDO PDF...</>
                            ) : (
                                <><FileText className="w-4 h-4" /> GERAR PDF</>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => toast.error('Assine um plano para gerar o PDF', { description: 'Acesse Minha Conta → Planos.' })}
                            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-800 border border-gray-700 text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            <Lock className="w-4 h-4" /> GERAR PDF — Plano necessário
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-baseline gap-2">
            <span className="text-gray-500 text-[10px] shrink-0">{label}</span>
            <span className="font-semibold text-gray-200 text-[11px] text-right truncate max-w-[160px]">{value}</span>
        </div>
    );
}
