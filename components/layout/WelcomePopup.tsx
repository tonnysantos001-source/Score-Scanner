'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, Search, BookOpen, Menu, ArrowRight, X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'verifyads_welcome_seen';

export default function WelcomePopup() {
    const [visible, setVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Só mostra para novos usuários (primeira vez)
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            // Pequeno delay para não aparecer imediatamente
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    const handleGoToManual = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
        router.push('/dashboard/docs');
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                        style={{ background: 'rgba(7,7,17,0.85)', backdropFilter: 'blur(8px)' }}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-md rounded-3xl border overflow-hidden pointer-events-auto"
                            style={{
                                background: 'rgba(15,15,30,0.97)',
                                borderColor: 'rgba(139,92,246,0.30)',
                                boxShadow: '0 0 60px rgba(139,92,246,0.20), 0 0 120px rgba(59,130,246,0.10)',
                            }}
                        >
                            {/* Top glow line */}
                            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

                            {/* Ambient glow balls */}
                            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
                                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-15 blur-3xl pointer-events-none"
                                style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/10 text-gray-500 hover:text-white z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="relative p-8">
                                {/* Logo */}
                                <div className="flex items-center gap-2.5 mb-6">
                                    <div className="relative">
                                        <Shield size={32} className="text-white"
                                            style={{ fill: 'rgba(59,130,246,0.2)', filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.6))', strokeWidth: 1.5 }} />
                                        <div className="absolute -right-1 -bottom-1 bg-[#0f0f1e] rounded-full p-0.5 border border-[#0f0f1e]">
                                            <Search size={11} className="text-purple-400" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                        Verify<span className="text-blue-500">Ads</span>
                                    </span>
                                </div>

                                {/* Sparkle badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 border"
                                    style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.30)' }}>
                                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                    <span className="text-xs font-semibold text-violet-300">Bem-vindo ao VerifyAds!</span>
                                </div>

                                {/* Heading */}
                                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    Antes de começar, confira nosso guia 👋
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                    O VerifyAds é a ferramenta completa para verificar empresas no Facebook Ads. Em menos de 5 minutos você aprende tudo que precisa.
                                </p>

                                {/* Info cards */}
                                <div className="space-y-3 mb-6">
                                    {/* Menu tip */}
                                    <div className="flex items-start gap-3 rounded-xl p-3.5 border"
                                        style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.20)' }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: 'rgba(59,130,246,0.15)' }}>
                                            <Menu className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white mb-0.5">Encontre o menu pelo ícone ☰</p>
                                            <p className="text-xs text-gray-400 leading-relaxed">
                                                No canto superior direito da tela, clique nas <span className="text-blue-400 font-semibold">3 barrinhas</span> (ícone ☰) para abrir o menu lateral com todas as páginas do sistema.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Manual tip */}
                                    <div className="flex items-start gap-3 rounded-xl p-3.5 border"
                                        style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.20)' }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: 'rgba(139,92,246,0.15)' }}>
                                            <BookOpen className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white mb-0.5">Leia o manual antes de usar</p>
                                            <p className="text-xs text-gray-400 leading-relaxed">
                                                O <span className="text-violet-400 font-semibold">Central de Ajuda</span> no menu lateral tem o passo a passo completo: como gerar o PDF, criar sua landing page e verificar no Facebook.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA buttons */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleGoToManual}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
                                        style={{
                                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                                            boxShadow: '0 8px 30px rgba(124,58,237,0.35)',
                                        }}
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Abrir Central de Ajuda
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 rounded-xl text-sm font-semibold text-gray-400 transition-all duration-200 hover:text-white hover:bg-white/05 border border-white/[0.06]"
                                        style={{ background: 'rgba(255,255,255,0.03)' }}
                                    >
                                        Já sei usar — começar a mineração
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
