import Link from 'next/link';
import {
  Shield, Search, CheckCircle, Zap, MessageSquare, TrendingUp,
  Code2, Users, Star, ArrowRight, Globe, Lock, ChevronRight,
  Smartphone, BarChart3, ShieldCheck
} from 'lucide-react';

// ─── Inline Logo (Server Component — no 'use client' needed) ─────────────────
function HeroLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        <Shield
          size={36}
          className="text-white"
          style={{
            fill: 'rgba(59,130,246,0.25)',
            filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6))',
            stroke: 'white',
            strokeWidth: 1.5,
          }}
        />
        <div className="absolute -right-1 -bottom-1 bg-gray-900 rounded-full p-0.5 border-2 border-gray-900">
          <Search size={14} className="text-purple-400" strokeWidth={2.5} />
        </div>
      </div>
      <span className="text-xl font-bold text-white tracking-tight">
        Verify<span className="text-blue-500">Ads</span>
      </span>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const benefits = [
  {
    icon: MessageSquare,
    color: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
    iconColor: 'text-green-400',
    glow: 'shadow-green-500/10',
    title: '+2.000 Envios no WhatsApp',
    description: 'Acesse a WhatsApp Business API com capacidade de envio em massa para campanhas de marketing direto para seus clientes.',
  },
  {
    icon: TrendingUp,
    color: 'from-blue-500/20 to-blue-500/10 border-blue-500/30',
    iconColor: 'text-blue-400',
    glow: 'shadow-blue-500/10',
    title: 'Limite de até $100k/dia',
    description: 'Aumente seu limite diário de gastos em anúncios de $50 para até $100.000/dia. Escale suas campanhas sem restrições.',
  },
  {
    icon: Code2,
    color: 'from-purple-500/20 to-purple-500/10 border-purple-500/30',
    iconColor: 'text-purple-400',
    glow: 'shadow-purple-500/10',
    title: 'Criar Apps no Facebook',
    description: 'Desbloqueie o acesso a developer features exclusivas do Meta para criar e publicar aplicativos vinculados à sua empresa.',
  },
  {
    icon: ShieldCheck,
    color: 'from-red-500/20 to-red-500/10 border-red-500/30',
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/10',
    title: 'Proteção Contra Imposores',
    description: 'O Meta monitora ativamente tentativas de se passar pela sua marca, protegendo sua reputação e seus clientes.',
  },
  {
    icon: Star,
    color: 'from-yellow-500/20 to-yellow-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
    glow: 'shadow-yellow-500/10',
    title: 'Selo Azul de Verificação',
    description: 'Mostre-se como empresa legítima com o badge verificado nas buscas do Facebook e Instagram. Mais confiança, mais conversões.',
  },
  {
    icon: Users,
    color: 'from-cyan-500/20 to-cyan-500/10 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    glow: 'shadow-cyan-500/10',
    title: 'Suporte Prioritário Meta',
    description: 'Acesso direto a agentes do Meta para resolver limites de conta, bloqueios e problemas com câmpanhas rapidamente.',
  },
];

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Cadastre e Adicione seu Domínio',
    description: 'Crie sua conta, informe o CNPJ da empresa e adicione o domínio que deseja verificar no Facebook Business.',
  },
  {
    number: '02',
    icon: Lock,
    title: 'Configure o DNS em Minutos',
    description: 'Siga as instruções geradas automaticamente pelo sistema. Adicione um registro CNAME ou A no seu registrador de domínio.',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Verifique e Ative sua Empresa',
    description: 'Clique em "Verificar Conexão", o sistema checa o DNS em tempo real. Pronto! Sua landing page verificada fica no ar imediatamente.',
  },
];

const stats = [
  { value: '2.000+', label: 'Envios WhatsApp', icon: MessageSquare },
  { value: '$100k', label: 'Limite Diário Possível', icon: BarChart3 },
  { value: '< 3min', label: 'Para Configurar', icon: Zap },
  { value: '100%', label: 'Automatizado', icon: Smartphone },
];

