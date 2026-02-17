'use client';

// components/AdminHeader.tsx
// Fixed header with logout button for admin panel

import { LogOut, Clock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export function AdminHeader() {
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // 30 minutes - production

    const handleLogout = useCallback(async () => {
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

            // Force reload to clear state
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }, []);

    useEffect(() => {
        // Countdown timer
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Auto logout quando expirar
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, [handleLogout]);

    return (
        <div className="fixed top-0 right-0 left-64 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-8 py-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                    Sessão expira em: <span className={`font-medium ${timeLeft <= 1 ? 'text-red-500' : 'text-[var(--color-text-primary)]'}`}>{timeLeft} min</span>
                </span>
            </div>

            <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 font-medium"
            >
                <LogOut className="w-4 h-4" />
                {loading ? 'Saindo...' : 'Sair Agora'}
            </button>
        </div>
    );
}
