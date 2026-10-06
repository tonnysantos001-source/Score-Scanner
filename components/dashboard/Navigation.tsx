'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Pickaxe } from 'lucide-react';
import UserMenu from '@/components/layout/UserMenu';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
    title: string;
    description?: string;
}

export default function Navigation({ title, description }: NavigationProps) {
    const { user } = useAuth();
    const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 uppercase tracking-wider">
                            Painel de Controle
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {title}
                        </span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-base max-w-2xl">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/minerar"
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--color-bg-tertiary)]/70 hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm font-semibold text-blue-400 hover:text-white transition-all shadow-sm"
                    >
                        <Pickaxe className="w-4 h-4 text-blue-400" />
                        <span>Minerar CNPJs</span>
                    </Link>
                    <div className="hidden md:block text-right">
                        <p className="text-sm text-[var(--color-text-primary)] font-medium">
                            Olá, {displayName}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {user?.email}
                        </p>
                    </div>
                    <div className="p-1 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg">
                        <UserMenu />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
