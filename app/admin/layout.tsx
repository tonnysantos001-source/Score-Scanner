import { requireAdmin } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { AdminNavigation } from '@/components/AdminNavigation';

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

    return (
        <AdminNavigation>
            {children}
        </AdminNavigation>
    );
}
