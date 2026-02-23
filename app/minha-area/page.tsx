'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CompanyCard } from '@/components/dashboard/CompanyCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Globe, Loader2, Server, SearchX, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/dashboard/Navigation';

import DomainWizard from '@/components/domains/DomainWizard';
import DomainList from '@/components/domains/DomainList';

import { useDomainStats } from '@/hooks/useDomains';
import { useCompanies, useDeleteCompany } from '@/hooks/useCompanies';

export default function MinhaAreaPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Tab State
    const [activeTab, setActiveTab] = useState<'empresas' | 'domains'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'domains') return 'domains';
        }
        return 'empresas';
    });

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // React Query hooks
    const { data: stats, isLoading: isLoadingStats } = useDomainStats();
    const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
    const deleteCompany = useDeleteCompany();

    // Route protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);



    const handleDeleteCompany = async (companyId: string) => {
        const company = companies?.find((c) => c.id === companyId);
        if (!company) return;

        const confirmed = window.confirm(
            `Excluir "${company.company_name}"?\n\nA empresa será removida da sua lista.`
        );

        if (!confirmed) return;

        try {
            await deleteCompany.mutateAsync(companyId);
            toast.success('Empresa removida!');
        } catch {
            toast.error('Erro ao excluir empresa');
        }
    };

    // Filter companies by search
    const filteredCompanies = (companies || []).filter((c) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            c.company_name.toLowerCase().includes(search) ||
            c.cnpj.includes(searchTerm) ||
            c.domain?.toLowerCase().includes(search)
        );
    });

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                {/* Aurora background */}
                <div style={{ position: 'fixed', inset: 0, zIndex: -10, overflow: 'hidden', background: '#070711' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    <motion.div animate={{ x: [0, 80, -50, 0], y: [0, -60, 80, 0], scale: [1, 1.15, 0.9, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: '-10%', left: '-5%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(59,130,246,0.20) 35%, transparent 70%)', filter: 'blur(40px)' }} />
                    <motion.div animate={{ x: [0, -90, 50, 0], y: [0, 70, -50, 0], scale: [1.05, 0.9, 1.2, 1.05] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: '5%', right: '-10%', width: '650px', height: '650px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.50) 0%, rgba(139,92,246,0.15) 38%, transparent 70%)', filter: 'blur(35px)' }} />
                </div>
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }


    if (!user) return null;

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20" style={{ background: 'transparent' }}>

            {/* ── Aurora Animated Background ── */}
            <div style={{ position: 'fixed', inset: 0, zIndex: -10, overflow: 'hidden', background: '#070711' }}>
                {/* Dot grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                {/* Blue orb — top-left */}
                <motion.div
                    animate={{ x: [0, 80, -50, 60, 0], y: [0, -60, 80, -30, 0], scale: [1, 1.15, 0.9, 1.08, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '-10%', left: '-5%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(59,130,246,0.20) 35%, transparent 70%)', filter: 'blur(40px)' }}
                />
                {/* Purple orb — mid-right */}
                <motion.div
                    animate={{ x: [0, -90, 50, -60, 0], y: [0, 70, -50, 40, 0], scale: [1.05, 0.9, 1.2, 0.95, 1.05] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '5%', right: '-10%', width: '650px', height: '650px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.50) 0%, rgba(139,92,246,0.15) 38%, transparent 70%)', filter: 'blur(35px)' }}
                />
                {/* Indigo orb — center-bottom */}
                <motion.div
                    animate={{ x: [0, 70, -30, 50, 0], y: [0, 50, -70, 30, 0], scale: [0.95, 1.1, 0.88, 1.05, 0.95] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', bottom: '5%', left: '25%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)', filter: 'blur(38px)' }}
                />
                {/* Cyan orb — bottom-right */}
                <motion.div
                    animate={{ x: [0, -60, 40, -80, 0], y: [0, -40, 60, -50, 0], scale: [1, 1.12, 0.92, 1.06, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', bottom: '-5%', right: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.38) 0%, rgba(6,182,212,0.10) 42%, transparent 70%)', filter: 'blur(30px)' }}
                />
            </div>

            <div className="max-w-7xl mx-auto space-y-8">

                <Navigation
                    title="Minha Área"
                    description="Gerencie suas empresas e domínios verificados"
                />

                {/* Stats Cards */}
                <StatsCards
                    totalDomains={stats?.total_domains || 0}
                    verifiedDomains={stats?.verified_domains || 0}
                    activeLandingPages={stats?.active_landing_pages || 0}
                    createdThisMonth={stats?.created_this_month || 0}
                    isLoading={isLoadingStats}
                />

                {/* Tab Navigation */}
                <div className="space-y-6">
                    <div className="flex justify-center md:justify-start">
                        <div className="bg-[var(--color-bg-tertiary)]/50 p-1 rounded-xl inline-flex border border-[var(--color-border)] relative">
                            <button
                                onClick={() => setActiveTab('empresas')}
                                className={`relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all z-10 flex items-center gap-2 ${activeTab === 'empresas' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                <Building2 className="w-4 h-4" />
                                Minhas Empresas Ativas
                                {activeTab === 'empresas' && (
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
                                    <div className="lg:col-span-1">
                                        <div className="sticky top-8">
                                            <DomainWizard
                                                onSuccess={() => {
                                                    // Refresh server components without losing React state
                                                    router.refresh();
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <Globe className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Domínios Conectados</h3>
                                        </div>
                                        <DomainList />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empresas"
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

                                {/* Search */}
                                {!isLoadingCompanies && (companies?.length || 0) > 0 && (
                                    <div className="mb-6">
                                        <div className="relative">
                                            <SearchX className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Buscar por empresa, CNPJ ou domínio..."
                                                className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-600"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Loading */}
                                {isLoadingCompanies && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="glass-card h-[280px] animate-pulse relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty State */}
                                {!isLoadingCompanies && (companies?.length || 0) === 0 && (
                                    <EmptyState
                                        title="Nenhuma empresa salva"
                                        message="Minere um CNPJ, abra o Dossiê Empresarial e clique em Salvar para adicionar uma empresa aqui."
                                        actionLabel="Ir para Mineração"
                                        onAction={() => router.push('/minerar')}
                                    />
                                )}

                                {/* No Results */}
                                {!isLoadingCompanies && filteredCompanies.length === 0 && (companies?.length || 0) > 0 && (
                                    <div className="glass-card p-12 text-center border-dashed border border-gray-700">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <SearchX className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Nenhum resultado encontrado</h3>
                                        <p className="text-[var(--color-text-muted)]">
                                            Tente ajustar seus termos de busca.
                                        </p>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold"
                                        >
                                            Limpar busca
                                        </button>
                                    </div>
                                )}

                                {/* Companies Grid */}
                                {!isLoadingCompanies && filteredCompanies.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence mode="popLayout">
                                            {filteredCompanies.map((company) => (
                                                <motion.div
                                                    key={company.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <CompanyCard
                                                        company={company}
                                                        onDelete={handleDeleteCompany}
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
            </div>
        </div>
    );
}
