'use client';

import { motion } from 'framer-motion';
import { Briefcase, CheckCircle2, Award, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface ServicesSectionProps {
    companyName: string;
    cnaeCodigo?: string | number;
    cnaeDescricao?: string;
    cnaesSecundarios?: Array<{ codigo: number | string; descricao: string }>;
}

export default function ServicesSection({
    companyName,
    cnaeCodigo,
    cnaeDescricao,
    cnaesSecundarios,
}: ServicesSectionProps) {
    const validSecondaryCNAEs = (cnaesSecundarios || []).filter(
        c => c.descricao && !c.descricao.toLowerCase().includes('não informad') && c.codigo !== '00.00-0-00'
    );

    const mainActivity = cnaeDescricao || 'Prestação de serviços e atividades comerciais regulares';

    const pillars = [
        {
            icon: <Sparkles className="w-6 h-6 text-blue-600" />,
            title: 'Serviços Especializados',
            description: `Atuação dedicada no segmento de ${mainActivity.toLowerCase()}, priorizando pontualidade, rigor técnico e excelência em cada entrega.`,
        },
        {
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
            title: 'Atendimento Personalizado',
            description: 'Canal de comunicação direto e suporte ágil para elaboração de propostas comerciais, orçamentos e esclarecimento de dúvidas.',
        },
        {
            icon: <Award className="w-6 h-6 text-amber-500" />,
            title: 'Padrão de Qualidade',
            description: 'Processos alinhados às melhores práticas do mercado, garantindo satisfação contínua de clientes e parceiros.',
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-violet-600" />,
            title: 'Segurança & Idoneidade',
            description: 'Operação formalizada com registro ativo na Receita Federal, emissão de notas fiscais e pleno cumprimento regulatório.',
        },
    ];

    return (
        <section id="servicos" className="py-24 bg-slate-50 border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-widest">
                        Soluções & Atividades Comerciais
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                        Atuação e Compromisso de {companyName}
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600">
                        Estrutura profissional voltada a entregar resultados de alto valor, com transparência e foco nas necessidades de cada cliente.
                    </p>
                </div>

                {/* Main Activity Highlight Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-blue-100 mb-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                                <Briefcase className="w-7 h-7" />
                            </div>
                            <div>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                                    Atividade Econômica Principal
                                </span>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    {mainActivity}
                                </h3>
                                {cnaeCodigo && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Classificação Nacional de Atividades Econômicas (CNAE: {cnaeCodigo})
                                    </p>
                                )}
                            </div>
                        </div>

                        <a
                            href="#contato"
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3.5 rounded-full transition-all duration-200 shadow-md flex-shrink-0"
                        >
                            Falar com a Equipe
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Secondary CNAEs if present */}
                    {validSecondaryCNAEs.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                Atividades Complementares
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {validSecondaryCNAEs.slice(0, 4).map((sec, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs bg-slate-50 border border-slate-200/80 text-slate-700 px-3 py-1.5 rounded-lg"
                                    >
                                        {sec.descricao}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                                    {pillar.icon}
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">
                                    {pillar.title}
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {pillar.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
