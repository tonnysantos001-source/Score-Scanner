'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Globe, Check, AlertCircle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
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

    if (loading) return <div className="text-center p-8 text-gray-500">Carregando domínios...</div>;

    if (domains.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed border-gray-700 rounded-xl">
                <Globe className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-white font-medium">Nenhum domínio conectado</h3>
                <p className="text-gray-400 text-sm">Adicione seu primeiro domínio acima.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {domains.map((domain) => (
                <div key={domain.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${domain.custom_domain_status === 'active'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-mono text-white text-lg">{domain.domain}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                {domain.custom_domain_status === 'active' ? (
                                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> ATIVO
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-pulse" /> PENDENTE
                                    </span>
                                )}
                                <span className="text-gray-600 text-xs">•</span>
                                <span className="text-gray-500 text-xs">
                                    Adicionado em {new Date(domain.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {domain.custom_domain_status !== 'active' && (
                            <button
                                onClick={() => handleReverify(domain.domain, domain.id)}
                                className="p-2 hover:bg-white/5 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                                title="Verificar Novamente"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}

                        <a
                            href={`https://${domain.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Abrir Site"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </a>

                        <button
                            onClick={() => handleDelete(domain.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Remover"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
