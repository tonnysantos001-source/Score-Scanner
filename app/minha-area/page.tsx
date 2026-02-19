'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { DomainCard } from '@/components/dashboard/DomainCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SearchAndFilters } from '@/components/dashboard/SearchAndFilters';
import { EditDomainModal } from '@/components/dashboard/EditDomainModal';
import { Globe, Loader2, Layout, Server, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/dashboard/Navigation';

import DomainWizard from '@/components/domains/DomainWizard';
import DomainList from '@/components/domains/DomainList';

interface DomainStats {
    total_domains: number;
    verified_domains: number;
    pending_domains: number;
    active_landing_pages: number;
    created_this_month: number;
}
// ... existing interfaces ...

interface Domain {
    id: string;
    domain: string;
    company_name: string;
    company_cnpj: string;
    is_verified: boolean;
    verified_at: string | null;
    verification_token?: string;
    created_at: string;
    landing_pages?: Array<{
        id: string;
        slug: string;
        is_active: boolean;
        title_text?: string;
        description_text?: string;
        facebook_pixel_id?: string;
        use_generic?: boolean;
    }>;
}

export default function MinhaAreaPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState<DomainStats | null>(null);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingDomains, setIsLoadingDomains] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'pages' | 'domains'>('pages');
    const [refreshKey, setRefreshKey] = useState(0);

    // Filtros e busca
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');

    // Modal de edição
    const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

    // Proteção de rota
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchDomains();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            setIsLoadingStats(true);
            const response = await fetch('/api/domain/stats');
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            } else {
                setError(data.error || 'Erro ao carregar estatísticas');
            }
        } catch {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const fetchDomains = async () => {
        try {
            setIsLoadingDomains(true);
            const response = await fetch('/api/domain/list');
            const data = await response.json();

            if (data.success) {
                setDomains(data.domains || []);
            }
        } catch {
            console.error('Erro ao carregar domínios');
        } finally {
            setIsLoadingDomains(false);
        }
    };

    // Filtrar e ordenar domínios
    const filteredAndSortedDomains = useMemo(() => {
        let result = [...domains];

        // Aplicar busca
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(
                (d) =>
                    d.domain.toLowerCase().includes(searchLower) ||
                    d.company_name.toLowerCase().includes(searchLower) ||
                    d.company_cnpj.includes(searchTerm)
            );
        }

        // Aplicar filtro de status
        if (statusFilter === 'verified') {
            result = result.filter((d) => d.is_verified);
        } else if (statusFilter === 'pending') {
            result = result.filter((d) => !d.is_verified);
        }

        // Aplicar ordenação
        if (sortBy === 'recent') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'alphabetical') {
            result.sort((a, b) => a.domain.localeCompare(b.domain));
        }

        return result;
    }, [domains, searchTerm, statusFilter, sortBy]);

    const handleEdit = (domainId: string) => {
        const domain = domains.find((d) => d.id === domainId);
        if (domain) {
            setEditingDomain(domain);
        }
    };

    const handleDelete = async (domainId: string) => {
        const domain = domains.find((d) => d.id === domainId);
        if (!domain) return;

        const confirmed = window.confirm(
            `Tem certeza que deseja excluir o domínio "${domain.domain}"?\n\nEsta ação não pode ser desfeita e a landing page também será excluída.`
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/domain/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: domainId }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Domínio excluído com sucesso!');
                fetchDomains();
                fetchStats();
            } else {
                toast.error(data.error || 'Erro ao excluir domínio');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor');
        }
    };

    const handleRevalidate = async (domainId: string) => {
        const domain = domains.find((d) => d.id === domainId);
        if (!domain) return;

        const toastId = toast.loading('Verificando registro CNAME...');
        try {
            const response = await fetch('/api/domain/verify-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domain.domain, domainId }),
            });

            const data = await response.json();

            if (data.verification?.verified) {
                toast.success('✅ Domínio verificado e ativo!', { id: toastId });
                fetchDomains();
                fetchStats();
            } else {
                const errMsg = data.verification?.error || 'CNAME ainda não propagou';
                toast.error(`⏳ ${errMsg}. Tente novamente em alguns minutos.`, { id: toastId, duration: 6000 });
            }
        } catch {
            toast.error('Erro ao verificar DNS. Tente novamente.', { id: toastId });
        }
    };

    const handleSaveEdit = () => {
        fetchDomains();
        fetchStats();
    };

    // Loading state enquanto verifica autenticação
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    // Não renderiza nada se não estiver autenticado (será redirecionado)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header com menu dropdown */}
                <Navigation
                    title="Minha Área"
                    description="Gerencie seus domínios verificados e landing pages"
                />

                {/* Error State */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="glass-card p-4 border-l-4 border-red-500 flex items-center justify-between"
                        >
                            <p className="text-red-400 text-sm font-medium">❌ {error}</p>
                            <button onClick={() => setError(null)} className="text-gray-500 hover:text-white">
                                <span className="sr-only">Fechar</span>
                                ✕
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Cards */}
                <StatsCards
                    totalDomains={stats?.total_domains || 0}
                    verifiedDomains={stats?.verified_domains || 0}
                    activeLandingPages={stats?.active_landing_pages || 0}
                    createdThisMonth={stats?.created_this_month || 0}
                    isLoading={isLoadingStats}
                />

                {/* Wrapper Principal das Abas */}
                <div className="space-y-6">
                    {/* Tab Navigation Pill Design */}
                    <div className="flex justify-center md:justify-start">
                        <div className="bg-[var(--color-bg-tertiary)]/50 p-1 rounded-xl inline-flex border border-[var(--color-border)] relative">
                            <button
                                onClick={() => setActiveTab('pages')}
                                className={`relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all z-10 flex items-center gap-2 ${activeTab === 'pages' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                <Layout className="w-4 h-4" />
                                Minhas Empresas Ativas
                                {activeTab === 'pages' && (
                                    <motion.div
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-lg shadow-blue-900/40"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab('domains')}
                                className={`relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all z-10 flex items-center gap-2 ${activeTab === 'domains' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                <Server className="w-4 h-4" />
                                Domínios Próprios (White Label)
                                {activeTab === 'domains' && (
                                    <motion.div
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-lg shadow-blue-900/40"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'domains' ? (
                            <motion.div
                                key="domains"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column: Wizard */}
                                    <div className="lg:col-span-1">
                                        <div className="sticky top-8">
                                            <DomainWizard onSuccess={() => setRefreshKey(prev => prev + 1)} />
                                        </div>
                                    </div>

                                    {/* Right Column: List */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <Globe className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Domínios Conectados</h3>
                                        </div>
                                        <DomainList keyTrigger={refreshKey} />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="pages"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="text-2xl">📋</span> Minhas Empresas Ativas
                                    </h2>
                                </div>


                                {/* Search and Filters */}
                                {!isLoadingDomains && domains.length > 0 && (
                                    <SearchAndFilters
                                        searchTerm={searchTerm}
                                        onSearchChange={setSearchTerm}
                                        statusFilter={statusFilter}
                                        onStatusChange={setStatusFilter}
                                        sortBy={sortBy}
                                        onSortChange={setSortBy}
                                    />
                                )}

                                {/* Loading State */}
                                {isLoadingDomains && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="glass-card h-[280px] animate-pulse relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty State */}
                                {!isLoadingDomains && filteredAndSortedDomains.length === 0 && domains.length === 0 && (
                                    <EmptyState onAction={() => setActiveTab('domains')} />
                                )}

                                {/* No Results State */}
                                {!isLoadingDomains && filteredAndSortedDomains.length === 0 && domains.length > 0 && (
                                    <div className="glass-card p-12 text-center border-dashed border border-gray-700">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <SearchX className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Nenhum resultado encontrado</h3>
                                        <p className="text-[var(--color-text-muted)]">
                                            Tente ajustar seus filtros ou termos de busca.
                                        </p>
                                        <button
                                            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold"
                                        >
                                            Limpar filtros
                                        </button>
                                    </div>
                                )}

                                {/* Domains Grid */}
                                {!isLoadingDomains && filteredAndSortedDomains.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence mode="popLayout">
                                            {filteredAndSortedDomains.map((domain) => (
                                                <motion.div
                                                    key={domain.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <DomainCard
                                                        domain={domain}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        onRevalidate={handleRevalidate}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Edit Modal */}
                {editingDomain && (
                    <EditDomainModal
                        key={editingDomain.id}
                        domainId={editingDomain.id}
                        domain={editingDomain.domain}
                        isVerified={editingDomain.is_verified}
                        initialData={{
                            title: editingDomain.landing_pages?.[0]?.title_text,
                            description: editingDomain.landing_pages?.[0]?.description_text,
                            pixel_id: editingDomain.landing_pages?.[0]?.facebook_pixel_id,
                            is_active: editingDomain.landing_pages?.[0]?.is_active,
                            use_generic: editingDomain.landing_pages?.[0]?.use_generic,
                            slug: editingDomain.landing_pages?.[0]?.slug,
                            verification_token: editingDomain.verification_token || undefined,
                        }}
                        companyData={{
                            razao_social: editingDomain.company_name,
                        }}
                        onClose={() => setEditingDomain(null)}
                        onSave={handleSaveEdit}
                    />
                )}
            </div>
        </div>
    );
}
