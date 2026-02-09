'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/browser-client';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Timeout de inatividade: 15 minutos
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 min em ms

    const handleLogout = useCallback(async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setUser(null);
        }
    }, [supabase]);

    useEffect(() => {
        // Verificar se variáveis de ambiente existem antes de criar cliente
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('Supabase env vars not configured, auth will not work');
            setLoading(false);
            return;
        }

        const client = createClient();
        setSupabase(client);

        // Verificar sessão atual
        client.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Escutar mudanças de autenticação
        const {
            data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

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
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        if (!supabase) throw new Error('Supabase client not initialized');
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
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) throw error;
    };

    const signOut = async () => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
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
