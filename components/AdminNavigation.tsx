'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Zap,
    CreditCard,
    Shield,
    Settings,
    Menu,
    X,
    LogOut,
    Clock
} from 'lucide-react';
import { LogoutButton } from './LogoutButton';

interface AdminNavigationProps {
    children: React.ReactNode;
}

export function AdminNavigation({ children }: AdminNavigationProps) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // 30 minutes

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Clientes', icon: Users },
        { href: '/admin/subscriptions', label: 'Assinaturas', icon: CreditCard },
        { href: '/admin/plans', label: 'Planos', icon: Zap },
        { href: '/admin/settings', label: 'Configurações', icon: Settings },
    ];

    const handleLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            localStorage.clear();
            sessionStorage.clear();

            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, [handleLogout]);

    // Close mobile sidebar when changing page
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans flex">
            
            {/* Backdrop overlay (mobile only) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col fixed h-full z-50 left-0 top-0 transition-transform duration-300 md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            Admin <span className="text-red-500">Panel</span>
                        </span>
                    </div>
                    {/* Close button for mobile */}
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                                    isActive 
                                        ? 'bg-red-500/10 text-red-500' 
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--color-border)] space-y-3">
                    <LogoutButton />
                    <div className="px-4 py-2 text-xs text-[var(--color-text-muted)] text-center">
                        Admin Panel v1.0.0
                    </div>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 min-w-0 w-full">
                
                {/* Header */}
                <header className="fixed top-0 right-0 left-0 md:left-64 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-4 md:px-8 py-4 flex items-center justify-between z-30 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        {/* Hamburger menu button for mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-text-secondary)]">
                            <Clock className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                            <span>
                                Sessão: <span className={`font-semibold ${timeLeft <= 2 ? 'text-red-500 animate-pulse' : 'text-[var(--color-text-primary)]'}`}>{timeLeft} min</span>
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 text-xs md:text-sm font-semibold"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                    </button>
                </header>

                {/* Content Area */}
                <main className="flex-1 pt-20 p-4 md:p-8 overflow-x-hidden w-full max-w-full">
                    {children}
                </main>
            </div>

        </div>
    );
}
