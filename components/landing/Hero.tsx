'use client';

import { motion } from 'framer-motion';
import { FileSearch, ArrowRight, Building2 } from 'lucide-react';

interface HeroProps {
    companyName: string;
    description: string;
    cnpj: string;
    municipio?: string;
    uf?: string;
    foundedYear?: number | null;
}

export default function Hero({ companyName, description, cnpj, municipio, uf, foundedYear }: HeroProps) {
    const yearsActive = foundedYear ? new Date().getFullYear() - foundedYear : null;

    return (
        <section id="hero" className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
            </div>

            {/* Blue accent line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* CNPJ Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-10"
                >
                    <FileSearch size={15} />
                    CNPJ {cnpj} &nbsp;•&nbsp; Dados da Receita Federal
                </motion.div>

                {/* Company Name */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight"
                >
                    {companyName}
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
                >
                    {description || `Conheça a ${companyName}. Informações cadastrais disponíveis publicamente.`}
                </motion.p>

                {/* Meta chips */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-wrap gap-3 justify-center mb-12"
                >
                    {municipio && uf && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-sm">
                            <Building2 size={13} />
                            {municipio} - {uf}
                        </span>
                    )}
                    {yearsActive !== null && yearsActive > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                            +{yearsActive} anos no mercado
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-sm">
                        Cadastro Ativo
                    </span>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <a
                        href="#sobre"
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-900 bg-white rounded-full hover:bg-slate-100 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        Conhecer a Empresa
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
