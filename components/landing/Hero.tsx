'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Building2, Lock, CheckCircle2 } from 'lucide-react';

interface HeroProps {
    companyName: string;
    razaoSocial?: string;
    description: string;
    cnpj: string;
    municipio?: string;
    uf?: string;
    foundedYear?: number | null;
}

export default function Hero({ companyName, razaoSocial, description, cnpj, municipio, uf, foundedYear }: HeroProps) {
    const yearsActive = foundedYear ? new Date().getFullYear() - foundedYear : null;

    return (
        <section id="hero" className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_70%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Official CNPJ Verified Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-sm"
                >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>CNPJ Oficial {cnpj}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        Situação Cadastral Ativa
                    </span>
                </motion.div>

                {/* Company Name */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight max-w-4xl mx-auto"
                >
                    {companyName}
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
                >
                    {description || `Portal institucional oficial de ${companyName}. Atuação profissional com conformidade jurídica e transparência no mercado.`}
                </motion.p>

                {/* Trust Chips */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-wrap gap-3 justify-center mb-12"
                >
                    {municipio && uf && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium">
                            <Building2 className="w-3.5 h-3.5 text-blue-400" />
                            {municipio} - {uf}
                        </span>
                    )}
                    {yearsActive !== null && yearsActive > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            +{yearsActive} anos de atuação
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Conexão Segura SSL 256-bit
                    </span>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <a
                        href="#servicos"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-full transition-all duration-200 shadow-xl shadow-white/10"
                    >
                        Conhecer Soluções & Serviços
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </a>
                    <a
                        href="#contato"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-full transition-all duration-200"
                    >
                        Entrar em Contato
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
