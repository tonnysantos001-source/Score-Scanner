'use client';

// app/admin/subscriptions/page.tsx
// Admin: Subscription Management

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, Users } from 'lucide-react';

interface Subscription {
    id: string;
    user_email: string;
    plan_name: string;
    status: string;
    price_at_period: number;
    current_period_start: string;
    current_period_end: string;
    active_domains: number;
    created_at: string;
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch('/api/admin/subscriptions');
            const data = await res.json();
            setSubscriptions(data.subscriptions || []);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubs = filter === 'all'
        ? subscriptions
        : subscriptions.filter((sub) => sub.status === filter);

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-green-500/10 text-green-500 border-green-500/20',
            unpaid: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            canceled: 'bg-red-500/10 text-red-500 border-red-500/20',
            past_due: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        };
        return colors[status as keyof typeof colors] || colors.unpaid;
    };

    const stats = {
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.status === 'active').length,
        revenue: subscriptions
            .filter((s) => s.status === 'active')
            .reduce((sum, s) => sum + Number(s.price_at_period), 0),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Assinaturas</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie todas as assinaturas ativas
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-[var(--color-text-secondary)]">Total</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.total}</p>
                </div>

                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-[var(--color-text-secondary)]">Ativos</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.active}</p>
                </div>

                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-500" />
                        <p className="text-sm text-[var(--color-text-secondary)]">Receita/mês</p>
                    </div>
                    <p className="text-3xl font-bold">
                        R$ {stats.revenue.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                {['all', 'active', 'unpaid', 'canceled'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === status
                                ? 'bg-blue-500 text-white'
                                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                            }`}
                    >
                        {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Subscriptions Table */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
                        <tr>
                            <th className="text-left px-6 py-4 font-medium text-sm text-[var(--color-text-secondary)]">
                                Usuário
                            </th>
                            <th className="text-left px-6 py-4 font-medium text-sm text-[var(--color-text-secondary)]">
                                Plano
                            </th>
                            <th className="text-left px-6 py-4 font-medium text-sm text-[var(--color-text-secondary)]">
                                Status
                            </th>
                            <th className="text-left px-6 py-4 font-medium text-sm text-[var(--color-text-secondary)]">
                                Domínios
                            </th>
                            <th className="text-left px-6 py-4 font-medium text-sm text-[var(--color-text-secondary)]">
                                Valor
                            </th>
                            <th className="text-left px-6 py-4 font-medium text-sm text-[var(--color-text-secondary)]">
                                Vencimento
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubs.map((sub) => (
                            <tr
                                key={sub.id}
                                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-tertiary)] transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <p className="font-medium">{sub.user_email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium">{sub.plan_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                                            sub.status
                                        )}`}
                                    >
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[var(--color-text-secondary)]">
                                        {sub.active_domains || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium">
                                        R$ {Number(sub.price_at_period).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                        <Calendar className="w-4 h-4" />
                                        {sub.current_period_end
                                            ? new Date(sub.current_period_end).toLocaleDateString('pt-BR')
                                            : '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSubs.length === 0 && (
                    <div className="text-center py-12 text-[var(--color-text-secondary)]">
                        Nenhuma assinatura encontrada
                    </div>
                )}
            </div>
        </div>
    );
}
