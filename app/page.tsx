'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Shield, Search, CheckCircle, Zap, MessageSquare, TrendingUp,
  Code2, Users, Star, ArrowRight, Globe, Lock,
  ChevronRight, Smartphone, BarChart3, ShieldCheck
} from 'lucide-react';

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' as const }
  }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({ opacity: 1, transition: { duration: 0.5, delay: i * 0.08 } }),
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function NavLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <Shield size={32} className="text-white" style={{
          fill: 'rgba(59,130,246,0.2)',
          filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))',
          strokeWidth: 1.5,
        }} />
        <div className="absolute -right-1 -bottom-1 bg-[#080810] rounded-full p-0.5 border border-[#080810]">
          <Search size={12} className="text-purple-400" strokeWidth={2.5} />
        </div>
      </div>
      <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Verify<span className="text-blue-500">Ads</span>
      </span>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const benefits = [
  {
    icon: MessageSquare, emoji: '💬',
    gradient: 'from-emerald-500/[0.08] to-emerald-500/[0.02]',
    border: 'border-emerald-500/20 hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/10',
    title: '+2.000 Envios no WhatsApp',
    description: 'Acesse a WhatsApp Business API com capacidade de envio em massa. Chegue a mais clientes com campanhas de marketing direto.',
  },
  {
    icon: TrendingUp, emoji: '💰',
    gradient: 'from-blue-500/[0.08] to-blue-500/[0.02]',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400',
    glow: 'hover:shadow-blue-500/10',
    title: 'Limite de até $100k/dia',
    description: 'Aumente seu limite diário de anúncios de $50 para até $100.000/dia. Escale suas campanhas sem restrições de gasto.',
  },
  {
    icon: Code2, emoji: '📱',
    gradient: 'from-purple-500/[0.08] to-purple-500/[0.02]',
    border: 'border-purple-500/20 hover:border-purple-500/50',
    iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400',
    glow: 'hover:shadow-purple-500/10',
    title: 'Criar Apps no Facebook',
    description: 'Desbloqueie developer features exclusivas do Meta para criar e publicar aplicativos vinculados à sua empresa verificada.',
  },
  {
    icon: ShieldCheck, emoji: '🛡️',
    gradient: 'from-red-500/[0.08] to-red-500/[0.02]',
    border: 'border-red-500/20 hover:border-red-500/50',
    iconBg: 'bg-red-500/10', iconColor: 'text-red-400',
    glow: 'hover:shadow-red-500/10',
    title: 'Proteção Contra Imposores',
    description: 'O Meta monitora ativamente tentativas de impersonação da sua marca, protegendo sua reputação e seus clientes.',
  },
  {
    icon: Star, emoji: '✅',
    gradient: 'from-yellow-500/[0.08] to-yellow-500/[0.02]',
    border: 'border-yellow-500/20 hover:border-yellow-500/50',
    iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-400',
    glow: 'hover:shadow-yellow-500/10',
    title: 'Selo Azul de Verificação',
    description: 'Apareça como empresa legítima com o badge verificado nas buscas do Facebook e Instagram. Mais confiança, mais conversões.',
  },
  {
    icon: Users, emoji: '🎯',
    gradient: 'from-cyan-500/[0.08] to-cyan-500/[0.02]',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
    iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400',
    glow: 'hover:shadow-cyan-500/10',
    title: 'Suporte Prioritário Meta',
    description: 'Acesso direto a agentes do Meta para resolver limites de conta, bloqueios e problemas com campanhas rapidamente.',
  },
];

const steps = [
  { icon: Globe, title: 'Cadastre e Adicione seu Domínio', description: 'Crie sua conta, informe o CNPJ da empresa e adicione o domínio que deseja verificar no Facebook Business.' },
  { icon: Lock, title: 'Configure o DNS em Minutos', description: 'Siga as instruções geradas automaticamente. Adicione um registro CNAME ou A no seu registrador de domínio.' },
  { icon: CheckCircle, title: 'Verifique e Ative sua Empresa', description: 'Clique em "Verificar Conexão". O sistema checa o DNS em tempo real. Sua landing page verificada vai ao ar imediatamente.' },
];

