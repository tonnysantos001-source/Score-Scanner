'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubs: 0,
        mrr: 0, // Monthly Recurring Revenue
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    // We can use the singleton export here since we just need data fetching
    // But better to be consistent if we had browser-client issue.
    // Let's use standard browser-client just to be safe.
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        // 1. Total Users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 2. Active Subs & MRR
        const { data: subs } = await supabase
            .from('subscriptions')
            .select('price_at_period')
            .eq('status', 'active');

        const mrr = subs?.reduce((acc, sub) => acc + (sub.price_at_period || 0), 0) || 0;

        setStats({
            totalUsers: userCount || 0,
            activeSubs: subs?.length || 0,
            mrr: mrr
        });

        // 3. Recent Users
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        setRecentUsers(users || []);
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                    <Icon className={`w-6 h-6 text-${color}-500`} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-500`}>
                    +0% this month
                </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">{title}</p>
        </motion.div>
    );

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-[var(--color-text-secondary)]">Visão geral do sistema</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Usuários Totais"
                    value={stats.totalUsers}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Assinantes Ativos"
                    value={stats.activeSubs}
                    icon={CreditCard}
                    color="purple"
                />
                <StatCard
                    title="Receita Mensal (MRR)"
                    value={`R$ ${stats.mrr.toFixed(2)}`}
                    icon={DollarSign}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <h3 className="text-lg font-bold mb-6">Novos Usuários</h3>
                    <div className="space-y-4">
                        {recentUsers.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center font-bold text-white">
                                        {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{u.full_name || 'Usuário sem nome'}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Placeholder for Recent Transactions */}
                <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-muted)]">
                    <p>Gráfico de Vendas (Em breve)</p>
                </div>
            </div>
        </div>
    );
}
