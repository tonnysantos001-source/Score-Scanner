'use client';

import { motion } from 'framer-motion';
import { Flag, TrendingUp, Star, CheckCircle2 } from 'lucide-react';

interface TimelineProps {
    foundedDate: string; // raw date string from BrasilAPI
    companyName: string;
}

interface TimelineEvent {
    year: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    highlight?: boolean;
}

function buildTimeline(foundedDate: string, companyName: string): TimelineEvent[] {
    const founded = foundedDate ? new Date(foundedDate).getFullYear() : null;
    const now = new Date().getFullYear();

    if (!founded) {
        return [
            {
                year: now,
                icon: <CheckCircle2 className="w-5 h-5" />,
                title: 'Ativa e em Operação',
                description: 'A empresa encontra-se ativa e regularizada junto à Receita Federal.',
                highlight: true,
            },
        ];
    }

    const events: TimelineEvent[] = [];
    const yearsActive = now - founded;

    // Founding
    events.push({
        year: founded,
        icon: <Flag className="w-5 h-5" />,
        title: 'Fundação da Empresa',
        description: `A ${companyName} iniciou suas atividades e obteve seu registro no CNPJ junto à Receita Federal.`,
    });

    // Decade milestones
    const decadeStart = Math.ceil(founded / 10) * 10;
    for (let decade = decadeStart; decade < now; decade += 10) {
        if (decade - founded >= 5) {
            events.push({
                year: decade,
                icon: <TrendingUp className="w-5 h-5" />,
                title: `${decade - founded} anos de Mercado`,
                description: `Consolidando sua presença no mercado com crescimento contínuo e novos parceiros.`,
            });
        }
    }

    // Milestone at 10 years (if applicable and not already included)
    if (yearsActive >= 10 && !events.find(e => e.year === founded + 10)) {
        const tenYearMark = founded + 10;
        if (tenYearMark < now) {
            events.splice(1, 0, {
                year: tenYearMark,
                icon: <Star className="w-5 h-5" />,
                title: '10 anos de Excelência',
                description: 'Uma década de compromisso, fidelização de clientes e aprimoramento contínuo.',
            });
        }
    }

    // Current year: always active
    events.push({
        year: now,
        icon: <CheckCircle2 className="w-5 h-5" />,
        title: 'Ativa e em Operação',
        description: 'A empresa segue referência em seu segmento, com cadastro regularizado e em plena atividade.',
        highlight: true,
    });

    // Sort chronologically and deduplicate
    return events
        .sort((a, b) => a.year - b.year)
        .filter((e, i, arr) => arr.findIndex(x => x.year === e.year) === i);
}

export default function Timeline({ foundedDate, companyName }: TimelineProps) {
    const events = buildTimeline(foundedDate, companyName);

    return (
        <section id="historia" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Trajetória</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
                        Nossa História
                    </h2>
                    <p className="mt-4 text-lg text-slate-500">
                        Os marcos que definiram o caminho da {companyName}.
                    </p>
                </div>

                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />

                    <div className="space-y-10">
                        {events.map((event, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="relative flex gap-6 sm:gap-10"
                            >
                                {/* Icon circle */}
                                <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-md ${event.highlight
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border-2 border-slate-200 text-slate-500'
                                    }`}>
                                    {event.icon}
                                </div>

                                {/* Content */}
                                <div className={`flex-1 pb-2 pt-3 px-6 rounded-2xl border transition-shadow hover:shadow-md ${event.highlight
                                        ? 'bg-blue-50 border-blue-100'
                                        : 'bg-slate-50 border-slate-100'
                                    }`}>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${event.highlight ? 'text-blue-500' : 'text-slate-400'
                                        }`}>{event.year}</span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">{event.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{event.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
