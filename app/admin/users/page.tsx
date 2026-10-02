'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Shield, User, Crown, Zap, X, CheckCircle2, Clock,
    AlertTriangle, Ban, Trash2, Calendar, Sparkles, Hourglass, Lock, Unlock
} from 'lucide-react';
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
    is_active: boolean;
    created_at: string;
    approval_status: 'pending' | 'approved' | 'expired' | 'blocked';
    is_expired: boolean;
    is_lifetime: boolean;
    remaining_formatted: string;
    subscription?: {
        id?: string;
        status?: string;
        plan_name?: string;
        plan_id?: string;
        current_period_end?: string;
        metadata?: any;
    };
}

type DurationType = 'hours' | 'days' | 'months' | 'lifetime';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'expired' | 'blocked'>('all');

    // Modal de Liberação de Acesso / Tempo
    const [accessModal, setAccessModal] = useState<{ user: UserData } | null>(null);
    const [durationType, setDurationType] = useState<DurationType>('hours');
    const [durationValue, setDurationValue] = useState<number>(1);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [submittingAccess, setSubmittingAccess] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data as UserData[]);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            toast.error('Erro ao carregar lista de usuários');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Buscar planos cadastrados
    useEffect(() => {
        const fetchPlans = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('plans')
                .select('id, name, price')
                .eq('is_active', true)
                .order('price', { ascending: false });
            if (data && data.length > 0) {
                setPlans(data);
                setSelectedPlanId(data[0].id); // Prioriza Enterprise/Maior plano
            }
        };
        fetchPlans();
    }, []);

    // Atualizar Role
    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) {
                toast.success(`Role alterada para ${newRole.toUpperCase()}`);
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao alterar role');
            }
        } catch {
            toast.error('Erro de conexão ao alterar role');
        }
    };

    // Bloquear / Revogar Acesso
    const handleBlockUser = async (user: UserData) => {
        const confirmed = window.confirm(`Bloquear o acesso de "${user.full_name || user.email}"?`);
        if (!confirmed) return;

        try {
            const res = await fetch('/api/admin/users/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Acesso revogado e usuário bloqueado');
                fetchUsers();
            } else {
                toast.error(data.error || 'Erro ao bloquear');
            }
        } catch {
            toast.error('Erro ao bloquear usuário');
        }
    };

    // Excluir Usuário
    const handleDeleteUser = async (user: UserData) => {
        const confirmed = window.confirm(
            `ATENÇÃO: Excluir definitivamente o usuário "${user.full_name || user.email}"?\n\nEsta ação não poderá ser desfeita.`
        );
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/admin/users?userId=${user.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Usuário excluído com sucesso');
                fetchUsers();
            } else {
                toast.error(data.error || 'Erro ao excluir usuário');
            }
        } catch {
            toast.error('Erro ao excluir usuário');
        }
    };

    // Abrir Modal de Liberação
    const openAccessModal = (user: UserData) => {
        setAccessModal({ user });
        // Se for pendente, padrão de 1 hora de teste
        if (user.approval_status === 'pending') {
            setDurationType('hours');
            setDurationValue(1);
        } else {
            setDurationType('days');
            setDurationValue(30);
        }
        if (plans.length > 0 && !selectedPlanId) {
            setSelectedPlanId(plans[0].id);
        }
    };

    // Enviar Liberação / Alteração de Tempo
    const handleSubmitAccess = async () => {
        if (!accessModal) return;
        setSubmittingAccess(true);

        try {
            const res = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: accessModal.user.id,
                    durationType,
                    durationValue,
                    planId: selectedPlanId,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Acesso liberado com sucesso!');
                setAccessModal(null);
                fetchUsers();
            } else {
                toast.error(data.error || 'Erro ao liberar acesso');
            }
        } catch {
            toast.error('Erro de conexão ao liberar acesso');
        } finally {
            setSubmittingAccess(false);
        }
    };

    // Cálculo em tempo real da prévia de expiração
    const previewExpiresAt = useMemo(() => {
        if (durationType === 'lifetime') {
            return 'Acesso Vitalício (Sem data de término)';
        }
        const now = new Date();
        let targetDate = new Date();

        if (durationType === 'hours') {
            targetDate = new Date(now.getTime() + durationValue * 60 * 60 * 1000);
        } else if (durationType === 'days') {
            targetDate = new Date(now.getTime() + durationValue * 24 * 60 * 60 * 1000);
        } else if (durationType === 'months') {
            targetDate = new Date(now);
            targetDate.setMonth(targetDate.getMonth() + durationValue);
        }

        return targetDate.toLocaleString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [durationType, durationValue]);

    // Filtragem de usuários
    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'all') return true;
        return u.approval_status === statusFilter;
    });

    const pendingCount = users.filter(u => u.approval_status === 'pending').length;

    // Badges de Status
    const renderStatusBadge = (user: UserData) => {
        if (user.role === 'admin' || user.role === 'superadmin') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Shield className="w-3 h-3" /> Admin (Acesso Total)
                </span>
            );
        }

        switch (user.approval_status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Aguardando Aprovação
                    </span>
                );
            case 'approved':
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Acesso Ativo
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                            ⏱️ {user.remaining_formatted}
                        </span>
                    </div>
                );
            case 'expired':
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Expirado
                        </span>
                        <span className="text-[10px] text-red-400/80 font-medium">
                            {user.remaining_formatted}
                        </span>
                    </div>
                );
            case 'blocked':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        <Ban className="w-3 h-3" /> Bloqueado
                    </span>
                );
            default:
                return <span className="text-xs text-gray-500">—</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Modal de Liberação de Acesso e Definição de Tempo */}
            <AnimatePresence>
                {accessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/75 backdrop-blur-md"
                            onClick={() => setAccessModal(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative z-10 bg-[#0d0d1a] border border-white/[0.12] rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Top glow */}
                            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

                            <button
                                onClick={() => setAccessModal(null)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {accessModal.user.approval_status === 'pending'
                                            ? 'Aprovar Cadastro & Liberar Acesso'
                                            : 'Definir Tempo de Acesso'}
                                    </h3>
                                    <p className="text-xs text-gray-400 truncate max-w-xs">
                                        {accessModal.user.full_name || accessModal.user.email} ({accessModal.user.email})
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 mb-6">
                                {/* 1. Tipo de Duração */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                                        1. Unidade de Tempo
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['hours', 'days', 'months', 'lifetime'] as DurationType[]).map(type => {
                                            const labels: Record<DurationType, string> = {
                                                hours: 'Horas',
                                                days: 'Dias',
                                                months: 'Meses',
                                                lifetime: 'Definitivo',
                                            };
                                            const isSelected = durationType === type;
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setDurationType(type);
                                                        if (type === 'hours') setDurationValue(1);
                                                        else if (type === 'days') setDurationValue(7);
                                                        else if (type === 'months') setDurationValue(1);
                                                    }}
                                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40'
                                                        : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                                                        }`}
                                                >
                                                    {labels[type]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Presets e Quantidade */}
                                {durationType !== 'lifetime' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                                            2. Selecionar Duração ({durationType === 'hours' ? 'Horas' : durationType === 'days' ? 'Dias' : 'Meses'})
                                        </label>

                                        {/* Presets rápidos */}
                                        <div className="flex gap-2 mb-3">
                                            {durationType === 'hours' && [1, 2, 4, 12, 24].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setDurationValue(val)}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${durationValue === val
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    {val}h {val === 1 && '(Teste)'}
                                                </button>
                                            ))}

                                            {durationType === 'days' && [1, 3, 7, 15, 30].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setDurationValue(val)}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${durationValue === val
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    {val}d
                                                </button>
                                            ))}

                                            {durationType === 'months' && [1, 2, 3, 6, 12].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setDurationValue(val)}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${durationValue === val
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    {val}m
                                                </button>
                                            ))}
                                        </div>

                                        {/* Campo numérico manual */}
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                min="1"
                                                max={durationType === 'hours' ? 720 : durationType === 'days' ? 365 : 60}
                                                value={durationValue}
                                                onChange={e => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-28 px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-sm outline-none focus:border-blue-500 font-bold text-center"
                                            />
                                            <span className="text-xs text-gray-400">
                                                Digite um valor personalizado em {durationType === 'hours' ? 'horas' : durationType === 'days' ? 'dias' : 'meses'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Plano Associado */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                                        3. Plano de Recursos
                                    </label>
                                    <select
                                        value={selectedPlanId}
                                        onChange={e => setSelectedPlanId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-sm outline-none focus:border-blue-500"
                                    >
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id} className="bg-[#0d0d1a] text-white">
                                                {p.name} — Recursos Totais
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Preview de Expiração */}
                                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Data de Término do Acesso:</span>
                                    </div>
                                    <p className="text-sm font-bold text-white pl-6">
                                        {previewExpiresAt}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAccessModal(null)}
                                    className="flex-1 py-3 border border-white/[0.1] rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/[0.04] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitAccess}
                                    disabled={submittingAccess}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60"
                                >
                                    {submittingAccess ? (
                                        <><Clock className="w-4 h-4 animate-spin" /> Salvando...</>
                                    ) : (
                                        <><CheckCircle2 className="w-4 h-4" /> Confirmar e Liberar Acesso</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        Controle de Clientes & Acessos
                        {pendingCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-black animate-pulse">
                                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Aprove novos cadastros e defina o tempo de uso por horas, dias, meses ou vitalício.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar nome ou email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Filtros de Status */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'all', label: 'Todos', count: users.length },
                    { id: 'pending', label: 'Aguardando Aprovação', count: pendingCount, highlight: pendingCount > 0 },
                    { id: 'approved', label: 'Ativos', count: users.filter(u => u.approval_status === 'approved').length },
                    { id: 'expired', label: 'Expirados', count: users.filter(u => u.approval_status === 'expired').length },
                    { id: 'blocked', label: 'Bloqueados', count: users.filter(u => u.approval_status === 'blocked').length },
                ].map(filter => {
                    const isSelected = statusFilter === filter.id;
                    return (
                        <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id as any)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${isSelected
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/30'
                                : filter.highlight
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                                    : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                                }`}
                        >
                            <span>{filter.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-black/30 text-white' : 'bg-white/[0.06] text-gray-300'}`}>
                                {filter.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-[#0b0b14] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status do Acesso</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plano</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-10 bg-white/[0.04] rounded w-48" /></td>
                                        <td className="p-4"><div className="h-6 bg-white/[0.04] rounded w-36" /></td>
                                        <td className="p-4"><div className="h-6 bg-white/[0.04] rounded w-24" /></td>
                                        <td className="p-4"><div className="h-6 bg-white/[0.04] rounded w-16" /></td>
                                        <td className="p-4"><div className="h-8 bg-white/[0.04] rounded w-32 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500 text-sm">
                                        Nenhum usuário encontrado neste filtro.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isUserAdmin = user.role === 'admin' || user.role === 'superadmin';

                                    return (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* Informações do Usuário */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
                                                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-white">{user.full_name || 'Sem nome informado'}</p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                        <p className="text-[10px] text-gray-600 mt-0.5">
                                                            Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status de Acesso */}
                                            <td className="p-4">
                                                {renderStatusBadge(user)}
                                            </td>

                                            {/* Plano */}
                                            <td className="p-4">
                                                <span className="text-xs text-gray-300 font-medium">
                                                    {user.subscription?.plan_name || (isUserAdmin ? 'Enterprise' : 'Nenhum')}
                                                </span>
                                            </td>

                                            {/* Role */}
                                            <td className="p-4">
                                                {isUserAdmin ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                                        <Shield className="w-3 h-3" /> ADMIN
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded-full">
                                                        <User className="w-3 h-3" /> User
                                                    </span>
                                                )}
                                            </td>

                                            {/* Ações */}
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Botão de Liberação / Alteração de Tempo */}
                                                    {!isUserAdmin && (
                                                        <>
                                                            {user.approval_status === 'pending' ? (
                                                                <button
                                                                    onClick={() => openAccessModal(user)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 rounded-lg shadow-md shadow-yellow-900/30 transition-all hover:scale-105"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Aprovar
                                                                </button>
                                                            ) : user.approval_status === 'expired' ? (
                                                                <button
                                                                    onClick={() => openAccessModal(user)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 rounded-lg transition-all"
                                                                >
                                                                    <RefreshCw className="w-3 h-3" />
                                                                    Renovar
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openAccessModal(user)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-300 bg-white/[0.03] border border-white/[0.1] hover:bg-white/[0.07] rounded-lg transition-all"
                                                                    title="Definir ou alterar tempo de acesso"
                                                                >
                                                                    <Hourglass className="w-3 h-3 text-blue-400" />
                                                                    Tempo
                                                                </button>
                                                            )}

                                                            {/* Bloquear / Desbloquear */}
                                                            {user.approval_status === 'blocked' ? (
                                                                <button
                                                                    onClick={() => openAccessModal(user)}
                                                                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-500/20"
                                                                    title="Desbloquear e liberar acesso"
                                                                >
                                                                    <Unlock className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleBlockUser(user)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                                    title="Bloquear usuário imediatamente"
                                                                >
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Alternar Role */}
                                                    <button
                                                        onClick={() => handleUpdateRole(user.id, isUserAdmin ? 'user' : 'admin')}
                                                        className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors border border-transparent hover:border-yellow-500/20"
                                                        title={isUserAdmin ? 'Remover Admin' : 'Tornar Admin'}
                                                    >
                                                        <Crown className="w-4 h-4" />
                                                    </button>

                                                    {/* Excluir Usuário */}
                                                    {!isUserAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Excluir usuário"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
