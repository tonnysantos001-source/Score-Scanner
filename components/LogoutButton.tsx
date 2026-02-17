'use client';

// components/LogoutButton.tsx
// Client-side logout button component

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-red-500 transition-all disabled:opacity-50"
        >
            <LogOut className="w-5 h-5" />
            {loading ? 'Saindo...' : 'Sair'}
        </button>
    );
}