const plans = [
  {
    name: 'Starter',
    price: '$100',
    period: '/mês',
    domains: 4,
    highlight: false,
    features: [
      '4 domínios verificados',
      'Landing pages automáticas',
      'Verificação DNS em tempo real',
      'Relatório de status',
      'Suporte por email',
    ],
  },
  {
    name: 'Business',
    price: '$150',
    period: '/mês',
    domains: 8,
    highlight: true,
    badge: '⭐ Mais Popular',
    features: [
      '8 domínios verificados',
      'Landing pages automáticas',
      'Verificação DNS em tempo real',
      'Relatório detalhado',
      'Suporte prioritário',
      'Pixel do Facebook integrado',
    ],
  },
  {
    name: 'Agency',
    price: '$200',
    period: '/mês',
    domains: 12,
    highlight: false,
    features: [
      '12 domínios verificados',
      'Landing pages automáticas',
      'Verificação DNS em tempo real',
      'Dashboard completo',
      'Suporte dedicado',
      'Pixel do Facebook integrado',
      'White label disponível',
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Background ambient glows ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      {/* ═══════════════════════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <HeroLogo />
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
              <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
              <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
              <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Minha Área
              </Link>
              <Link
                href="/cadastro"
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Plataforma Oficial de Verificação para Meta Business
        </div>

        {/* Headline */}
        <h1
          className="max-w-4xl mx-auto text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Verifique sua Empresa<br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            no Facebook
          </span>{' '}
          e Desbloqueie<br />
          <span className="text-white">Recursos Exclusivos</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
          Conecte seu domínio, gere sua landing page verificada e tenha acesso a limites maiores de anúncios, WhatsApp Business API e muito mais — em menos de 3 minutos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/cadastro"
            className="group flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all shadow-xl shadow-blue-900/40 hover:shadow-blue-900/60 hover:-translate-y-0.5"
          >
            Começar Agora — É Grátis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
          >
            Acessar Minha Área
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs text-gray-600">
          Sem cartão de crédito necessário • Configuração em menos de 3 minutos • Suporte em português
        </p>

        {/* Hero visual: floating card mockup */}
        <div className="relative mt-20 max-w-3xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 rounded-3xl blur-3xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 bg-white/5 rounded-md h-6 ml-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Domínio', value: 'verifyads.online', status: 'ATIVO', color: 'green' },
                { label: 'DNS', value: 'CNAME → Vercel', status: 'VERIFICADO', color: 'blue' },
                { label: 'Meta Business', value: 'Empresa Verificada', status: 'ATIVO', color: 'purple' },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-mono text-white truncate mb-2">{item.value}</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${item.color === 'green' ? 'bg-green-500/15 text-green-400' :
                      item.color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                        'bg-purple-500/15 text-purple-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${item.color === 'green' ? 'bg-green-400' :
                        item.color === 'blue' ? 'bg-blue-400' :
                          'bg-purple-400'
                      }`} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <p className="text-sm text-green-300 font-medium">
                ✓ Empresa verificada com sucesso! Sua landing page está no ar em <span className="font-mono">verifyads.online</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                STATS
            ═══════════════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                  <p className="text-3xl sm:text-4xl font-black text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                BENEFITS
            ═══════════════════════════════════════════════════════ */}
      <section id="beneficios" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Vantagens Exclusivas</p>
            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Por que verificar sua empresa
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                no Facebook Business?
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Empresas verificadas têm acesso a recursos que a maioria dos anunciantes nunca saberá que existem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className={`group relative p-6 rounded-2xl border bg-gradient-to-br ${b.color} hover:scale-[1.02] transition-all duration-300 shadow-xl ${b.glow}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${b.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{b.description}</p>
                </div>
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
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Processo Simples</p>
            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Verificação em{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                3 passos
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Do cadastro à empresa verificada em menos de 3 minutos. Sem complicação.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/30 mb-6 mx-auto">
                      <Icon className="w-7 h-7 text-blue-400" />
                      <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-blue-500 border-2 border-[#080810] flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{idx + 1}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-xl shadow-blue-900/30 hover:-translate-y-0.5"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                PRICING
            ═══════════════════════════════════════════════════════ */}
      <section id="planos" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Planos e Preços</p>
            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Escolha seu{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                plano
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Pague por domínios verificados. Quanto mais domínios, mais empresas verificadas você pode gerenciar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${plan.highlight
                    ? 'border-blue-500/60 bg-gradient-to-b from-blue-600/15 to-purple-600/10 shadow-2xl shadow-blue-600/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 text-xs font-bold text-white rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                        ⭐ Mais Popular
                      </span>
                    </div>
                  </>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-400 mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {plan.price}
                    </span>
                    <span className="text-gray-400 mb-2">{plan.period}</span>
                  </div>
                  <p className="text-sm text-blue-300 font-medium mt-2">
                    {plan.domains} domínios incluídos
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/cadastro"
                  className={`block w-full py-3.5 text-center text-sm font-bold rounded-xl transition-all ${plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/40'
                      : 'border border-white/20 bg-white/5 hover:bg-white/10 text-white'
                    }`}
                >
                  Começar com {plan.name}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 text-sm mt-8">
            Todos os planos incluem verificação automática de DNS, landing pages profissionais e painel de controle completo.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                FINAL CTA
            ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 rounded-3xl blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 sm:p-16">
            <h2
              className="text-4xl sm:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Pronto para escalar seus
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                anúncios no Meta?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Junte-se a empresas que já desbloquearam o potencial máximo do Facebook Business com a verificação de domínio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cadastro"
                className="group flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-0.5"
              >
                Criar Minha Conta Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 text-base font-semibold text-gray-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <HeroLogo />
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} VerifyAds. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/l/privacidade" className="hover:text-gray-400 transition-colors">Privacidade</Link>
            <Link href="/l/termos" className="hover:text-gray-400 transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
