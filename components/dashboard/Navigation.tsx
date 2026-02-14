'use client';

import { motion } from 'framer-motion';
import UserMenu from '@/components/layout/UserMenu';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
    title: string;
    description?: string;
}

export default function Navigation({ title, description }: NavigationProps) {
    const { user } = useAuth();
    const displayName = user?.user_metadata?.full_name || user?.email || 'Usuário';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">
                            <span className="text-gradient">{title}</span>
                        </h1>
                        <p className="text-[var(--color-text-muted)] text-sm">
                            Olá, {displayName}!
                        </p>
                    </div>
                </div>
                <UserMenu />
            </div>
            {description && (
                <p className="text-[var(--color-text-muted)] ml-14">
                    {description}
                </p>
            )}
        </motion.div>
    );
}
