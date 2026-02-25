'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User, Crown, Zap, X, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Plan {
    id: string;
    name: string;
    price: number;
}

interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    subscription?: {
        status?: string;
        plan_name?: string;
        trial_ends_at?: string;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [trialModal, setTrialModal] = useState<{ user: UserData } | null>(null);
    const [trialPlanId, setTrialPlanId] = useState('');
    const [trialDays, setTrialDays] = useState(7);
    const [grantingTrial, setGrantingTrial] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                // Enrich with subscription info
                const supabase = createClient();
                const enriched = await Promise.all(
                    (data as UserData[]).map(async (u) => {
                        const { data: sub } = await supabase
                            .from('subscriptions')
                            .select('status, trial_ends_at, plans(name)')
                            .eq('user_id', u.id)
                            .in('status', ['active', 'trialing', 'unpaid'])
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();
                        return {
                            ...u,
                            subscription: sub ? {
                                status: sub.status,
                                plan_name: (sub.plans as { name: string })?.name,
                                trial_ends_at: sub.trial_ends_at,
                            } : undefined,
                        };
                    })
                );
                setUsers(enriched);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        const fetchPlans = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('plans')
                .select('id, name, price')
                .eq('is_active', true)
                .order('price');
            if (data) {
                setPlans(data);
                setTrialPlanId(data[0]?.id || '');
            }
        };
        fetchPlans();
    }, []);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: newRole }),
        });
        if (res.ok) { fetchUsers(); toast.success('Role atualizada'); }
        else toast.error('Erro ao atualizar role');
    };

    const handleGrantTrial = async () => {
        if (!trialModal || !trialPlanId) return;
        setGrantingTrial(true);
        try {
            const res = await fetch('/api/admin/users/grant-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: trialModal.user.id, planId: trialPlanId, trialDays }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Trial ativado!');
                setTrialModal(null);
                fetchUsers();
            } else {
                toast.error(data.error || 'Erro ao ativar trial');
            }
        } finally {
            setGrantingTrial(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSubBadge = (sub?: UserData['subscription']) => {
        if (!sub?.status) return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
        const map: Record<string, string> = {
            active: 'bg-green-500/10 text-green-400 border-green-500/20',
            trialing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            unpaid: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        };
        const labels: Record<string, string> = { active: 'Ativo', trialing: 'Trial', unpaid: 'Pendente' };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${map[sub.status] || ''}`}>
                {sub.plan_name} · {labels[sub.status] || sub.status}
            </span>
        );
    };

    return (
        <div>
            {/* Grant Trial Modal */}
            <AnimatePresence>
                {trialModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setTrialModal(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <button onClick={() => setTrialModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Liberar Trial</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">{trialModal.user.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Plano</label>
                                    <select
                                        value={trialPlanId}
                                        onChange={e => setTrialPlanId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} — R$ {p.price}/mês</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Duração (dias)</label>
                                    <div className="flex gap-2">
                                        {[3, 7, 14, 30].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setTrialDays(d)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${trialDays === d
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'border-[var(--color-border)] hover:border-blue-500/50'
                                                    }`}
                                            >
                                                {d}d
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTrialModal(null)}
                                    className="flex-1 py-2.5 border border-[var(--color-border)] rounded-xl text-sm hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGrantTrial}
                                    disabled={grantingTrial}
                                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                >
                                    {grantingTrial ? <><Clock className="w-4 h-4 animate-spin" />Ativando...</> : <><CheckCircle2 className="w-4 h-4" />Ativar Trial</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Clientes</h1>
                    <p className="text-[var(--color-text-secondary)]">Gerencie usuários, roles e planos</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/50 outline-none w-64"
                    />
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--color-bg-tertiary)]">
                        <tr>
                            <th className="text-left p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Usuário</th>
                            <th className="text-left p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Plano</th>
                            <th className="text-left p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Role</th>
                            <th className="text-right p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4"><div className="h-10 bg-[var(--color-bg-tertiary)] rounded w-48" /></td>
                                    <td className="p-4"><div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-28" /></td>
                                    <td className="p-4"><div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-16" /></td>
                                    <td className="p-4"><div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-20 ml-auto" /></td>
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-[var(--color-text-muted)]">Nenhum usuário encontrado.</td>
                            </tr>
                        ) : filteredUsers.map(user => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
                            >
                                {/* Usuário */}
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                                            {user.full_name?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{user.full_name || 'Sem nome'}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Plano */}
                                <td className="p-4">{getSubBadge(user.subscription)}</td>

                                {/* Role */}
                                <td className="p-4">
                                    {user.role === 'admin' ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full w-fit">
                                            <Shield className="w-3 h-3" /> ADMIN
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] px-2 py-1 rounded-full w-fit">
                                            <User className="w-3 h-3" /> User
                                        </span>
                                    )}
                                </td>

                                {/* Ações */}
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Grant Trial */}
                                        <button
                                            onClick={() => setTrialModal({ user })}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-lg hover:bg-purple-400/20 transition-colors"
                                        >
                                            <Zap className="w-3 h-3" />
                                            Trial
                                        </button>
                                        {/* Toggle Role */}
                                        <button
                                            onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
                                            title={user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                        >
                                            <Crown className="w-3 h-3" />
                                            {user.role === 'admin' ? '→ User' : '→ Admin'}
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
