import { requireAdmin } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    Zap,
    CreditCard,
    Shield,
    Settings
} from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';
import { AdminHeader } from '@/components/AdminHeader';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ✅ Server-side role check (not client-side)
    try {
        await requireAdmin();
    } catch (error) {
        const err = error as Error;
        if (err.message === 'UNAUTHORIZED') {
            redirect('/login?redirect=/admin');
        }
        if (err.message === 'FORBIDDEN') {
            redirect('/');
        }
        redirect('/login');
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Clientes', icon: Users },
        { href: '/admin/subscriptions', label: 'Assinaturas', icon: CreditCard },
        { href: '/admin/plans', label: 'Planos', icon: Zap },
        { href: '/admin/settings', label: 'Configurações', icon: Settings },
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
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                        >
                            <item.icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--color-border)] space-y-3">
                    <LogoutButton />
                    <div className="px-4 py-2 text-xs text-[var(--color-text-muted)] text-center">
                        Admin Panel v1.0.0
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <AdminHeader />
                <div className="pt-20 p-8">
                    {children}
                </div>
            </main>

        </div>
    );
}
