'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, ArrowRight } from 'lucide-react';

interface HeroProps {
    companyName: string;
    description: string;
    cnpj: string;
}

export default function Hero({ companyName, description, cnpj }: HeroProps) {
    return (
        <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8"
                >
                    <BadgeCheck size={16} />
                    Empresa Verificada • CNPJ {cnpj}
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6"
                >
                    {companyName}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    {description || `Referência em qualidade e compromisso. Conheça a ${companyName}, uma empresa dedicada a oferecer as melhores soluções com total transparência.`}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <a
                        href="#dados"
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-200 bg-slate-900 rounded-full hover:bg-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                    >
                        Ver Dados Oficiais
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