const stats = [
  { value: '2.000+', label: 'Envios WhatsApp', icon: MessageSquare },
  { value: '$100k', label: 'Limite Diário Possível', icon: BarChart3 },
  { value: '< 3min', label: 'Para Configurar', icon: Zap },
  { value: '100%', label: 'Automatizado', icon: Smartphone },
];

const plans = [
  {
    name: 'Starter', price: '$100', period: '/mês', domains: 4, highlight: false,
    features: ['4 domínios verificados', 'Landing pages automáticas', 'Verificação DNS em tempo real', 'Relatório de status', 'Suporte por email'],
  },
  {
    name: 'Business', price: '$150', period: '/mês', domains: 8, highlight: true,
    features: ['8 domínios verificados', 'Landing pages automáticas', 'Verificação DNS em tempo real', 'Relatório detalhado', 'Suporte prioritário', 'Pixel do Facebook integrado'],
  },
  {
    name: 'Agency', price: '$200', period: '/mês', domains: 12, highlight: false,
    features: ['12 domínios verificados', 'Landing pages automáticas', 'Verificação DNS em tempo real', 'Dashboard completo', 'Suporte dedicado', 'Pixel do Facebook integrado', 'White label disponível'],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070711] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Background layers ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-30" />
        {/* Ambient orbs */}
        <div className="absolute top-[-10%] left-[10%] w-[700px] h-[700px] rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', animationDelay: '2s' }} />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', animationDelay: '4s' }} />
        {/* Spinning ring decoration */}
        <div className="absolute top-[30%] right-[15%] w-[200px] h-[200px] rounded-full border border-blue-500/10 animate-spin-slow" />
        <div className="absolute top-[28%] right-[13%] w-[240px] h-[240px] rounded-full border border-purple-500/5 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
      </div>

      {/* ═══════════════════════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ background: 'rgba(7,7,17,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLogo />
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
              {['#beneficios', '#como-funciona', '#planos'].map((href, i) => (
                <a key={href} href={href} className="hover:text-white transition-colors duration-200">
                  {['Benefícios', 'Como Funciona', 'Planos'][i]}
                </a>
              ))}
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/60"
            >
              Minha Área <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs sm:text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
          </span>
          Plataforma Oficial de Verificação para Meta Business
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="max-w-4xl mx-auto text-5xl sm:text-6xl lg:text-[76px] font-black leading-[1.03] tracking-tight mb-6"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Verifique sua Empresa{' '}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
              no Facebook
            </span>
            {/* Underline glow */}
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 rounded-full" />
          </span>
          <br />e Desbloqueie Recursos Exclusivos
        </motion.h1>

        <motion.p
          variants={fadeUp} custom={1} initial="hidden" animate="visible"
          className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed"
        >
          Conecte seu domínio, gere sua landing page verificada e tenha acesso a limites maiores de anúncios, WhatsApp Business API — em menos de 3 minutos.
        </motion.p>

        <motion.div
          variants={fadeUp} custom={2} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group relative flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <span className="shimmer-card absolute inset-0" />
            <span className="relative z-10 flex items-center gap-2">
              Acessar Minha Área
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <a
            href="#beneficios"
            className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-400 hover:text-white rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-200"
          >
            Ver Benefícios
          </a>
        </motion.div>

        <motion.p
          variants={fadeUp} custom={3} initial="hidden" animate="visible"
          className="mt-6 text-xs text-gray-600"
        >
          Sem cartão de crédito • Configuração em 3 minutos • Suporte em português
        </motion.p>
      </section>

      {/* ═══════════════════════════════════════════════════════
                BENEFITS — brought up high right after hero
            ═══════════════════════════════════════════════════════ */}
      <section id="beneficios" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <motion.p variants={fadeUp} custom={0} className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">
              Vantagens Exclusivas
            </motion.p>
            <motion.h2
              variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Por que verificar sua empresa{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
                no Facebook Business?
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-gray-500 text-lg max-w-2xl mx-auto">
              Empresas verificadas têm acesso a recursos que a maioria dos anunciantes nunca saberá que existem.
            </motion.p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <AnimatedSection key={b.title}>
                  <motion.div
                    variants={fadeUp} custom={i * 0.5}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`shimmer-card group relative p-6 rounded-2xl border bg-gradient-to-br ${b.gradient} ${b.border} transition-all duration-300 shadow-xl ${b.glow} cursor-default`}
                  >
                    {/* Top shine line */}
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className={`w-12 h-12 rounded-xl ${b.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${b.iconColor}`} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                STATS
            ═══════════════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <AnimatedSection key={stat.label}>
                  <motion.div variants={fadeUp} custom={i} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-3xl sm:text-4xl font-black text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">{stat.label}</p>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-purple-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">Processo Simples</motion.p>
            <motion.h2
              variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Verificação em{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">3 passos</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-gray-500 text-lg">Do cadastro à empresa verificada em menos de 3 minutos.</motion.p>
          </AnimatedSection>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Connecting line on desktop */}
            <div className="hidden lg:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5), rgba(59,130,246,0.5))' }} />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <AnimatedSection key={step.title}>
                  <motion.div variants={fadeUp} custom={idx * 0.5} className="text-center">
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-6 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.08))',
                        borderColor: 'rgba(59,130,246,0.3)',
                        boxShadow: '0 0 30px rgba(59,130,246,0.1)'
                      }}>
                      <Icon className="w-6 h-6 text-blue-400" />
                      <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full border-2 border-[#070711] flex items-center justify-center text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                        {idx + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                PRICING
            ═══════════════════════════════════════════════════════ */}
      <section id="planos" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">Planos e Preços</motion.p>
            <motion.h2
              variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Escolha seu{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">plano</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-gray-500 text-lg max-w-xl mx-auto">
              Pague por domínios verificados. Quanto mais domínios, mais empresas você pode gerenciar.
            </motion.p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <AnimatedSection key={plan.name}>
                <motion.div
                  variants={fadeUp} custom={i * 0.3}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`relative rounded-2xl p-7 border transition-all duration-300 h-full flex flex-col ${plan.highlight
                    ? 'border-blue-500/40 shadow-2xl shadow-blue-500/10'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  style={{
                    background: plan.highlight
                      ? 'linear-gradient(160deg, rgba(59,130,246,0.08) 0%, rgba(7,7,17,0.8) 60%)'
                      : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {plan.highlight && (
                    <>
                      {/* Glowing top border */}
                      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 text-[11px] font-bold text-white rounded-full whitespace-nowrap"
                          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}>
                          ⭐ Mais Popular
                        </span>
                      </div>
                    </>
                  )}
                  {/* Shimmer effect */}
                  <div className="shimmer-card absolute inset-0 rounded-2xl" />

                  <div className="relative mb-6">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">{plan.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{plan.price}</span>
                      <span className="text-gray-500 mb-1.5 text-sm">{plan.period}</span>
                    </div>
                    <p className="text-xs text-blue-400 font-medium mt-2">
                      {plan.domains} domínios incluídos
                    </p>
                  </div>

                  <ul className="relative space-y-2.5 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-400">
                        <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/cadastro"
                    className={`relative block w-full py-3.5 text-center text-sm font-bold rounded-xl transition-all duration-200 ${plan.highlight
                      ? 'text-white hover:-translate-y-0.5'
                      : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white'
                      }`}
                    style={plan.highlight ? {
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      boxShadow: '0 8px 30px rgba(59,130,246,0.3)',
                    } : {}}
                  >
                    Começar com {plan.name}
                  </Link>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-center text-gray-700 text-xs mt-8">
            Todos os planos incluem verificação automática de DNS, landing pages profissionais e painel completo.
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.05] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <NavLogo />
          <p className="text-gray-700 text-xs">© {new Date().getFullYear()} VerifyAds. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-xs text-gray-700">
            <Link href="/l/privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
            <Link href="/l/termos" className="hover:text-gray-400 transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
