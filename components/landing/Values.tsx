'use client';

import { motion } from 'framer-motion';
import { Award, Users, TrendingUp } from 'lucide-react';

export default function Values() {
    const values = [
        {
            icon: <Award className="w-8 h-8 text-blue-600" />,
            title: 'Empresa Verificada',
            description: 'Esta organização passou por processos de validação de dados cadastrais, garantindo sua existência e regularidade.',
        },
        {
            icon: <Users className="w-8 h-8 text-blue-600" />,
            title: 'Transparência Total',
            description: 'Operamos com clareza e honestidade. Todos os nossos dados fiscais e de contato estão disponíveis para consulta pública.',
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
            title: 'Conformidade Legal',
            description: 'Atuamos em estrita observância às leis vigentes e normas regulatórias, assegurando segurança jurídica em nossas relações.',
        },
    ];

    return (
        <section id="sobre" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Nossos Valores</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Por que nos escolher?
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
                        Construímos nossa reputação baseada em pilares sólidos que garantem a segurança e satisfação dos nossos parceiros.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {values.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-slate-50 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300 border border-slate-100"
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
