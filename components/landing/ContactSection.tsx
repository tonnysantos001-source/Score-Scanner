'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, ExternalLink, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

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
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        emailInput: '',
        telefoneInput: '',
        mensagem: '',
    });

    const mapsQuery = encodeURIComponent(`${address}, ${municipio || ''} - ${uf || ''}, ${cep || ''}, Brasil`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    const rawPhoneDigits = (telefone || '').replace(/\D/g, '');
    const whatsappUrl = rawPhoneDigits.length >= 10
        ? `https://wa.me/55${rawPhoneDigits}?text=${encodeURIComponent(`Olá, gostaria de mais informações sobre os serviços de ${companyName}.`)}`
        : null;

    const contactEmail = email || `contato@${companyName.toLowerCase().replace(/\s+/g, '')}.com.br`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitted(true);
    };

    return (
        <section id="contato" className="py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs sm:text-sm font-semibold text-blue-400 uppercase tracking-widest">
                        Atendimento & Localização
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                        Canais de Comunicação Oficial
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-400">
                        Entre em contato diretamente com a equipe de {companyName}. Estamos à disposição para atendê-lo.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Direct Info & Channels (5 cols) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        {/* Address Box */}
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                        Endereço da Sede
                                    </span>
                                    <p className="text-white font-medium text-sm leading-relaxed">
                                        {address}
                                    </p>
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mt-3 transition-colors"
                                    >
                                        Abrir no Google Maps
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Phone & WhatsApp */}
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                        Telefone & Atendimento
                                    </span>
                                    <p className="text-white font-semibold text-base">
                                        {telefone || '(Atendimento Direto)'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {telefone && (
                                            <a
                                                href={`tel:${rawPhoneDigits}`}
                                                className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Ligar Agora
                                            </a>
                                        )}
                                        {whatsappUrl && (
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Conversar no WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                        E-mail Institucional
                                    </span>
                                    <a
                                        href={`mailto:${contactEmail}`}
                                        className="text-white font-medium text-sm hover:text-blue-400 transition-colors break-all"
                                    >
                                        {contactEmail}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Business Hours */}
                        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 flex items-center gap-3 text-slate-400 text-xs">
                            <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            <span>
                                Horário de Funcionamento: <strong>Segunda a Sexta-feira, das 09:00 às 18:00</strong>
                            </span>
                        </div>
                    </motion.div>

                    {/* Right Column: Interactive Contact Form (7 cols) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-7 bg-slate-800/90 border border-slate-700/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    Envie uma Mensagem
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Preencha os campos abaixo para solicitar um orçamento ou tirar dúvidas
                                </p>
                            </div>
                        </div>

                        {formSubmitted ? (
                            <div className="text-center py-12 px-4">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">
                                    Mensagem Enviada com Sucesso!
                                </h4>
                                <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
                                    Agradecemos seu contato. A equipe de {companyName} responderá sua solicitação em até 1 dia útil.
                                </p>
                                <button
                                    onClick={() => {
                                        setFormSubmitted(false);
                                        setFormData({ nome: '', emailInput: '', telefoneInput: '', mensagem: '' });
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                                >
                                    Enviar nova mensagem
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                            Seu Nome *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nome completo"
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                            E-mail *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="seuemail@exemplo.com"
                                            value={formData.emailInput}
                                            onChange={(e) => setFormData({ ...formData, emailInput: e.target.value })}
                                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Telefone / WhatsApp
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        value={formData.telefoneInput}
                                        onChange={(e) => setFormData({ ...formData, telefoneInput: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                        Mensagem *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Descreva o serviço de interesse ou sua dúvida..."
                                        value={formData.mensagem}
                                        onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm mt-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Enviar Mensagem
                                </button>
                                <p className="text-[11px] text-slate-400 text-center mt-2">
                                    Seus dados estão protegidos nos termos de nossa Política de Privacidade (LGPD).
                                </p>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
