'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/dashboard/Navigation';
import AuroraBackground from '@/components/layout/AuroraBackground';
import {
    Facebook, FileText, Globe, Shield, ChevronDown,
    CheckCircle, Copy, ExternalLink, Smartphone,
    BookOpen, Zap, HelpCircle, ArrowRight, Terminal,
    Info, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
    title: string;
    description: string;
    hint?: string;
    hintType?: 'info' | 'warning' | 'success' | 'code';
    code?: string;
}

interface GuideSection {
    id: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
    title: string;
    subtitle: string;
    steps: Step[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const guides: GuideSection[] = [
    {
        id: 'facebook',
        icon: <Facebook className="w-5 h-5" />,
        color: '#3b82f6',
        badge: 'Meta Business',
        title: 'Verificar Domínio no Facebook Ads',
        subtitle: 'Conecte seu domínio ao Meta Business e desbloqueie recursos exclusivos de anúncios.',
        steps: [
            {
                title: 'Acesse o Gerenciador de Negócios',
                description: 'No Meta Business Suite, vá até Configurações do Negócio → Segurança da Marca → Domínios.',
                hint: 'Menu Lateral → Segurança da Marca → Domínios',
                hintType: 'code',
            },
            {
                title: 'Adicione o Domínio',
                description: "Clique em 'Adicionar', selecione 'Criar um novo domínio' e cole o link da sua Landing Page gerada neste sistema.",
                hint: 'Use o link sem "http://" ou "https://". Ex: seudominio.com',
                hintType: 'info',
            },
            {
                title: 'Copie a Meta-tag de Verificação',
                description: 'Selecione "Adicione uma meta-tag ao seu código-fonte HTML" e copie o código completo.',
                hint: '<meta name="facebook-domain-verification" content="TOKEN" />',
                hintType: 'code',
            },
            {
                title: 'Cole no VerifyAds',
                description: 'Volte aqui, encontre seu domínio em Minha Área → Domínios, clique em Editar (ícone lápis) e cole o token no campo "Token de Verificação". Salve.',
            },
            {
                title: 'Clique em Verificar no Facebook',
                description: "Volte ao Facebook e clique no botão verde 'Verificar Domínio'. O domínio deve ser verificado em segundos.",
                hint: 'Verificado com sucesso!',
                hintType: 'success',
            },
        ],
    },
    {
        id: 'pdf',
        icon: <FileText className="w-5 h-5" />,
        color: '#f59e0b',
        badge: 'PDF & Comprovante',
        title: 'Editar o PDF para receber SMS',
        subtitle: 'Personalize o comprovante gerado para adicionar seu número de telefone.',
        steps: [
            {
                title: 'Gere e Baixe o PDF',
                description: 'Na página Minerar CNPJ, encontre uma empresa, gere o comprovante e faça o download do arquivo PDF.',
            },
            {
                title: 'Abra em um Editor de PDF',
                description: 'Recomendamos Adobe Acrobat, Foxit Reader ou ILovePDF (online, gratuito).',
                hint: 'Acesse ilovepdf.com → Editor de PDF → Adicionar Texto',
                hintType: 'info',
            },
            {
                title: 'Adicione seu Número de Telefone',
                description: 'Use a ferramenta de "Texto" ou "Editar Conteúdo" para adicionar ou substituir o campo de telefone no cabeçalho do comprovante.',
                hint: 'Dica: Mantenha a mesma fonte e tamanho para parecer original.',
                hintType: 'warning',
            },
            {
                title: 'Salve e Use',
                description: 'Salve o PDF editado. Ele agora contém seu número e pode ser enviado ao Meta para confirmação por SMS.',
                hint: 'O SMS chegará no número que você colocou no PDF.',
                hintType: 'success',
            },
        ],
    },
    {
        id: 'dominio',
        icon: <Globe className="w-5 h-5" />,
        color: '#8b5cf6',
        badge: 'Domínio',
        title: 'Configurar um Domínio Personalizado',
        subtitle: 'Conecte seu próprio domínio para servir sua landing page de verificação.',
        steps: [
            {
                title: 'Compre ou Use um Domínio Existente',
                description: 'Você precisa de um domínio próprio (ex: minhaverficacao.com.br). Use GoDaddy, Registro.br ou Cloudflare.',
            },
            {
                title: 'Adicione o Domínio no VerifyAds',
                description: 'Em Minha Área → aba Domínios, clique em "+ Adicionar Domínio" e insira seu domínio.',
            },
            {
                title: 'Aponte o DNS — Adicione um CNAME',
                description: 'No painel do seu registrador de domínio, crie um registro CNAME apontando para o nosso servidor.',
                hint: 'CNAME  @  →  cname.vercel-dns.com  (TTL 300)',
                hintType: 'code',
            },
            {
                title: 'Aguarde a Propagação',
                description: 'A propagação de DNS pode levar de 10 minutos a 48 horas. Após isso, clique em "Verificar Conexão" no VerifyAds.',
                hint: 'Em geral, leva menos de 30 minutos com Cloudflare.',
                hintType: 'info',
            },
            {
                title: 'Landing Page Ativa!',
                description: 'Quando a verificação for bem-sucedida, sua landing page estará disponível no seu domínio e visível para o Facebook.',
                hint: 'Domínio verificado e landing page ativa!',
                hintType: 'success',
            },
        ],
    },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
    {
        q: 'Por que meu domínio não está verificando?',
        a: 'O DNS pode levar até 48h para propagar. Certifique-se de que o registro CNAME está correto no painel do seu registrador. Se o erro persistir, verifique se não há outro registro A ou AAAA conflitando.',
    },
    {
        q: 'Preciso do meta-token do Facebook ou só do domínio?',
        a: 'Para a verificação completa no Meta Business, você precisa do token de verificação da meta-tag. O sistema injeta esse token automaticamente na sua Landing Page quando você o insere no cadastro do domínio.',
    },
    {
        q: 'Quanto tempo leva para o Facebook verificar meu domínio?',
        a: 'Normalmente segundos, desde que o DNS já tenha propagado. O Facebook acessa seu domínio e lê a meta-tag automaticamente.',
    },
    {
        q: 'O PDF gerado é aceito pelo Meta?',
        a: 'Sim. O comprovante de residência gerado usa dados reais da Receita Federal via BrasilAPI e segue o formato padrão exigido pelo Meta para confirmação de identidade.',
    },
    {
        q: 'Posso ter múltiplos domínios no mesmo plano?',
        a: 'Depende do seu plano. O plano Starter inclui 1 domínio, o Pro inclui 3 e o Agência inclui domínios ilimitados. Veja a página de Planos para detalhes.',
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeGuide, setActiveGuide] = useState<string>('facebook');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const currentGuide = guides.find(g => g.id === activeGuide)!;

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20 text-white" style={{ background: 'transparent', fontFamily: "'Inter', sans-serif" }}>
            <AuroraBackground />
            <div className="max-w-5xl mx-auto">
                <Navigation
                    title="Central de Ajuda"
                    description="Guias, tutoriais e respostas para as principais dúvidas"
                />

                {/* Category tabs */}
                <div className="flex gap-3 mb-8 flex-wrap">
                    {guides.map((guide) => (
                        <button
                            key={guide.id}
                            onClick={() => setActiveGuide(guide.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                background: activeGuide === guide.id
                                    ? `${guide.color}22`
                                    : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${activeGuide === guide.id ? `${guide.color}55` : 'rgba(255,255,255,0.08)'}`,
                                color: activeGuide === guide.id ? guide.color : 'rgba(255,255,255,0.5)',
                                boxShadow: activeGuide === guide.id ? `0 0 20px ${guide.color}20` : 'none',
                            }}
                        >
                            <span style={{ color: activeGuide === guide.id ? guide.color : 'rgba(255,255,255,0.4)' }}>
                                {guide.icon}
                            </span>
                            {guide.title.split(' ').slice(0, 2).join(' ')}
                        </button>
                    ))}

                    <button
                        onClick={() => {
                            document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)',
                        }}
                    >
                        <HelpCircle className="w-4 h-4" />
                        FAQ
                    </button>
                </div>

                {/* Active Guide */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeGuide}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.25 }}
                        className="mb-16"
                    >
                        {/* Guide Header */}
                        <div
                            className="rounded-2xl p-6 mb-6 border relative overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${currentGuide.color}15, ${currentGuide.color}05)`,
                                borderColor: `${currentGuide.color}30`,
                            }}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl"
                                style={{ background: currentGuide.color, transform: 'translate(30%, -30%)' }} />
                            <div className="relative">
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-3"
                                    style={{
                                        background: `${currentGuide.color}20`,
                                        borderColor: `${currentGuide.color}40`,
                                        color: currentGuide.color,
                                    }}
                                >
                                    {currentGuide.icon}
                                    {currentGuide.badge}
                                </span>
                                <h2 className="text-2xl font-bold text-white mb-1"
                                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {currentGuide.title}
                                </h2>
                                <p className="text-gray-400 text-sm">{currentGuide.subtitle}</p>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="space-y-4">
                            {currentGuide.steps.map((step, idx) => (
                                <StepCard
                                    key={idx}
                                    number={idx + 1}
                                    total={currentGuide.steps.length}
                                    step={step}
                                    accentColor={currentGuide.color}
                                    isLast={idx === currentGuide.steps.length - 1}
                                />
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Quick Tips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                    {[
                        { icon: <Zap className="w-5 h-5" />, title: 'Propagação DNS', body: 'Use Cloudflare como nameserver para propagação quase instantânea do seu domínio.', color: '#f59e0b' },
                        { icon: <Shield className="w-5 h-5" />, title: 'Token Seguro', body: 'O token do Facebook deve ser inserido exatamente como copiado — sem espaços extras.', color: '#3b82f6' },
                        { icon: <BookOpen className="w-5 h-5" />, title: 'Suporte atualizado', body: 'Os tutoriais são revisados a cada atualização do Meta Business Suite.', color: '#8b5cf6' },
                    ].map((tip, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="rounded-2xl p-5 border"
                            style={{
                                background: `${tip.color}0a`,
                                borderColor: `${tip.color}25`,
                            }}
                        >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                                style={{ background: `${tip.color}20`, color: tip.color }}>
                                {tip.icon}
                            </div>
                            <h3 className="font-bold text-white mb-1 text-sm">{tip.title}</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">{tip.body}</p>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ */}
                <div id="faq-section">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <HelpCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Perguntas Frequentes
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <FaqItem
                                key={idx}
                                faq={faq}
                                isOpen={openFaq === idx}
                                onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({ number, total, step, accentColor, isLast }: {
    number: number; total: number; step: Step; accentColor: string; isLast: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: number * 0.06 }}
            className="flex gap-4"
        >
            {/* Step number + connector line */}
            <div className="flex flex-col items-center">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
                        boxShadow: `0 4px 12px ${accentColor}40`,
                    }}
                >
                    {number}
                </div>
                {!isLast && (
                    <div className="w-px flex-1 mt-2" style={{ background: `${accentColor}30`, minHeight: '24px' }} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
                <div
                    className="rounded-xl p-5 border transition-all duration-200 hover:border-opacity-60"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(255,255,255,0.07)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${accentColor}40`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                    <h3 className="font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">{step.description}</p>

                    {step.hintType === 'code' && step.hint && (
                        <div className="flex items-center gap-2 bg-black/30 rounded-lg px-4 py-2.5 font-mono text-xs text-green-400 border border-green-500/20">
                            <Terminal className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span className="truncate">{step.hint}</span>
                        </div>
                    )}
                    {step.hintType === 'info' && step.hint && (
                        <div className="flex items-start gap-2 bg-blue-500/08 rounded-lg px-3 py-2.5 text-xs text-blue-300 border border-blue-500/20"
                            style={{ background: 'rgba(59,130,246,0.08)' }}>
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <span>{step.hint}</span>
                        </div>
                    )}
                    {step.hintType === 'warning' && step.hint && (
                        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs text-amber-300 border border-amber-500/20"
                            style={{ background: 'rgba(245,158,11,0.08)' }}>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{step.hint}</span>
                        </div>
                    )}
                    {step.hintType === 'success' && step.hint && (
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-green-400 border border-green-500/20"
                            style={{ background: 'rgba(34,197,94,0.08)' }}>
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">{step.hint}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── FAQ Item ──────────────────────────────────────────────────────────────────

function FaqItem({ faq, isOpen, onToggle }: { faq: { q: string; a: string }; isOpen: boolean; onToggle: () => void }) {
    return (
        <div
            className="rounded-xl border overflow-hidden transition-all duration-200"
            style={{
                borderColor: isOpen ? 'rgba(59,130,246,0.30)' : 'rgba(255,255,255,0.07)',
                background: isOpen ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.03)',
            }}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <span className="font-semibold text-sm text-white">{faq.q}</span>
                <ChevronDown
                    className="w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/[0.06] pt-3">
                            {faq.a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
