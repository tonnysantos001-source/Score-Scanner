'use client';

// components/LogoutButton.tsx
// Client-side logout button with complete session cleanup

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();

            // Clear all cookies
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // Call logout API
            await fetch('/api/auth/logout', { method: 'POST' });

            // Force reload to clear client-side state
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even on error
            window.location.href = '/login';
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
