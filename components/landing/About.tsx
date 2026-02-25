'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface AboutProps {
    companyName: string;
    foundedDate: string;   // data_inicio_atividade raw string
    porte?: string;
    naturezaJuridica?: string;
    municipio?: string;
    uf?: string;
    cnpj: string;
}

function calcYearsInMarket(dateStr: string): number {
    if (!dateStr) return 0;
    const founded = new Date(dateStr);
    const now = new Date();
    return now.getFullYear() - founded.getFullYear();
}

function getPorteLabel(porte?: string): string {
    if (!porte) return 'Empresa';
    const map: Record<string, string> = {
        'ME': 'Microempresa (ME)',
        'EPP': 'Empresa de Pequeno Porte (EPP)',
        'DEMAIS': 'Médio ou Grande Porte',
    };
    return map[porte] || porte;
}

export default function About({ companyName, foundedDate, porte, naturezaJuridica, municipio, uf, cnpj }: AboutProps) {
    const years = calcYearsInMarket(foundedDate);
    const founded = foundedDate ? new Date(foundedDate).getFullYear() : null;

    const stats = [
        {
            icon: <Calendar className="w-6 h-6 text-blue-600" />,
            label: 'Fundação',
            value: founded ? `${founded}` : 'Não informado',
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
            label: 'Anos de Mercado',
            value: years > 0 ? `+${years} anos` : 'Recente',
        },
        {
            icon: <Building2 className="w-6 h-6 text-violet-600" />,
            label: 'Porte',
            value: getPorteLabel(porte),
        },
        {
            icon: <MapPin className="w-6 h-6 text-rose-500" />,
            label: 'Sede',
            value: municipio && uf ? `${municipio} - ${uf}` : 'Brasil',
        },
    ];

    return (
        <section id="sobre" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left — text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Sobre a Empresa</span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 leading-snug">
                            {companyName}
                        </h2>
                        <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                            {founded
                                ? `Fundada em ${founded}, a ${companyName} acumula ${years > 0 ? `mais de ${years} anos` : 'experiência'} de atuação no mercado brasileiro. Com registro ativo junto à Receita Federal e compromisso com a transparência, a empresa opera em conformidade com todas as exigências legais vigentes.`
                                : `A ${companyName} é uma empresa com registro ativo na Receita Federal, comprometida com a transparência e a conformidade legal no mercado brasileiro.`
                            }
                        </p>
                        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                            Seus dados cadastrais estão disponíveis publicamente e refletem a situação atual junto aos órgãos competentes, garantindo segurança nas relações comerciais.
                        </p>
                        {naturezaJuridica && (
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 font-medium">
                                <Building2 className="w-4 h-4" />
                                {naturezaJuridica}
                            </div>
                        )}
                    </motion.div>

                    {/* Right — stats grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                                    {stat.icon}
                                </div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
