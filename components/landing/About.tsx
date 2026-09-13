'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';

interface AboutProps {
    companyName: string;
    razaoSocial?: string;
    foundedDate: string;
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
    return Math.max(0, now.getFullYear() - founded.getFullYear());
}

function getPorteLabel(porte?: string): string {
    if (!porte) return 'Microempresa (ME)';
    const map: Record<string, string> = {
        'ME': 'Microempresa (ME)',
        'EPP': 'Empresa de Pequeno Porte (EPP)',
        'DEMAIS': 'Médio ou Grande Porte',
        'MICRO EMPRESA': 'Microempresa (ME)',
        'EMPRESA DE PEQUENO PORTE': 'Empresa de Pequeno Porte (EPP)',
    };
    return map[porte.toUpperCase()] || porte;
}

export default function About({
    companyName,
    razaoSocial,
    foundedDate,
    porte,
    naturezaJuridica,
    municipio,
    uf,
    cnpj,
}: AboutProps) {
    const years = calcYearsInMarket(foundedDate);
    const founded = foundedDate ? new Date(foundedDate).getFullYear() : null;

    const stats = [
        {
            icon: <Calendar className="w-6 h-6 text-blue-600" />,
            label: 'Ano de Fundação',
            value: founded ? `${founded}` : 'Ativa',
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
            label: 'Trajetória',
            value: years > 0 ? `+${years} anos de mercado` : 'Em plena operação',
        },
        {
            icon: <Building2 className="w-6 h-6 text-violet-600" />,
            label: 'Porte Empresarial',
            value: getPorteLabel(porte),
        },
        {
            icon: <MapPin className="w-6 h-6 text-rose-500" />,
            label: 'Sede Principal',
            value: municipio && uf ? `${municipio} - ${uf}` : 'Brasil',
        },
    ];

    return (
        <section id="sobre" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    {/* Left — narrative (7 cols) */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-7"
                    >
                        <span className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-widest">
                            Sobre a Instituição
                        </span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                            Solidez, Ética e Compromisso Corporativo
                        </h2>
                        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
                            {founded
                                ? `Fundada em ${founded}, ${companyName} atua com foco constante na qualidade de entrega e na construção de relacionamentos duradouros com clientes e parceiros.`
                                : `${companyName} atua de forma dedicada no mercado brasileiro com alto padrão técnico e foco nas necessidades de seus clientes.`
                            }
                        </p>
                        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                            A empresa opera sob rigorosa conformidade jurídica e fiscal perante a Receita Federal do Brasil, assegurando transparência integral em suas relações contratuais e comerciais.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Registro Cadastral Ativo
                            </div>
                            {naturezaJuridica && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium">
                                    <Building2 className="w-4 h-4 text-slate-500" />
                                    {naturezaJuridica}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Right — stats grid (5 cols) */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-5">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                    {stat.icon}
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                    {stat.value}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
