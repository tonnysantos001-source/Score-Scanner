'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { DomainCard } from '@/components/dashboard/DomainCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SearchAndFilters } from '@/components/dashboard/SearchAndFilters';
import { EditDomainModal } from '@/components/dashboard/EditDomainModal';
import { Globe, Loader2 } from 'lucide-react';
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
        try {
            toast.loading('Validando domínio...', { id: 'revalidate' });

            const response = await fetch('/api/domain/revalidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: domainId }),
            });


            const data = await response.json();
            toast.dismiss('revalidate');

            if (data.success && data.isValid) {
                toast.success('Domínio verificado com sucesso! 🎉');
                fetchDomains();
                fetchStats();
            } else {
                toast.error(data.error || 'Meta tag não encontrada no domínio');
            }
        } catch {
            toast.dismiss('revalidate');
            toast.error('Erro ao conectar com o servidor');
        }
    };

    const handleSaveEdit = () => {
        fetchDomains();
        fetchStats();
    };

    // Loading state enquanto verifica autenticação
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
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
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header com menu dropdown */}
                <Navigation
                    title="Minha Área"
                    description="Gerencie seus domínios verificados e landing pages"
                />

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-4 mb-6 border-l-4 border-red-500"
                    >
                        <p className="text-red-500 text-sm">❌ {error}</p>
                    </motion.div>
                )}

                {/* Stats Cards */}
                <StatsCards
                    totalDomains={stats?.total_domains || 0}
                    verifiedDomains={stats?.verified_domains || 0}
                    activeLandingPages={stats?.active_landing_pages || 0}
                    createdThisMonth={stats?.created_this_month || 0}
                    isLoading={isLoadingStats}
                />

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

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('pages')}
                        className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'pages'
                            ? 'text-blue-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Minhas Páginas
                        {activeTab === 'pages' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('domains')}
                        className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'domains'
                            ? 'text-blue-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Domínios Próprios (White Label)
                        {activeTab === 'domains' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                            />
                        )}
                    </button>
                </div>

                {/* DOMAINS TAB */}
                {activeTab === 'domains' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Wizard */}
                            <div className="lg:col-span-1">
                                <DomainWizard onSuccess={() => setRefreshKey(prev => prev + 1)} />
                            </div>

                            {/* Right Column: List */}
                            <div className="lg:col-span-2">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                    Domínios Conectados
                                </h3>
                                <DomainList keyTrigger={refreshKey} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PAGES TAB */}
                {activeTab === 'pages' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-xl font-bold mb-4">
                            📋 Meus LPs e Domínios Minerados
                        </h2>

                        {/* Loading State */}
                        {isLoadingDomains && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass-card p-5 animate-pulse">
                                        <div className="h-6 bg-[var(--color-bg-tertiary)] rounded mb-2" />
                                        <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-3/4 mb-4" />
                                        <div className="h-12 bg-[var(--color-bg-tertiary)] rounded mb-3" />
                                        <div className="flex gap-2">
                                            <div className="h-8 bg-[var(--color-bg-tertiary)] rounded flex-1" />
                                            <div className="h-8 bg-[var(--color-bg-tertiary)] rounded flex-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoadingDomains && filteredAndSortedDomains.length === 0 && domains.length === 0 && (
                            <EmptyState />
                        )}

                        {/* No Results State */}
                        {!isLoadingDomains && filteredAndSortedDomains.length === 0 && domains.length > 0 && (
                            <div className="glass-card p-8 text-center">
                                <p className="text-[var(--color-text-muted)]">
                                    🔍 Nenhum domínio encontrado com os filtros aplicados
                                </p>
                            </div>
                        )}

                        {/* Domains Grid */}
                        {!isLoadingDomains && filteredAndSortedDomains.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAndSortedDomains.map((domain) => (
                                    <DomainCard
                                        key={domain.id}
                                        domain={domain}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onRevalidate={handleRevalidate}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Edit Modal */}
                {editingDomain && (
                    <EditDomainModal
                        domainId={editingDomain.id}
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
