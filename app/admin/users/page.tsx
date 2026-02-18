'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Search, MoreVertical, Shield, User, Crown } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    last_sign_in_at: string | null;
    subscription?: {
        plan?: {
            name: string;
        };
        status?: string;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // const [filterRole, setFilterRole] = useState('all'); // Unused for now

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (response.ok) {
                fetchUsers();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Erro ao atualizar role:', message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500">Ativo</span>;
            case 'pending':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500">Pendente</span>;
            case 'canceled':
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500">Cancelado</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">Sem Plano</span>;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Clientes</h1>
                    <p className="text-[var(--color-text-secondary)]">Gerencie os usuários e seus acessos</p>
                </div>
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                            <th className="text-left p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                            <th className="text-left p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Role</th>
                            <th className="text-right p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4"><div className="h-10 bg-[var(--color-bg-tertiary)] rounded w-48" /></td>
                                    <td className="p-4"><div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-24" /></td>
                                    <td className="p-4"><div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-20" /></td>
                                    <td className="p-4"><div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-16" /></td>
                                    <td className="p-4"></td>
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                                                {user.full_name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{user.full_name || 'Sem nome'}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {user.subscription?.plan?.name ? (
                                                <>
                                                    <Crown className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-sm font-medium">{user.subscription.plan.name}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-[var(--color-text-muted)]">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(user.subscription?.status)}
                                    </td>
                                    <td className="p-4">
                                        {user.role === 'admin' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full w-fit">
                                                <Shield className="w-3 h-3" /> ADMIN
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] px-2 py-1 rounded-full">
                                                <User className="w-3 h-3" /> User
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                            className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg transition-colors text-[var(--color-text-secondary)]"
                                            title={user.role === 'admin' ? "Remover Admin" : "Tornar Admin"}
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
