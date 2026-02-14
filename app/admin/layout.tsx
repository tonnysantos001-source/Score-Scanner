'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser-client';
import { Link } from 'next-view-transitions'; // Using view-transitions if avail, else next/link
import {
    LayoutDashboard,
    Users,
    Zap,
    LogOut,
    CreditCard,
    Loader2,
    Settings,
    Shield
} from 'lucide-react';
// Fallback to next/link if next-view-transitions not installed/configured properly
import NextLink from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading: authLoading, signOut } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role === 'admin') {
                setIsAdmin(true);
            } else {
                router.push('/'); // Redirect unauthorized
            }
        };

        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else {
                checkAdmin();
            }
        }
    }, [user, authLoading, router, supabase]);

    if (authLoading || isAdmin === null) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Clientes', icon: Users },
        { href: '/admin/subscriptions', label: 'Assinaturas', icon: CreditCard },
        { href: '/admin/plans', label: 'Planos', icon: Zap },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans flex">

            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col fixed h-full z-10 left-0 top-0">
                <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Admin <span className="text-red-500">Panel</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <NextLink
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                        ? 'bg-red-500/10 text-red-500'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`} />
                                {item.label}
                            </NextLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--color-border)]">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-all mb-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Voltar ao Site
                    </button>
                    <div className="px-4 py-2 text-xs text-[var(--color-text-muted)] text-center">
                        v1.0.0 Alpha
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>

        </div>
    );
}
