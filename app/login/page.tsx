'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    // ... (rest of component unchanged)
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    // ⚠️ DON'T REDIRECT HERE - Let middleware handle routing!
    // Middleware will redirect authenticated users to /admin (if admin) or /minerar (if user)
    // This prevents the flash of /minerar page for admins

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);

            // FASE 5: RBAC CORRETO (Client-side redirect)
            // Aguarda um momento para o AuthContext atualizar
            const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());

            if (session) {
                const role = session.user?.user_metadata?.role;
                console.log('[Login] Login success. Role:', role);

                if (role === 'admin' || role === 'superadmin') {
                    window.location.href = '/admin'; // Force full navigation
                } else {
                    window.location.href = '/minerar';
                }
            } else {
                // Fallback
                window.location.href = '/minerar';
            }
        } catch (err) {
            console.error('[Login] Error:', err);
            const message = err instanceof Error ? err.message : 'Erro ao fazer login';
            setError(message);
        } finally {
            setLoading(false);
        }
    };



    // ...

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Logo size="large" />
                </div>

                <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <p className="text-gray-400 text-sm">
                            Acesse sua conta para gerenciar mineração e verificações
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>



                    <p className="text-center text-gray-400 mt-6">
                        Não tem uma conta?{' '}
                        <Link href="/cadastro" className="text-blue-400 hover:text-blue-300 font-medium">
                            Cadastre-se
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
