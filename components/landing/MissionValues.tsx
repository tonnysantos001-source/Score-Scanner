'use client';

import { motion } from 'framer-motion';
import { Target, Eye, Heart, Scale, Handshake, Leaf } from 'lucide-react';

interface MissionValuesProps {
    companyName: string;
    segmento?: string;
}

export default function MissionValues({ companyName, segmento }: MissionValuesProps) {
    const pillars = [
        {
            icon: <Target className="w-8 h-8 text-blue-600" />,
            color: 'bg-blue-50 border-blue-100',
            iconBg: 'bg-blue-100',
            title: 'Missão',
            text: `Oferecer soluções de qualidade que atendam às necessidades reais dos nossos clientes e parceiros, com responsabilidade e excelência em cada entrega.`,
        },
        {
            icon: <Eye className="w-8 h-8 text-violet-600" />,
            color: 'bg-violet-50 border-violet-100',
            iconBg: 'bg-violet-100',
            title: 'Visão',
            text: `Ser referência no mercado pela qualidade dos serviços prestados, construindo relações duradouras baseadas em confiança, profissionalismo e inovação contínua.`,
        },
        {
            icon: <Heart className="w-8 h-8 text-rose-500" />,
            color: 'bg-rose-50 border-rose-100',
            iconBg: 'bg-rose-100',
            title: 'Valores',
            text: `Integridade, transparência, respeito às pessoas e compromisso com resultados sustentáveis. Acreditamos que negócios sólidos são construídos com ética e responsabilidade.`,
        },
    ];

    const ethics = [
        {
            icon: <Scale className="w-6 h-6 text-slate-600" />,
            title: 'Ética nos Negócios',
            desc: 'Todas as nossas relações comerciais são pautadas pela legalidade e respeito às partes envolvidas.',
        },
        {
            icon: <Handshake className="w-6 h-6 text-slate-600" />,
            title: 'Compromisso',
            desc: 'Cumprimos o que prometemos e assumimos responsabilidade pelos nossos atos e decisões.',
        },
        {
            icon: <Leaf className="w-6 h-6 text-slate-600" />,
            title: 'Responsabilidade Social',
            desc: 'Buscamos contribuir positivamente para a comunidade e o ambiente em que atuamos.',
        },
    ];

    return (
        <section id="missao" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Identidade Corporativa</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
                        Missão, Visão e Valores
                    </h2>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                        Os princípios que guiam cada decisão e cada relacionamento da {companyName}.
                    </p>
                </div>

                {/* 3 pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {pillars.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.12 }}
                            className={`rounded-2xl border p-8 ${p.color}`}
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${p.iconBg}`}>
                                {p.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{p.text}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Ethics divider */}
                <div className="border-t border-slate-200 pt-16">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold text-slate-900">Nossos Compromissos Éticos</h3>
                        <p className="mt-2 text-slate-500">Base de todas as nossas relações</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {ethics.map((e, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {e.icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">{e.title}</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">{e.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
