'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Shield, Search, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function NavLogo() {
    return (
        <div className="flex items-center gap-2.5 justify-center">
            <div className="relative">
                <Shield size={36} className="text-white" style={{
                    fill: 'rgba(99,102,241,0.2)',
                    filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.6))',
                    strokeWidth: 1.5,
                }} />
                <div className="absolute -right-1 -bottom-1 bg-[#070711] rounded-full p-0.5 border border-[#070711]">
                    <Search size={13} className="text-blue-400" strokeWidth={2.5} />
                </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Verify<span className="text-blue-500">Ads</span>
            </span>
        </div>
    );
}

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
                    data: { full_name: fullName, role: 'user' },
                },
            });
            if (signUpError) throw signUpError;

            if (data.session) {
                router.push('/minha-area');
            } else if (data.user) {
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
        <div className="min-h-screen text-white flex items-center justify-center p-4"
            style={{ fontFamily: "'Inter', sans-serif", background: 'transparent' }}>

            {/* Aurora Background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: -10, overflow: 'hidden', background: '#070711' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
                <motion.div
                    animate={{ x: [0, 60, -40, 0], y: [0, -50, 60, 0], scale: [1, 1.1, 0.9, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: '-20%', right: '-10%',
                        width: '600px', height: '600px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.50) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, -70, 50, 0], y: [0, 60, -40, 0], scale: [1.05, 0.9, 1.15, 1.05] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: '20%', left: '-10%',
                        width: '500px', height: '500px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
                        filter: 'blur(35px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, 50, -30, 0], y: [0, 40, -60, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', bottom: '-5%', left: '30%',
                        width: '400px', height: '400px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.10) 45%, transparent 70%)',
                        filter: 'blur(38px)',
                    }}
                />
            </div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="mb-8">
                    <NavLogo />
                </div>

                {/* Glass card */}
                <div className="relative rounded-2xl p-8 border border-white/[0.08] overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)' }}>
                    {/* Top glow line */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Conta criada!
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Verifique seu email para ativar sua conta. Após confirmar, faça login para começar.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 30px rgba(59,130,246,0.30)' }}
                            >
                                Ir para Login
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div className="text-center mb-7">
                                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    Criar conta gratuita
                                </h1>
                                <p className="text-gray-500 text-sm">Sem cartão de crédito • Configuração em 3 minutos</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Nome */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all duration-200 border"
                                            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                                            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.20)'}
                                            onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all duration-200 border"
                                            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                                            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.20)'}
                                            onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Senha */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all duration-200 border"
                                                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                                                onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.20)'}
                                                onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirmar</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all duration-200 border"
                                                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                                                onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.20)'}
                                                onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl p-3 text-sm text-red-400 border border-red-500/20"
                                        style={{ background: 'rgba(239,68,68,0.08)' }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        boxShadow: '0 8px 30px rgba(99,102,241,0.30)',
                                    }}
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
                                    ) : 'Criar Minha Conta Grátis'}
                                </button>
                            </form>

                            <p className="text-center text-gray-600 text-sm mt-6">
                                Já tem conta?{' '}
                                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Fazer login
                                </Link>
                            </p>
                        </>
                    )}
                </div>

                <p className="text-center text-gray-700 text-xs mt-6">
                    <Link href="/" className="hover:text-gray-500 transition-colors">← Voltar ao início</Link>
                </p>
            </motion.div>
        </div>
    );
}
