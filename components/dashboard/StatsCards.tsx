'use client';

import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, Globe, Zap } from 'lucide-react';

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
            gradient: 'from-blue-600 to-blue-500',
            bgGradient: 'from-blue-600/10 to-blue-500/10',
        },
        {
            id: 'verified',
            label: 'Verificados',
            value: verifiedDomains,
            icon: CheckCircle2,
            gradient: 'from-green-600 to-green-500',
            bgGradient: 'from-green-600/10 to-green-500/10',
        },
        {
            id: 'active',
            label: 'Landing Pages Ativas',
            value: activeLandingPages,
            icon: BarChart3,
            gradient: 'from-purple-600 to-purple-500',
            bgGradient: 'from-purple-600/10 to-purple-500/10',
        },
        {
            id: 'month',
            label: 'Criados Este Mês',
            value: createdThisMonth,
            icon: Zap,
            gradient: 'from-orange-600 to-orange-500',
            bgGradient: 'from-orange-600/10 to-orange-500/10',
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="glass-card p-6 animate-pulse"
                    >
                        <div className="h-12 w-12 bg-[var(--color-bg-tertiary)] rounded-lg mb-3" />
                        <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-24 mb-2" />
                        <div className="h-8 bg-[var(--color-bg-tertiary)] rounded w-16" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-6 hover:shadow-lg transition-shadow"
                    >
                        {/* Icon */}
                        <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center mb-3`}
                        >
                            <Icon className={`w-6 h-6 ${stat.gradient.split(' ')[0].replace('from-', 'text-')}`} />
                        </div>

                        {/* Label */}
                        <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">
                            {stat.label}
                        </p>

                        {/* Value */}
                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                            {stat.value}
                        </p>
                    </motion.div>
                );
            })}
        </div>
    );
}
