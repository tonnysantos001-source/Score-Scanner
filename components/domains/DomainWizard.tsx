'use client';

import { useState } from 'react';
import { Globe, Check, AlertCircle, RefreshCw, Copy, ArrowRight, Server, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface DomainWizardProps {
    onSuccess: () => void;
}

export default function DomainWizard({ onSuccess }: DomainWizardProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Basic validation
            let cleanDomain = domain.toLowerCase().trim();
            cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

            if (!cleanDomain.includes('.')) {
                toast.error('Insira um domínio válido (ex: lp.minhaloja.com)');
                return;
            }

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Usuário não autenticado.');
                return;
            }

            // Generate a temporary entry in DB
            const { data, error } = await supabase
                .from('verified_domains')
                .insert({
                    user_id: user.id,
                    domain: cleanDomain,
                    company_cnpj: '00000000000000', // Placeholder
                    company_name: 'Custom Domain',
                    domain_type: 'external',
                    custom_domain_status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            setDomain(cleanDomain);
            setStep(2);
            toast.success('Domínio pré-cadastrado! Agora configure o DNS.');

        } catch (error: any) {
            console.error('Error adding domain:', error);
            if (error.code === '23505') {
                toast.error('Este domínio já está cadastrado.');
            } else {
                toast.error('Erro ao adicionar domínio.');
            }
        } finally {
            setLoading(false);
        }
    };

    const verifyDNS = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/domain/verify-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            });

            const data = await response.json();

            if (data.verification?.verified) {
                setVerificationResult({ success: true });
                toast.success('Domínio verificado com sucesso!');
                setTimeout(onSuccess, 2000);
            } else {
                setVerificationResult({
                    success: false,
                    error: data.verification?.error || 'Registro CNAME não encontrado.'
                });
            }

        } catch (error) {
            toast.error('Erro ao verificar DNS.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-8 h-full relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="relative z-10"
                    >
                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                                <Globe className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Conectar Domínio Próprio</h3>
                            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                                Use seu subdomínio (ex: <b>seguro.sualoja.com</b>) para evitar bloqueios do Facebook e aumentar a confiança.
                            </p>
                        </div>

                        <form onSubmit={handleAddDomain} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                    Seu Subdomínio
                                </label>
                                <div className="relative group">
                                    <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="Ex: oferta.minhaloja.com"
                                        className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-tertiary)] bg-opacity-50 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-600 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
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

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative z-10"
                    >
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">
                                    2
                                </span>
                                <h3 className="text-xl font-bold text-white">Configuração DNS</h3>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Adicione este registro CNAME no seu provedor de domínio (GoDaddy, Cloudflare, etc).
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)]">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Tipo</div>
                                        <div className="font-mono text-white bg-black/20 px-2 py-1 rounded inline-block">CNAME</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Nome (Host)</div>
                                        <div className="font-mono text-white text-sm truncate" title={domain.split('.')[0]}>
                                            {domain.split('.')[0]}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Valor (Apontar para)</div>
                                    <div
                                        className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg cursor-pointer hover:bg-blue-500/20 transition-colors group"
                                        onClick={() => {
                                            navigator.clipboard.writeText('cname.verifyads.com');
                                            toast.success('Copiado para área de transferência!');
                                        }}
                                    >
                                        <code className="text-blue-400 font-mono text-sm flex-1">cname.verifyads.com</code>
                                        <Copy className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {verificationResult?.success ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-4 mb-6"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h4 className="text-green-400 font-bold">Domínio Verificado!</h4>
                                    <p className="text-xs text-green-300/70">Tudo pronto para usar.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={verifyDNS}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verificar Conexão'}
                                </button>
                            </div>
                        )}

                        {verificationResult && !verificationResult.success && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <p className="text-xs text-red-400 bg-red-500/10 py-2 px-3 rounded-lg inline-flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" />
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
