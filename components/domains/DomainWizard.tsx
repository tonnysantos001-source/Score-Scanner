'use client';

import { useState } from 'react';
import { Globe, Check, AlertCircle, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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

            // Generate a temporary entry in DB
            const { data, error } = await supabase
                .from('verified_domains')
                .insert({
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
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            {step === 1 && (
                <form onSubmit={handleAddDomain} className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Conectar Domínio Próprio</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Use seu próprio subdomínio (ex: <b>seguro.sualoja.com</b>) para evitar bloqueios do Facebook.
                        </p>
                    </div>

                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Ex: oferta.minhaloja.com"
                            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Próximo Passo'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500 text-xs flex items-center justify-center">2</span>
                            Configure seu DNS
                        </h3>
                        <p className="text-sm text-gray-400">
                            Acesse o painel do seu domínio (GoDaddy, Registro.br, Cloudflare) e crie o seguinte registro:
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <span className="text-xs text-gray-500 uppercase font-bold">Tipo</span>
                            <div className="text-xl font-mono text-white mt-1">CNAME</div>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <span className="text-xs text-gray-500 uppercase font-bold">Nome (Host)</span>
                            <div className="text-xl font-mono text-white mt-1 break-all">
                                {domain.split('.')[0]}
                            </div>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 group relative cursor-pointer"
                            onClick={() => {
                                navigator.clipboard.writeText('cname.verifyads.com');
                                toast.success('Copiado!');
                            }}>
                            <span className="text-xs text-gray-500 uppercase font-bold">Valor (Apontar para)</span>
                            <div className="text-xl font-mono text-blue-400 mt-1 flex items-center gap-2">
                                cname.verifyads.com
                                <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                        <p className="text-sm text-blue-200">
                            Após criar o registro, pode levar de 5 minutos a 24 horas para propagar.
                        </p>
                    </div>

                    {verificationResult && !verificationResult.success && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3 items-center">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <div className="text-sm text-red-200">
                                <p className="font-bold">Não conseguimos verificar ainda.</p>
                                <p>{verificationResult.error}</p>
                            </div>
                        </div>
                    )}

                    {verificationResult?.success && (
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex gap-3 items-center">
                            <Check className="w-5 h-5 text-green-400" />
                            <div className="text-sm text-green-200">
                                <p className="font-bold">Domínio Verificado!</p>
                                <p>Sua página já está segura e pronta para uso.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-gray-700">
                        <button
                            onClick={() => setStep(1)}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={verifyDNS}
                            disabled={loading || verificationResult?.success}
                            className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${verificationResult?.success
                                    ? 'bg-green-600 text-white cursor-default'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verificar Conexão'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
