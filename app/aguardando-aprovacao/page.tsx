'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, Shield, Search, RefreshCw, LogOut, CheckCircle2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

export default function AguardandoAprovacaoPage() {
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
                    toast.success('Você é administrador!');
                    router.push('/admin');
                    return;
                }
                if (data.approvalStatus === 'approved') {
                    toast.success('Seu acesso foi aprovado!', {
                        description: data.isLifetime ? 'Acesso ilimitado concedido.' : `Acesso liberado até ${data.accessExpiresAtFormatted || 'o período concedido'}.`
                    });
                    router.push('/minerar');
                    return;
                } else if (data.approvalStatus === 'blocked') {
                    toast.error('Conta desativada ou recusada pelo administrador.');
                } else {
                    toast.info('Sua conta ainda está aguardando aprovação pelo administrador.', {
                        description: 'Por favor, aguarde alguns instantes ou entre em contato.'
                    });
                }
            } else {
                toast.info('Sua conta ainda aguarda liberação.');
            }
        } catch (error) {
            toast.error('Erro ao verificar status. Tente novamente.');
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
                        background: 'radial-gradient(circle, rgba(234,179,8,0.40) 0%, rgba(234,179,8,0.10) 40%, transparent 70%)',
                        filter: 'blur(45px)',
                    }}
                />
                <motion.div
                    animate={{ x: [0, -70, 50, 0], y: [0, 60, -40, 0], scale: [1.05, 0.9, 1.15, 1.05] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: '10%', right: '-10%',
                        width: '500px', height: '500px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
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

                    {/* Top glow line - yellow/gold */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />

                    {/* Animated Clock / Status Icon */}
                    <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-500/40"
                        />
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Aguardando Aprovação
                    </h1>

                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Seu cadastro foi realizado com sucesso! Sua conta está em análise e precisa ser <strong className="text-white">aprovada pelo administrador</strong> antes de liberar o acesso às ferramentas.
                    </p>

                    {user?.email && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6 text-xs text-gray-400 flex items-center justify-center gap-2">
                            <span>Conta:</span>
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
                            {checking ? 'Verificando status...' : 'Verificar se já fui aprovado'}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair da conta
                        </button>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                        <p className="text-xs text-gray-400 mb-2">
                            Quer agilizar sua liberação? Fale com o administrador:
                        </p>
                        <a
                            href="https://wa.me/5521990829242?text=Ol%C3%A1%2C%20fiz%20meu%20cadastro%20e%20estou%20aguardando%20aprova%C3%A7%C3%A3o."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-[1.01]"
                        >
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                            <span>WhatsApp: (21) 99082-9242</span>
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
