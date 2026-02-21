'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, AlertCircle, RefreshCw, Copy, ArrowRight, Server, ShieldCheck, Clock, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DomainWizardProps {
    onSuccess: () => void;
}

interface DNSInstructions {
    isRoot: boolean;
    primaryOption: { type: string; host: string; value: string };
    alternativeOption?: { type: string; host: string; value: string };
    providerNotes: string[];
}

export default function DomainWizard({ onSuccess }: DomainWizardProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [domain, setDomain] = useState('');
    const [domainId, setDomainId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean;
        error?: string;
        method?: string;
    } | null>(null);
    const [dnsInstructions, setDnsInstructions] = useState<DNSInstructions | null>(null);
    const [pollCount, setPollCount] = useState(0);

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let cleanDomain = domain.toLowerCase().trim();
            cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

            if (!cleanDomain.includes('.')) {
                toast.error('Insira um domínio válido (ex: lp.minhaloja.com)');
                return;
            }

            const response = await fetch('/api/domain/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnpj: '00000000000000',
                    domain: cleanDomain,
                    company_name: 'Custom Domain',
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errorMsg = data.error || 'Erro ao adicionar domínio';
                if (errorMsg.includes('já') || response.status === 400) {
                    toast.error('Este domínio já está cadastrado.');
                } else {
                    toast.error(errorMsg);
                }
                return;
            }

            // Get DNS instructions from the backend
            const instructions = buildDNSInstructions(cleanDomain);
            setDnsInstructions(instructions);
            setDomain(cleanDomain);
            setDomainId(data.domain_id);
            setStep(2);
            toast.success('Domínio pré-cadastrado! Agora configure o DNS.');

        } catch (error: unknown) {
            console.error('Error adding domain:', error);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const verifyDNS = useCallback(async (silent = false) => {
        if (!domainId || !domain) return;
        if (!silent) setLoading(true);

        try {
            const response = await fetch('/api/domain/verify-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, domainId })
            });

            const data = await response.json();

            if (data.verification?.verified || data.dns_status === 'verified') {
                setVerificationResult({
                    success: true,
                    method: data.verification?.method || 'DNS',
                });
                toast.success(`Domínio verificado com sucesso! 🎉`);
                setTimeout(onSuccess, 2000);
            } else {
                setVerificationResult({
                    success: false,
                    error: data.verification?.error || 'Registro DNS não encontrado ainda.',
                });
                if (!silent) {
                    setPollCount(prev => prev + 1);
                }
            }
        } catch {
            if (!silent) toast.error('Erro ao verificar DNS.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [domain, domainId, onSuccess]);

    // Auto-polling: check every 15s when on step 2 with pending result
    useEffect(() => {
        if (step !== 2 || !domainId || verificationResult?.success) return;

        const interval = setInterval(() => {
            verifyDNS(true); // silent — no loading indicator, no error toasts
        }, 15000);

        return () => clearInterval(interval);
    }, [step, domainId, verificationResult?.success, verifyDNS]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado!');
    };

    return (
        <div className="glass-card p-8 h-full relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="relative z-10 flex-1 flex flex-col"
                    >
                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                                <Globe className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Conectar Domínio</h3>
                            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                                Use seu domínio ou subdomínio (ex: <b>seguro.sualoja.com</b> ou <b>sualoja.com.br</b>) para suas landing pages.
                            </p>
                        </div>

                        <form onSubmit={handleAddDomain} className="space-y-6 flex-1 flex flex-col">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                    Seu Domínio
                                </label>
                                <div className="relative group">
                                    <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="Ex: lp.minhaloja.com ou sualoja.com.br"
                                        className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-tertiary)] bg-opacity-50 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-600 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group mt-auto"
                            >
                                {loading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Iniciar Configuração
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 2 && dnsInstructions && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative z-10 flex-1 flex flex-col"
                    >
                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">
                                    2
                                </span>
                                <h3 className="text-lg font-bold text-white">Configuração DNS</h3>
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                Configure no painel do seu provedor de domínio. {dnsInstructions.isRoot ? 'Como é um domínio raiz, temos duas opções:' : 'Adicione o registro CNAME:'}
                            </p>
                        </div>

                        <div className="space-y-3 mb-3 flex-1 overflow-y-auto">
                            {/* Primary Option */}
                            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                                        {dnsInstructions.isRoot ? 'Opção A (Recomendada)' : 'Registro'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Tipo</div>
                                        <div className="font-mono text-white bg-black/20 px-2 py-1 rounded inline-block text-sm">
                                            {dnsInstructions.primaryOption.type}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Host</div>
                                        <div className="font-mono text-white text-sm">{dnsInstructions.primaryOption.host}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Valor</div>
                                        <div
                                            className="flex items-center gap-1 cursor-pointer hover:text-blue-300 transition-colors"
                                            onClick={() => copyToClipboard(dnsInstructions.primaryOption.value)}
                                        >
                                            <code className="text-blue-400 font-mono text-xs truncate">{dnsInstructions.primaryOption.value}</code>
                                            <Copy className="w-3 h-3 text-blue-400 opacity-60 shrink-0" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alternative Option (for root domains) */}
                            {dnsInstructions.alternativeOption && (
                                <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">
                                            Opção B (Alternativa)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Tipo</div>
                                            <div className="font-mono text-white bg-black/20 px-2 py-1 rounded inline-block text-sm">
                                                {dnsInstructions.alternativeOption.type}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Host</div>
                                            <div className="font-mono text-white text-sm">{dnsInstructions.alternativeOption.host}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Valor</div>
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:text-blue-300 transition-colors"
                                                onClick={() => copyToClipboard(dnsInstructions.alternativeOption!.value)}
                                            >
                                                <code className="text-blue-400 font-mono text-xs">{dnsInstructions.alternativeOption.value}</code>
                                                <Copy className="w-3 h-3 text-blue-400 opacity-60 shrink-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Provider Tips */}
                            {dnsInstructions.isRoot && (
                                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <div className="flex gap-2 mb-2">
                                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                        <span className="text-xs font-bold text-blue-300">Dicas por provedor:</span>
                                    </div>
                                    <ul className="space-y-1.5 ml-6">
                                        {dnsInstructions.providerNotes.map((note, i) => (
                                            <li key={i} className="text-[11px] text-gray-400 leading-relaxed">
                                                {note}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Propagation Warning */}
                        <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl mb-4">
                            <div className="flex gap-2">
                                <Clock className="w-4 h-4 text-yellow-500/50 shrink-0" />
                                <div>
                                    <p className="text-[11px] text-yellow-200/80 leading-relaxed font-medium">
                                        Propagação pode levar de minutos até 48h. Verificaremos automaticamente a cada 15 segundos.
                                    </p>
                                    {pollCount > 0 && (
                                        <p className="text-[11px] text-yellow-200/50 mt-1">
                                            Verificações automáticas: {pollCount} {pollCount === 1 ? 'tentativa' : 'tentativas'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {verificationResult?.success ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-4 mb-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h4 className="text-green-400 font-bold">Domínio Verificado!</h4>
                                    <p className="text-xs text-green-300/70">
                                        Verificado via {verificationResult.method === 'CNAME_WWW' ? 'CNAME (www)' : verificationResult.method}. Tudo pronto.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col gap-3 mb-2">
                                <button
                                    onClick={() => verifyDNS(false)}
                                    disabled={loading}
                                    className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verificar Conexão
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={onSuccess}
                                    className="w-full py-3 bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-white rounded-xl font-medium transition-colors border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]"
                                >
                                    Salvar e Verificar Depois
                                </button>
                            </div>
                        )}

                        {verificationResult && !verificationResult.success && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mt-2"
                            >
                                <p className="text-xs text-red-400 bg-red-500/10 py-2 px-3 rounded-lg inline-flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    {verificationResult.error}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// Client-side DNS instruction builder
// (mirrors server-side logic without importing server code)
// ============================================

function buildDNSInstructions(domain: string): DNSInstructions {
    const parts = domain.split('.');
    const isRoot = isApexDomainClient(domain);

    if (isRoot) {
        return {
            isRoot: true,
            primaryOption: { type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com' },
            alternativeOption: { type: 'A', host: '@', value: '76.76.21.21' },
            providerNotes: [
                'UOL Host: Use "www" como entrada e CNAME como tipo',
                'Registro.br: Adicione tipo A para @ com IP 76.76.21.21',
                'GoDaddy: CNAME com host "www" → cname.vercel-dns.com',
                'Cloudflare: CNAME @ → cname.vercel-dns.com (com Flattening)',
                'Hostinger: CNAME com host "www" → cname.vercel-dns.com',
            ],
        };
    }

    return {
        isRoot: false,
        primaryOption: { type: 'CNAME', host: parts[0], value: 'cname.vercel-dns.com' },
        providerNotes: [`Adicione CNAME "${parts[0]}" → cname.vercel-dns.com`],
    };
}

function isApexDomainClient(domain: string): boolean {
    const parts = domain.toLowerCase().split('.');
    const brTLDs = ['com.br', 'net.br', 'org.br', 'edu.br', 'gov.br', 'art.br', 'blog.br', 'dev.br', 'app.br'];
    for (const tld of brTLDs) {
        if (domain.endsWith(`.${tld}`)) return parts.length === 3;
    }
    return parts.length === 2;
}
