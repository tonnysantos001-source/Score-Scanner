'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    hasActivePlan: boolean;
    loading: boolean;
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
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Timeout de inatividade: 15 minutos
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 min em ms

    const checkUserRole = useCallback(async (userId: string, client?: any) => {
        try {
            const supabaseClient = client || createClient();
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Erro ao buscar role:', error.message);
                }
                setIsAdmin(false);
                setHasActivePlan(true);
                return;
            }

            const isAdminUser = profile?.role === 'admin' || profile?.role === 'superadmin';
            setIsAdmin(isAdminUser);

            // Planos totalmente liberados para uso
            setHasActivePlan(true);
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Check role error:', err);
            }
            setIsAdmin(false);
            setHasActivePlan(true);
        }
    }, []);

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
                loading,
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
