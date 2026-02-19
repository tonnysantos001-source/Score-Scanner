'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Globe, Check, AlertCircle, RefreshCw, Trash2, ExternalLink, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Domain {
    id: string;
    domain: string;
    custom_domain_status: 'pending' | 'active' | 'failed';
    custom_domain_error?: string;
    created_at: string;
}

export default function DomainList({ keyTrigger }: { keyTrigger: number }) {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDomains = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('verified_domains')
                .select('*')
                .eq('domain_type', 'external') // Only show custom domains here
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDomains(data || []);
        } catch (error) {
            console.error('Error fetching domains:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, [keyTrigger]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este domínio?')) return;

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('verified_domains')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Domínio removido.');
            fetchDomains();
        } catch (error) {
            toast.error('Erro ao remover.');
        }
    };

    const handleReverify = async (domain: string, id: string) => {
        const toastId = toast.loading('Verificando DNS...');
        try {
            const response = await fetch('/api/domain/verify-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, domainId: id })
            });

            const data = await response.json();

            if (data.verification?.verified) {
                toast.success('Domínio verificado e ativo!', { id: toastId });
            } else {
                toast.error(`Ainda não propagou: ${data.verification?.error}`, { id: toastId });
            }
            fetchDomains();
        } catch (error) {
            toast.error('Erro de conexão.', { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="glass-card p-6 animate-pulse h-24" />
                ))}
            </div>
        );
    }

    if (domains.length === 0) {
        return (
            <div className="text-center p-12 glass-card border-dashed">
                <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Nenhum domínio conectado</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Use o formulário ao lado para conectar seu primeiro domínio personalizado.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {domains.map((domain) => (
                <div key={domain.id} className="glass-card p-5 transition-all hover:bg-[var(--color-bg-tertiary)]/50 group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${domain.custom_domain_status === 'active'
                                ? 'bg-green-500/10 text-green-500 shadow-green-500/10'
                                : 'bg-yellow-500/10 text-yellow-500 shadow-yellow-500/10'
                                }`}>
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-mono text-white text-lg font-bold truncate">
                                    {domain.domain}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    {domain.custom_domain_status === 'active' ? (
                                        <span className="badge badge-success">
                                            <Check className="w-3 h-3" /> ATIVO
                                        </span>
                                    ) : (
                                        <span className="badge badge-warning">
                                            <RefreshCw className="w-3 h-3 animate-spin" /> PENDENTE
                                        </span>
                                    )}
                                    <span className="text-gray-600 text-xs hidden sm:inline">•</span>
                                    <span className="text-[var(--color-text-muted)] text-xs truncate">
                                        Adicionado em {new Date(domain.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {domain.custom_domain_status === 'failed' && (
                                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3" />
                                        Falha na verificação. Tente novamente.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {domain.custom_domain_status !== 'active' && (
                                <button
                                    onClick={() => handleReverify(domain.domain, domain.id)}
                                    className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20"
                                    title="Verificar Novamente"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            )}

                            <a
                                href={`https://${domain.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                                title="Abrir Site"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>

                            <button
                                onClick={() => handleDelete(domain.id)}
                                className="p-2.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                                title="Remover"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
