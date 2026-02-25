'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/dashboard/Navigation';
import AuroraBackground from '@/components/layout/AuroraBackground';
import {
    Facebook, FileText, Globe, Shield, ChevronDown,
    CheckCircle, Terminal,
    BookOpen, Zap, HelpCircle,
    Info, AlertCircle, Lightbulb, Key, MousePointer,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
    title: string;
    description: string;
    hint?: string;
    hintType?: 'info' | 'warning' | 'success' | 'code' | 'tip';
}

interface TipBlock {
    type: 'tip' | 'warning' | 'info';
    title: string;
    body: string;
}

interface GuideSection {
    id: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
    title: string;
    subtitle: string;
    steps: Step[];
    extra?: TipBlock[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const guides: GuideSection[] = [
    {
        id: 'minerar',
        icon: <MousePointer className="w-5 h-5" />,
        color: '#3b82f6',
        badge: 'Passo 1 — Minerar',
        title: 'Encontrar e Preparar uma Empresa',
        subtitle: 'Use o VerifyAds para encontrar empresas ativas e personalizar suas informações direto no sistema.',
        steps: [
            {
                title: 'Acesse a página Minerar',
                description: 'No menu lateral, clique em "Minerar". Configure os filtros desejados (cidade, capital, CNAE) e clique no botão "MINERAR DADOS REAIS". O sistema vai procurar automaticamente empresas ativas na Receita Federal.',
                hint: 'Menu lateral → Minerar → Configure filtros → MINERAR DADOS REAIS',
                hintType: 'code',
            },
            {
                title: 'Selecione uma empresa encontrada',
                description: 'Quando as empresas aparecerem na tela, clique em qualquer uma delas. O Dossiê Empresarial abrirá — um modal com todos os dados da empresa (CNPJ, endereço, capital social, porte) verificados diretamente na Receita Federal.',
                hint: '📋 Cada empresa aparece com um Trust Score de 0–100 indicando a qualidade do perfil.',
                hintType: 'info',
            },
            {
                title: 'Edite o telefone e e-mail no campo "Editar Informações"',
                description: 'No Dossiê Empresarial (modal central), na seção "EDITAR INFORMAÇÕES", você verá os campos de telefone e e-mail já preenchidos com os dados da Receita Federal. Substitua pelo SEU número de celular e SEU e-mail. Esses dados serão usados tanto no PDF quanto na landing page gerada.',
                hint: '⚠️ IMPORTANTE: Coloque SEU celular no campo telefone. O Facebook pode enviar um SMS de verificação para esse número.',
                hintType: 'warning',
            },
            {
                title: 'Adicione o Token do Facebook (antes de gerar)',
                description: 'Na seção "VERIFICAÇÃO FACEBOOK" do mesmo modal, cole o código da meta-tag que o Facebook gerou para você (ex: <meta name="facebook-domain-verification" content="TOKEN">). O sistema extrai o token automaticamente. Faça isso ANTES de clicar em Gerar Link.',
                hint: 'Cole o código completo da meta-tag — o sistema extrai apenas o token sozinho.',
                hintType: 'info',
            },
        ],
        extra: [
            {
                type: 'info',
                title: '💡 Tudo acontece dentro do VerifyAds',
                body: 'Não é necessário usar nenhuma ferramenta externa. O telefone, e-mail e token do Facebook são editados direto no Dossiê Empresarial. O PDF e a landing page são gerados pelo próprio sistema.',
            },
        ],
    },
    {
        id: 'pdf',
        icon: <FileText className="w-5 h-5" />,
        color: '#f59e0b',
        badge: 'Passo 2 — PDF',
        title: 'Gerar o PDF para Verificação por SMS',
        subtitle: 'O VerifyAds gera o comprovante oficial com seus dados personalizados — pronto para enviar ao Facebook.',
        steps: [
            {
                title: 'Edite o número de telefone no Dossiê',
                description: 'Antes de gerar o PDF, certifique-se de que o campo "Telefone" no Dossiê Empresarial (seção Editar Informações) contém o SEU número de celular. Esse número será inserido automaticamente no PDF gerado. O Facebook pode enviar um SMS com código de verificação para esse número.',
                hint: 'Campo de telefone no Dossiê → substitua pelo seu celular (DDD) NNNNN-NNNN',
                hintType: 'warning',
            },
            {
                title: 'Clique em "GERAR PDF" no rodapé do Dossiê',
                description: 'No rodapé do Dossiê Empresarial, clique no botão vermelho "GERAR PDF". O sistema vai criar automaticamente o comprovante oficial com os dados da empresa e com o número de telefone que você editou. O PDF será aberto em uma nova aba do navegador.',
                hint: 'Botão vermelho "GERAR PDF" → PDF abre automaticamente em nova aba',
                hintType: 'code',
            },
            {
                title: 'Salve o PDF no seu computador',
                description: 'Com o PDF aberto na nova aba, use o atalho Ctrl+S (ou Cmd+S no Mac) para salvar o arquivo. Você também pode usar o botão de download do próprio navegador (ícone de impressora ou download no canto superior direito).',
                hint: 'Ctrl+S (Windows) ou Cmd+S (Mac) para salvar o PDF',
                hintType: 'code',
            },
            {
                title: 'Envie ao Facebook para verificação por SMS',
                description: 'No Facebook → Configurações do Negócio → Verificação do Negócio, escolha o método de documento oficial e faça upload do PDF salvo. O Facebook analisará o documento e enviará um SMS com código de confirmação para o número que você colocou no campo de telefone do Dossiê.',
                hint: '✅ SMS recebido! Insira o código de 6 dígitos na tela do Facebook para confirmar.',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'tip',
                title: '💡 O PDF já vem pronto com seus dados',
                body: 'Não é necessário usar editores externos como ILovePDF. O VerifyAds já gera o PDF com o telefone e e-mail que você editou no Dossiê Empresarial. Basta clicar em Gerar PDF, salvar e enviar ao Facebook.',
            },
        ],
    },
    {
        id: 'landingpage',
        icon: <Globe className="w-5 h-5" />,
        color: '#8b5cf6',
        badge: 'Passo 3 — Landing Page',
        title: 'Gerar o Site da Empresa no Seu Domínio',
        subtitle: 'O VerifyAds cria e hospeda automaticamente a landing page da empresa no domínio que você conectar.',
        steps: [
            {
                title: 'Conecte seu domínio primeiro',
                description: 'Acesse Minha Área → aba "Domínios" → clique em "+ Adicionar Domínio". Insira seu domínio (ex: minhaverficacao.com.br) sem "https://". O sistema vai mostrar o registro CNAME que você precisa configurar no provedor do domínio (Cloudflare, GoDaddy, Registro.br, etc.).',
                hint: 'Minha Área → Domínios → + Adicionar Domínio',
                hintType: 'code',
            },
            {
                title: 'Configure o CNAME no seu provedor de domínio',
                description: 'Acesse o painel onde comprou o domínio, vá em "Gerenciar DNS" e adicione um registro CNAME. O HOST deve ser "@" (raiz) e o VALOR deve ser "cname.vercel-dns.com". Salve e aguarde a propagação (normalmente menos de 10 minutos com Cloudflare).',
                hint: 'CNAME  →  @  →  cname.vercel-dns.com  (TTL: Auto)',
                hintType: 'code',
            },
            {
                title: 'Verifique a conexão no VerifyAds',
                description: 'Após configurar o CNAME, volte ao VerifyAds → Minha Área → Domínios → clique em "Verificar Conexão". Quando aparecer o badge verde "Verificado", seu domínio está pronto para receber a landing page.',
                hint: '✅ Badge verde "Verificado" = domínio pronto para uso.',
                hintType: 'success',
            },
            {
                title: 'No Dossiê: adicione o Token do Facebook',
                description: 'De volta ao Dossiê Empresarial (Minerar → clique na empresa), na seção "VERIFICAÇÃO FACEBOOK", cole o código da meta-tag gerado pelo Facebook. O token será embutido automaticamente no HTML da landing page. Faça isso ANTES de clicar em Gerar Link.',
                hint: '⚠️ Cole o token ANTES de gerar o link. Se gerar sem o token, o Facebook não poderá verificar o domínio.',
                hintType: 'warning',
            },
            {
                title: 'Selecione o domínio e clique em "GERAR LINK & SALVAR"',
                description: 'Na coluna "PÁGINA WHITE LABEL" do Dossiê (lado direito), selecione no menu suspenso o domínio que você conectou. Clique em "GERAR LINK & SALVAR" (ou "SALVAR & INJETAR CÓDIGO" se já inseriu o token). O sistema criará e publicará a landing page com os dados da empresa automaticamente.',
                hint: 'Dossiê → PÁGINA WHITE LABEL → Selecione o domínio → GERAR LINK & SALVAR',
                hintType: 'code',
            },
            {
                title: 'Verifique o site gerado pelo VerifyAds',
                description: 'Após alguns instantes, o link do seu domínio aparecerá na tela. Acesse-o no navegador para confirmar que a landing page está publicada com os dados da empresa. Para verificar o token do Facebook, clique com botão direito na página → "Ver código-fonte" (Ctrl+U) → pesquise "facebook-domain-verification".',
                hint: 'Ctrl+U → Ctrl+F → pesquise "facebook-domain-verification" → seu token deve aparecer',
                hintType: 'code',
            },
            {
                title: 'Verifique o domínio no Facebook',
                description: 'Com a landing page publicada, vá ao Facebook → Configurações do Negócio → Segurança da Marca → Domínios → "Adicionar" → insira seu domínio → "Verificar Domínio". O Facebook acessará sua página automaticamente e confirmará a verificação em segundos.',
                hint: '✅ Domínio verificado no Facebook! Agora você pode usar em campanhas de Ads.',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'tip',
                title: '💡 Uma empresa = um domínio = exclusividade',
                body: 'Cada empresa só pode ser vinculada a um domínio por vez. Após gerar o link, essa empresa fica exclusiva para você — ela não aparecerá mais para outros usuários do VerifyAds na mineração.',
            },
        ],
    },
    {
        id: 'facebook',
        icon: <Facebook className="w-5 h-5" />,
        color: '#10b981',
        badge: 'Passo 4 — Facebook',
        title: 'Verificar Empresa no Meta Business',
        subtitle: 'Obtenha o token de verificação no Facebook e conclua a verificação do seu negócio.',
        steps: [
            {
                title: 'Acesse o Meta Business Suite e vá em Configurações do Negócio',
                description: 'Abra business.facebook.com e faça login. Clique no ícone de engrenagem ⚙️ no canto inferior esquerdo para acessar Configurações do Negócio. Na barra lateral, procure "Central de Segurança" → "Verificação do Negócio".',
                hint: 'business.facebook.com → Configurações do Negócio → Central de Segurança → Verificação do Negócio',
                hintType: 'code',
            },
            {
                title: 'Gere o token: Segurança da Marca → Domínios',
                description: 'No menu lateral, clique em "Segurança da Marca" → "Domínios" → clique em "+ Adicionar". Digite seu domínio sem "https://" (ex: meusite.com.br). Escolha o método "Adicione uma meta-tag ao código-fonte HTML". O Facebook gerará um código único como: <meta name="facebook-domain-verification" content="TOKEN">.',
                hint: '<meta name="facebook-domain-verification" content="abc123xyz..." />',
                hintType: 'code',
            },
            {
                title: 'Copie o código e cole no VerifyAds',
                description: 'Copie todo o código da meta-tag. No VerifyAds → Minerar → clique na empresa → seção "VERIFICAÇÃO FACEBOOK" → campo "Token Meta-tag" → cole o código. O sistema extrai automaticamente o token. Depois clique em "SALVAR & INJETAR CÓDIGO" para publicar a landing page com o token embutido.',
                hint: '⚠️ Não feche a aba do Facebook! Você precisará voltar para clicar em Verificar Domínio.',
                hintType: 'warning',
            },
            {
                title: 'Volte ao Facebook e clique em Verificar Domínio',
                description: 'Com a landing page publicada, volte à aba do Facebook → Domínios → clique em "Verificar Domínio" ao lado do seu domínio. O Facebook acessará sua página, lerá a meta-tag e confirmará em segundos.',
                hint: '✅ Domínio verificado! A verificação do negócio está concluída.',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'tip',
                title: '🔓 Facebook novo não mostra "Verificar Domínio"?',
                body: 'Contas novas do Meta Business não têm essa opção liberada automaticamente. Solução: acesse developers.facebook.com → Meus Apps → Criar App → selecione "Outro" → tipo "Negócio" → preencha um nome qualquer → crie o app. Ao vincular o app ao seu Business Manager, o Facebook normalmente libera a opção de verificação em minutos. Após desbloquear, pode excluir o app.',
            },
            {
                type: 'info',
                title: '📋 Alternativa: Verificação por SMS com o PDF',
                body: 'Prefere verificar por SMS? No Dossiê Empresarial, coloque SEU número no campo de telefone → clique em GERAR PDF → salve → envie ao Facebook como documento. O Facebook enviará o SMS para o número do PDF.',
            },
        ],
    },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
    {
        q: 'Preciso usar algum programa externo para editar o PDF?',
        a: 'Não! O VerifyAds gera o PDF já com os dados que você editou no Dossiê Empresarial. Basta colocar seu número de telefone no campo "Editar Informações", clicar em "GERAR PDF" e o sistema cria o arquivo pronto para download — sem precisar de ILovePDF, Adobe ou qualquer editor externo.',
    },
    {
        q: 'Onde coloco o número do meu celular para receber o SMS do Facebook?',
        a: 'No Dossiê Empresarial (Minerar → clique em uma empresa), na seção "EDITAR INFORMAÇÕES", há um campo de telefone. Substitua o número original da empresa pelo seu celular. Quando você gerar o PDF, esse número já estará no documento. O Facebook enviará o SMS de verificação para esse número.',
    },
    {
        q: 'O site da empresa é criado automaticamente pelo VerifyAds?',
        a: 'Sim! Após conectar seu domínio e clicar em "GERAR LINK & SALVAR" no Dossiê, o VerifyAds cria e publica automaticamente a landing page da empresa no seu domínio — com nome, CNPJ, endereço e dados verificados pela Receita Federal. Não é preciso criar o site manualmente.',
    },
    {
        q: 'Onde coloco o token do Facebook no VerifyAds?',
        a: 'No Dossiê Empresarial (Minerar → clique na empresa), na seção "VERIFICAÇÃO FACEBOOK", campo "Token Meta-tag". Cole o código completo que o Facebook gerou (ex: <meta name="facebook-domain-verification" content="TOKEN">). O sistema extrai o token automaticamente e o insere no HTML da landing page ao clicar em Gerar Link.',
    },
    {
        q: 'Preciso inserir o token antes ou depois de gerar o link?',
        a: 'ANTES. Se você gerar o link sem o token, a landing page será publicada sem ele. Depois precisaria editar o domínio, inserir o token e salvar novamente. Para evitar esse retrabalho, sempre insira o token do Facebook no Dossiê antes de clicar em Gerar Link.',
    },
    {
        q: 'Como confirmo que o token está na landing page?',
        a: 'Acesse seu domínio no navegador → clique com botão direito na página → "Ver código-fonte" (ou pressione Ctrl+U) → use Ctrl+F para buscar "facebook-domain-verification". O seu token deve aparecer no <head> da página.',
    },
    {
        q: 'Por que o Facebook não mostra a opção de verificar empresa?',
        a: 'Contas novas do Meta Business não têm esse recurso automaticamente. O atalho é criar um App em developers.facebook.com → Meus Apps → Criar App → tipo "Negócio". Isso desbloqueia a verificação de empresa no Business Manager em minutos.',
    },
    {
        q: 'Posso usar a mesma empresa em dois domínios?',
        a: 'Não. Cada empresa (CNPJ) é exclusiva — pode ser vinculada a apenas um domínio por vez. Após gerar o link para uma empresa, ela deixa de aparecer na mineração para outros usuários. Essa exclusividade garante que você seja o único com aquele CNPJ verificado.',
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeGuide, setActiveGuide] = useState<string>('minerar');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const currentGuide = guides.find(g => g.id === activeGuide)!;

    const tabLabels: Record<string, string> = {
        minerar: '1. Preparar Empresa',
        pdf: '2. Gerar PDF',
        landingpage: '3. Landing Page',
        facebook: '4. Verificar no Facebook',
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20 text-white" style={{ background: 'transparent', fontFamily: "'Inter', sans-serif" }}>
            <AuroraBackground />
            <div className="max-w-5xl mx-auto">
                <Navigation
                    title="Central de Ajuda"
                    description="Guia completo para verificar sua empresa no Facebook Ads usando o VerifyAds"
                />

                {/* Intro banner */}
                <div className="mt-8 mb-6 rounded-2xl border border-blue-500/20 p-5"
                    style={{ background: 'rgba(59,130,246,0.06)' }}>
                    <p className="text-sm text-blue-300 leading-relaxed">
                        <span className="font-bold text-blue-400">📌 Tudo acontece dentro do VerifyAds:</span>{' '}
                        edite o telefone, gere o PDF, crie o site da empresa e injete o token do Facebook — sem precisar de nenhuma ferramenta externa.
                        Siga os 4 passos abaixo em ordem.
                    </p>
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 mb-8 flex-wrap">
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
                            {tabLabels[guide.id]}
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
                        <div className="space-y-4 mb-8">
                            {currentGuide.steps.map((step, idx) => (
                                <StepCard
                                    key={idx}
                                    number={idx + 1}
                                    step={step}
                                    accentColor={currentGuide.color}
                                    isLast={idx === currentGuide.steps.length - 1}
                                />
                            ))}
                        </div>

                        {/* Extra tip blocks */}
                        {currentGuide.extra && (
                            <div className="space-y-4">
                                {currentGuide.extra.map((block, idx) => (
                                    <TipCard key={idx} block={block} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Quick Tips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                    {[
                        { icon: <Zap className="w-5 h-5" />, title: 'Edite antes de gerar', body: 'Coloque seu telefone e o token do Facebook no Dossiê ANTES de clicar em Gerar PDF ou Gerar Link.', color: '#f59e0b' },
                        { icon: <Shield className="w-5 h-5" />, title: 'CNPJ exclusivo', body: 'Assim que vincular uma empresa a um domínio, ela sai da mineração para todos. Exclusividade garantida.', color: '#3b82f6' },
                        { icon: <BookOpen className="w-5 h-5" />, title: 'Conta nova no Facebook?', body: 'Crie um App em developers.facebook.com para desbloquear a opção de verificar empresa no Business Manager.', color: '#8b5cf6' },
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

function StepCard({ number, step, accentColor, isLast }: {
    number: number; step: Step; accentColor: string; isLast: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: number * 0.06 }}
            className="flex gap-4"
        >
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

            <div className="flex-1 pb-6">
                <div
                    className="rounded-xl p-5 border transition-all duration-200"
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
                            <span className="break-all">{step.hint}</span>
                        </div>
                    )}
                    {step.hintType === 'info' && step.hint && (
                        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs text-blue-300 border border-blue-500/20"
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

// ─── Tip Card ─────────────────────────────────────────────────────────────────

function TipCard({ block }: { block: TipBlock }) {
    const styles = {
        tip: {
            border: 'border-yellow-500/25',
            bg: 'rgba(234,179,8,0.07)',
            icon: <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />,
            titleColor: 'text-yellow-300',
        },
        warning: {
            border: 'border-orange-500/25',
            bg: 'rgba(249,115,22,0.07)',
            icon: <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />,
            titleColor: 'text-orange-300',
        },
        info: {
            border: 'border-blue-500/25',
            bg: 'rgba(59,130,246,0.07)',
            icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
            titleColor: 'text-blue-300',
        },
    };
    const s = styles[block.type];
    return (
        <div className={`rounded-xl border ${s.border} p-5 flex gap-4`} style={{ background: s.bg }}>
            {s.icon}
            <div>
                <p className={`font-bold text-sm mb-1.5 ${s.titleColor}`}>{block.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{block.body}</p>
            </div>
        </div>
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
            <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
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
