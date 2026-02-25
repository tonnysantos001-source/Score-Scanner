'use client';

import { motion } from 'framer-motion';
import { Database, Users, FileText } from 'lucide-react';

export default function Values() {
    const values = [
        {
            icon: <Database className="w-8 h-8 text-blue-600" />,
            title: 'Dados Públicos',
            description: 'As informações exibidas aqui são cadastrais e estão disponíveis publicamente na base de dados do governo federal.',
        },
        {
            icon: <Users className="w-8 h-8 text-blue-600" />,
            title: 'Transparência',
            description: 'Acreditamos no acesso livre a informações públicas. Dados fiscais e cadastrais de pessoas jurídicas são de domínio público.',
        },
        {
            icon: <FileText className="w-8 h-8 text-blue-600" />,
            title: 'Registro Ativo',
            description: 'A empresa possui cadastro ativo no CNPJ e opera dentro das normas estabelecidas pelos órgãos competentes.',
        },
    ];

    return (
        <section id="sobre" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Sobre</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Informações Cadastrais
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
                        Conheça os dados cadastrais desta empresa registrada no Brasil.
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
