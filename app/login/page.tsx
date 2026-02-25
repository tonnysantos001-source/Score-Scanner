'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, Search, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

function NavLogo() {
    return (
        <div className="flex items-center gap-2.5 justify-center">
            <div className="relative">
                <Shield size={36} className="text-white" style={{
                    fill: 'rgba(59,130,246,0.2)',
                    filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6))',
                    strokeWidth: 1.5,
                }} />
                <div className="absolute -right-1 -bottom-1 bg-[#070711] rounded-full p-0.5 border border-[#070711]">
                    <Search size={13} className="text-purple-400" strokeWidth={2.5} />
                </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Verify<span className="text-blue-500">Ads</span>
            </span>
        </div>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());
            if (session) {
                const role = session.user?.user_metadata?.role;
                if (role === 'admin' || role === 'superadmin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/minerar';
                }
            } else {
                window.location.href = '/minerar';
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login';
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
                        position: 'absolute', top: '-20%', left: '-10%',
                        width: '600px', height: '600px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,0.50) 0%, rgba(59,130,246,0.15) 40%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, -70, 50, 0], y: [0, 60, -40, 0], scale: [1.05, 0.9, 1.15, 1.05] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: '10%', right: '-10%',
                        width: '500px', height: '500px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)',
                        filter: 'blur(35px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, 50, -30, 0], y: [0, 40, -60, 0] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', bottom: '0%', left: '20%',
                        width: '450px', height: '450px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.40) 0%, rgba(99,102,241,0.10) 45%, transparent 70%)',
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
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <div className="text-center mb-7">
                        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Bem-vindo de volta
                        </h1>
                        <p className="text-gray-500 text-sm">Acesse sua conta VerifyAds</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all duration-200 border focus:border-blue-500/60"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        borderColor: 'rgba(255,255,255,0.08)',
                                    }}
                                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'}
                                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all duration-200 border"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        borderColor: 'rgba(255,255,255,0.08)',
                                    }}
                                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'}
                                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                                    placeholder="••••••••"
                                />
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
                            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                boxShadow: '0 8px 30px rgba(59,130,246,0.30)',
                            }}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                            ) : 'Entrar na Minha Conta'}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 text-sm mt-6">
                        Não tem conta?{' '}
                        <Link href="/cadastro" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>

                <p className="text-center text-gray-700 text-xs mt-6">
                    <Link href="/" className="hover:text-gray-500 transition-colors">← Voltar ao início</Link>
                </p>
            </motion.div>
        </div>
    );
}
