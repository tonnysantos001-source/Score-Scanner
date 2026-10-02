'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type ApprovalStatus = 'loading' | 'pending' | 'approved' | 'expired' | 'blocked';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    hasActivePlan: boolean;
    approvalStatus: ApprovalStatus;
    accessExpiresAt: string | null;
    remainingTimeText: string;
    loading: boolean;
    refreshAccessStatus: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasActivePlan, setHasActivePlan] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('loading');
    const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
    const [remainingTimeText, setRemainingTimeText] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Timeout de inatividade: 15 minutos
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 min em ms

    const checkUserRole = useCallback(async (userId: string) => {
        try {
            const res = await fetch('/api/auth/me/status', { cache: 'no-store' });
            if (res.ok) {
                const status = await res.json();
                setIsAdmin(!!status.isAdmin);
                setApprovalStatus(status.approvalStatus || 'pending');
                setAccessExpiresAt(status.accessExpiresAt || null);
                setRemainingTimeText(status.remainingFormatted || (status.isLifetime ? 'Acesso Vitalício' : ''));
                setHasActivePlan(!!status.hasAccess);
                return;
            }
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Check user status error:', err);
            }
        }

        setIsAdmin(false);
        setApprovalStatus('pending');
        setHasActivePlan(false);
    }, []);

    const refreshAccessStatus = useCallback(async () => {
        if (user) {
            await checkUserRole(user.id);
        }
    }, [user, checkUserRole]);

    const handleLogout = useCallback(async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setUser(null);
            setIsAdmin(false);
        }
    }, [supabase]);

    useEffect(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('Supabase env vars not configured');
            setLoading(false);
            return;
        }

        const client = createClient();
        setSupabase(client);

        // Safety Timeout: Força o fim do loading após 5s
        const safetyTimeout = setTimeout(() => {
            setLoading((prev) => {
                if (prev) {
                    console.warn('[AuthContext] Loading timeout reached (5s) - Forcing release');
                    return false;
                }
                return prev;
            });
        }, 5000);

        const initAuth = async () => {
            try {
                const { data: { session }, error } = await client.auth.getSession();
                if (error) console.warn('[AuthContext] Session error:', error.message);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await checkUserRole(session.user.id, client);
                }
            } catch (err) {
                console.error('[AuthContext] Unexpected init error:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const {
            data: { subscription },
        } = client.auth.onAuthStateChange(async (event, session) => {
            try {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setIsAdmin(false);
                    setHasActivePlan(false);
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await checkUserRole(session.user.id);
                    }
                }
            } catch (err) {
                console.error('[AuthContext] Auth change error:', err);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, [checkUserRole]);

    // Timer de inatividade
    useEffect(() => {
        if (!user) return; // Só ativa timer se usuário estiver logado

        let inactivityTimer: NodeJS.Timeout;

        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);

            inactivityTimer = setTimeout(() => {
                console.log('Sessão expirada por inatividade');
                handleLogout();
            }, INACTIVITY_TIMEOUT);
        };

        // Eventos que resetam o timer
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Inicia o timer
        resetTimer();

        // Cleanup
        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user, INACTIVITY_TIMEOUT, handleLogout]);

    const signIn = async (email: string, password: string) => {
        if (!supabase) {
            throw new Error(
                'Configuração do Supabase não encontrada. ' +
                'Verifique se as variáveis de ambiente estão configuradas e recarregue a página.'
            );
        }
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        // Role check handled by onAuthStateChange
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        if (!supabase) {
            throw new Error(
                'Configuração do Supabase não encontrada. ' +
                'Verifique se as variáveis de ambiente estão configuradas e recarregue a página.'
            );
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        if (!supabase) {
            throw new Error(
                'Configuração do Supabase não encontrada. ' +
                'Verifique se as variáveis de ambiente estão configuradas e recarregue a página.'
            );
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) throw error;
    };

    const signOut = async () => {
        if (!supabase) {
            throw new Error(
                'Configuração do Supabase não encontrada. ' +
                'Verifique se as variáveis de ambiente estão configuradas e recarregue a página.'
            );
        }
        const { error } = await supabase.auth.signOut();
        setIsAdmin(false);
        if (error) throw error;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin,
                hasActivePlan,
                approvalStatus,
                accessExpiresAt,
                remainingTimeText,
                loading,
                refreshAccessStatus,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
