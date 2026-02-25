'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

interface ContactSectionProps {
    companyName: string;
    address: string;
    municipio?: string;
    uf?: string;
    cep?: string;
    telefone?: string;
    email?: string;
}

export default function ContactSection({
    companyName,
    address,
    municipio,
    uf,
    cep,
    telefone,
    email,
}: ContactSectionProps) {
    const mapsQuery = encodeURIComponent(`${address}, ${municipio} - ${uf}, ${cep}, Brasil`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    const contactItems = [
        {
            icon: <MapPin className="w-6 h-6 text-blue-600" />,
            label: 'Endereço Registrado',
            value: address,
            link: mapsUrl,
            linkLabel: 'Ver no Mapa',
        },
        ...(telefone ? [{
            icon: <Phone className="w-6 h-6 text-emerald-600" />,
            label: 'Telefone',
            value: telefone,
            link: `tel:${telefone.replace(/\D/g, '')}`,
            linkLabel: 'Ligar',
        }] : []),
        ...(email ? [{
            icon: <Mail className="w-6 h-6 text-violet-600" />,
            label: 'E-mail',
            value: email,
            link: `mailto:${email}`,
            linkLabel: 'Enviar e-mail',
        }] : []),
    ];

    return (
        <section id="contato" className="py-24 bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-sm font-semibold text-blue-400 uppercase tracking-widest">Localização e Contato</span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white leading-snug">
                            Entre em Contato
                        </h2>
                        <p className="mt-5 text-lg text-slate-400 leading-relaxed">
                            As informações de contato da {companyName} estão disponíveis abaixo.
                            Todos os dados são referentes ao endereço registrado junto à Receita Federal.
                        </p>

                        <div className="mt-10 space-y-6">
                            {contactItems.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                                        <p className="text-slate-200 font-medium">{item.value}</p>
                                        {item.link && (
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                                            >
                                                {item.linkLabel}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — map embed placeholder */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="rounded-3xl overflow-hidden border border-slate-700 shadow-2xl aspect-[4/3]"
                    >
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full group">
                            <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-4 group-hover:bg-slate-700 transition-colors">
                                <div className="w-16 h-16 bg-slate-700 group-hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors">
                                    <MapPin className="w-8 h-8 text-blue-400" />
                                </div>
                                <div className="text-center px-6">
                                    <p className="text-white font-semibold text-lg">{municipio} - {uf}</p>
                                    <p className="text-slate-400 text-sm mt-1">{cep ? `CEP: ${cep}` : ''}</p>
                                    <p className="text-blue-400 text-sm mt-3 font-medium flex items-center justify-center gap-1">
                                        Abrir no Google Maps
                                        <ExternalLink className="w-4 h-4" />
                                    </p>
                                </div>
                            </div>
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
