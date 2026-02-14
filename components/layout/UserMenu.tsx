'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, User, LayoutDashboard, Pickaxe, LogOut, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut } = useAuth();
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsOpen(false);
        await signOut();
        router.push('/login');
    };

    if (!user) return null;

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';

    return (
        <div className="relative" ref={menuRef}>
            {/* Botão do Menu */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)]/50 hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] transition-all"
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm text-[var(--color-text-secondary)] font-medium max-w-[120px] truncate">
                    {displayName}
                </span>
                {isOpen ? (
                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                ) : (
                    <Menu className="w-4 h-4 text-[var(--color-text-muted)]" />
                )}
            </button>

            {/* Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Info do Usuário */}
                        <div className="px-4 py-3 border-b border-[var(--color-border)]">
                            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                            <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
                        </div>

                        {/* Links */}
                        <div className="py-1">
                            <Link
                                href="/minerar"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-colors"
                            >
                                <Pickaxe className="w-4 h-4 text-blue-400" />
                                Minerar CNPJs
                            </Link>

                            <Link
                                href="/minha-area"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-colors"
                            >
                                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                                Minha Área
                            </Link>

                            <Link
                                href="/minha-area"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-colors"
                            >
                                <User className="w-4 h-4 text-green-400" />
                                Minha Conta
                            </Link>

                            <Link
                                href="/dashboard/docs"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white transition-colors"
                            >
                                <BookOpen className="w-4 h-4 text-yellow-400" />
                                Manual / Ajuda
                            </Link>
                        </div>

                        {/* Sair */}
                        <div className="border-t border-[var(--color-border)] py-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-600/10 transition-colors w-full text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
