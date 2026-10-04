'use client';

import { useState, useEffect } from 'react';
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

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    // Detectar erro da URL (?error=blocked)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('error') === 'blocked') {
                setError('Acesso bloqueado: Logins de usuários foram desativados pelo administrador.');
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);

            try {
                const res = await fetch('/api/auth/me/status', { cache: 'no-store' });
                if (res.ok) {
                    const statusData = await res.json();
                    if (statusData.isAdmin) {
                        window.location.href = '/admin';
                        return;
                    }
                }
            } catch {
                // Fallback
            }

            setError('Acesso bloqueado: Logins de usuários desativados pelo administrador. Apenas administradores têm permissão.');
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
                            <div className="rounded-xl p-3.5 text-sm text-red-400 border border-red-500/20 space-y-3"
                                style={{ background: 'rgba(239,68,68,0.08)' }}>
                                <p className="leading-snug">{error}</p>
                                <a
                                    href="https://wa.me/5521990829242?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20sobre%20o%20acesso%20ao%20VerifyAds."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all hover:scale-[1.01]"
                                >
                                    <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                                    <span>Falar no WhatsApp: (21) 99082-9242</span>
                                </a>
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

                    {/* Contato WhatsApp */}
                    <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
                        <p className="text-xs text-gray-400 mb-2.5">
                            Dúvidas ou solicitação de acesso? Fale comigo:
                        </p>
                        <a
                            href="https://wa.me/5521990829242?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20sobre%20o%20acesso%20ao%20VerifyAds."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-[1.01] shadow-lg shadow-emerald-500/10"
                        >
                            <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                            <span>WhatsApp: (21) 99082-9242</span>
                        </a>
                    </div>

                    <p className="text-center text-gray-600 text-sm mt-5">
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
