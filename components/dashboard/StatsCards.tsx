'use client';

import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, Globe, Zap, ArrowUpRight } from 'lucide-react';

interface StatsCardsProps {
    totalDomains: number;
    verifiedDomains: number;
    activeLandingPages: number;
    createdThisMonth: number;
    isLoading?: boolean;
}

export function StatsCards({
    totalDomains,
    verifiedDomains,
    activeLandingPages,
    createdThisMonth,
    isLoading = false,
}: StatsCardsProps) {
    const stats = [
        {
            id: 'total',
            label: 'Total de Domínios',
            value: totalDomains,
            icon: Globe,
            color: 'blue',
            accent: 'from-blue-500 to-indigo-500',
        },
        {
            id: 'verified',
            label: 'Domínios Verificados',
            value: verifiedDomains,
            icon: CheckCircle2,
            color: 'green',
            accent: 'from-emerald-400 to-green-500',
        },
        {
            id: 'active',
            label: 'Landing Pages Ativas',
            value: activeLandingPages,
            icon: BarChart3,
            color: 'purple',
            accent: 'from-violet-500 to-purple-500',
        },
        {
            id: 'month',
            label: 'Novos este Mês',
            value: createdThisMonth,
            icon: Zap,
            color: 'orange',
            accent: 'from-amber-400 to-orange-500',
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="glass-card p-6 h-32 animate-pulse"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 bg-white/5 rounded-xl" />
                            <div className="h-4 w-16 bg-white/5 rounded" />
                        </div>
                        <div className="h-8 w-12 bg-white/5 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-6 group cursor-default"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.accent} bg-opacity-10 shadow-lg shadow-${stat.color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            {/* Decorative element */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="w-4 h-4 text-gray-500" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                                {stat.value}
                            </h3>
                            <p className="text-sm font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                                {stat.label}
                            </p>
                        </div>

                        {/* Background Glow */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/10 blur-3xl rounded-full group-hover:bg-${stat.color}-500/20 transition-all`} />
                    </motion.div>
                );
            })}
        </div>
    );
}
