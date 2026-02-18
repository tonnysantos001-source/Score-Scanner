'use client';

import { createClient } from '@/lib/supabase/client'; // Import client
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { useAuth } from '@/contexts/AuthContext'; // Removed to use direct client for detailed response
import { Loader2 } from 'lucide-react';

export default function CadastroPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: fullName,
                        role: 'user',
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Lógica de Auto-Login / Redirecionamento
            if (data.session) {
                // Se já tem sessão (confirmação desligada), redireciona
                console.log('Sessão criada automaticamente. Redirecionando...');
                router.push('/minha-area'); // Ou /minerar
            } else if (data.user) {
                // Se criou user mas não tem sessão, precisa confirmar email
                setSuccess(true);
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar conta';
            setError(message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Crie sua conta</h1>
                        <p className="text-gray-400">Comece a usar o Score Scanner</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
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
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirmar Senha
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center">
                                <h3 className="text-xl font-bold text-green-400 mb-2">Conta criada com sucesso!</h3>
                                <p className="text-gray-300 mb-4">
                                    Sua conta foi criada. Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada.
                                    Caso contrário, você será redirecionado em instantes.
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                                >
                                    Ir para Login
                                </Link>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Criando conta...
                                    </>
                                ) : (
                                    'Criar Conta'
                                )}
                            </button>
                        )}
                    </form>



                    <p className="text-center text-gray-400 mt-6">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
