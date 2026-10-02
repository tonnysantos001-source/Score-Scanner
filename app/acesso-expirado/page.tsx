'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Search, RefreshCw, LogOut, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

function NavLogo() {
    return (
        <div className="flex items-center gap-2.5 justify-center">
            <div className="relative">
                <Shield size={36} className="text-white" style={{
                    fill: 'rgba(239,68,68,0.2)',
                    filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.6))',
                    strokeWidth: 1.5,
                }} />
                <div className="absolute -right-1 -bottom-1 bg-[#070711] rounded-full p-0.5 border border-[#070711]">
                    <Search size={13} className="text-red-400" strokeWidth={2.5} />
                </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Verify<span className="text-blue-500">Ads</span>
            </span>
        </div>
    );
}

export default function AcessoExpiradoPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [checking, setChecking] = useState(false);

    const handleCheckStatus = async () => {
        setChecking(true);
        try {
            const res = await fetch('/api/auth/me/status', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.isAdmin) {
                    router.push('/admin');
                    return;
                }
                if (data.approvalStatus === 'approved') {
                    toast.success('Seu acesso foi renovado!', {
                        description: data.isLifetime ? 'Acesso ilimitado concedido.' : `Válido até ${data.accessExpiresAtFormatted}.`
                    });
                    router.push('/minerar');
                    return;
                } else {
                    toast.error('Seu acesso continua expirado.', {
                        description: 'Entre em contato com o administrador para renovar.'
                    });
                }
            } else {
                toast.error('Acesso ainda não renovado.');
            }
        } catch {
            toast.error('Erro ao verificar status.');
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch {
            router.push('/login');
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
                        position: 'absolute', top: '-15%', left: '-10%',
                        width: '600px', height: '600px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(239,68,68,0.40) 0%, rgba(239,68,68,0.10) 40%, transparent 70%)',
                        filter: 'blur(45px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, -70, 50, 0], y: [0, 60, -40, 0], scale: [1.05, 0.9, 1.15, 1.05] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: '10%', right: '-10%',
                        width: '500px', height: '500px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0.10) 40%, transparent 70%)',
                        filter: 'blur(35px)',
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
                <div className="relative rounded-2xl p-8 border border-white/[0.08] overflow-hidden text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)' }}>

                    {/* Top glow line - red */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

                    {/* Animated Alert Icon */}
                    <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Período de Acesso Expirado
                    </h1>

                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        O tempo de uso ou teste liberado para a sua conta terminou. Para continuar utilizando as ferramentas de mineração e gestão de domínios, solicite uma nova liberação ao administrador.
                    </p>

                    {user?.email && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6 text-xs text-gray-400 flex items-center justify-center gap-2">
                            <span>Usuário:</span>
                            <span className="text-white font-medium">{user.email}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleCheckStatus}
                            disabled={checking}
                            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                boxShadow: '0 8px 30px rgba(59,130,246,0.30)',
                            }}
                        >
                            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                            {checking ? 'Verificando renovação...' : 'Verificar se fui renovado'}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair da conta
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/[0.06] text-xs text-gray-500 flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Fale diretamente com o administrador para reativar seu acesso.</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
