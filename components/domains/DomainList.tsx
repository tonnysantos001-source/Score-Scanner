'use client';

import { Globe, Check, RefreshCw, Trash2, ExternalLink, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useDomains, useVerifyDNS, useDeleteDomain } from '@/hooks/useDomains';

export default function DomainList() {
    const { data: domains = [], isLoading } = useDomains();
    const verifyMutation = useVerifyDNS();
    const deleteMutation = useDeleteDomain();

    // Filter external domains only
    const externalDomains = domains.filter(
        (d) => d.custom_domain_status !== undefined || !d.is_verified
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este domínio?')) return;

        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Domínio removido.');
        } catch {
            toast.error('Erro ao remover.');
        }
    };

    const handleReverify = async (domain: string, id: string) => {
        const toastId = toast.loading('Verificando DNS...');
        try {
            const result = await verifyMutation.mutateAsync({ domain, domainId: id });

            if (result.verification?.verified) {
                toast.success('Domínio verificado e ativo! ✅', { id: toastId });
            } else {
                toast.error(`Ainda não propagou: ${result.verification?.error || 'Aguarde'}`, { id: toastId });
            }
        } catch {
            toast.error('Erro de conexão.', { id: toastId });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="glass-card p-6 animate-pulse h-24" />
                ))}
            </div>
        );
    }

    if (externalDomains.length === 0) {
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
            {externalDomains.map((domain) => {
                const status = domain.custom_domain_status || (domain.is_verified ? 'active' : 'pending');

                return (
                    <div key={domain.id} className="glass-card p-5 transition-all hover:bg-[var(--color-bg-tertiary)]/50 group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${status === 'active'
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
                                        {status === 'active' ? (
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
                                    {status === 'failed' && (
                                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" />
                                            Falha na verificação. Tente novamente.
                                        </p>
                                    )}
                                    {domain.custom_domain_error && status !== 'active' && (
                                        <p className="text-xs text-yellow-400/80 mt-1">
                                            {domain.custom_domain_error}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {status !== 'active' && (
                                    <button
                                        onClick={() => handleReverify(domain.domain, domain.id)}
                                        disabled={verifyMutation.isPending}
                                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 disabled:opacity-50"
                                        title="Verificar Novamente"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${verifyMutation.isPending ? 'animate-spin' : ''}`} />
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
                                    disabled={deleteMutation.isPending}
                                    className="p-2.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50"
                                    title="Remover"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
