'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/dashboard/Navigation';
import AuroraBackground from '@/components/layout/AuroraBackground';
import {
    Facebook, FileText, Globe, Shield, ChevronDown,
    CheckCircle, Terminal,
    BookOpen, Zap, HelpCircle,
    Info, AlertCircle, Lightbulb, Key, Smartphone,
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
        id: 'facebook',
        icon: <Facebook className="w-5 h-5" />,
        color: '#3b82f6',
        badge: 'Etapa 1 — Meta Business',
        title: 'Verificar Empresa no Facebook Ads',
        subtitle: 'Acesse o Gerenciador de Empresas do Facebook e complete o processo de verificação do seu negócio.',
        steps: [
            {
                title: 'Acesse o Gerenciador de Empresas do Facebook',
                description: 'Abra o navegador e acesse business.facebook.com. Faça login com sua conta do Facebook pessoal (que deve ser administradora de uma Página Comercial). Se não tiver um negócio criado, clique em "Criar Conta" e preencha os dados da sua empresa.',
                hint: 'Acesse: business.facebook.com → Fazer Login',
                hintType: 'code',
            },
            {
                title: 'Vá em Configurações do Negócio',
                description: 'No painel principal do Meta Business Suite, clique no ícone de engrenagem ⚙️ no canto inferior esquerdo (ou clique no menu hambúrguer ☰ e selecione "Configurações do Negócio"). Uma nova tela será aberta com todas as configurações.',
                hint: 'Menu lateral esquerdo → Configurações do Negócio (ícone de engrenagem)',
                hintType: 'code',
            },
            {
                title: 'Encontre "Central de Segurança" ou "Verificação do Negócio"',
                description: 'Na barra lateral esquerda das Configurações do Negócio, procure por "Central de Segurança" ou role até encontrar "Verificação do Negócio". Clique nela. Será exibido o status atual da sua conta — se ainda não verificada, aparecerá o botão "Iniciar verificação".',
                hint: 'Configurações do Negócio → Central de Segurança → Verificação do Negócio',
                hintType: 'code',
            },
            {
                title: 'Escolha o método: "Verificar pelo site" (Meta-tag)',
                description: 'O Facebook oferece múltiplos métodos de verificação. Para usar o VerifyAds, selecione "Confirmação do domínio" ou o método via meta-tag HTML. O Facebook irá gerar um código único para você — algo como: <meta name="facebook-domain-verification" content="SEUTOKEN">. Copie TODO esse código.',
                hint: '<meta name="facebook-domain-verification" content="abc123xyz..." />',
                hintType: 'code',
            },
            {
                title: 'Copie o Token e Cole no VerifyAds',
                description: 'Volte ao VerifyAds. Vá em Minerar → encontre uma empresa → clique nela para abrir o Dossiê → No campo "Verificação Facebook", cole o código completo da meta-tag (pode colar o código inteiro, o sistema extrai o token automaticamente). Em seguida, selecione o domínio e clique em "SALVAR & INJETAR CÓDIGO". O token será automaticamente inserido no HTML da sua landing page.',
                hint: '⚠️ IMPORTANTE: Cole o token ANTES de gerar o link. Assim o código será inserido na página no momento certo.',
                hintType: 'warning',
            },
            {
                title: 'Volte ao Facebook e clique em "Verificar Domínio"',
                description: 'Depois que o link for gerado no VerifyAds, volte ao painel do Facebook → Configurações do Negócio → Segurança da Marca → Domínios. Adicione o domínio da sua landing page (sem https://) e clique em "Verificar". O Facebook irá acessar sua página e ler a meta-tag automaticamente.',
                hint: 'Domínio verificado com sucesso! O Facebook confirma em segundos.',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'tip',
                title: '🔓 Facebook não mostra a opção "Verificar Empresa"?',
                body: 'Contas novas do Facebook Business frequentemente NÃO mostram a opção de "Verificação do Negócio" porque a conta ainda não tem histórico suficiente. O atalho mais rápido é: crie um Aplicativo Facebook (acesse developers.facebook.com → Meus Apps → Criar App → selecione "Outro" → escolha "Negócio"). Ao criar o app e vinculá-lo ao seu Business Manager, o Facebook normalmente libera a opção de verificação de empresa em minutos a horas. Após ver a opção, delete o app se quiser (a verificação permanece).',
            },
            {
                type: 'info',
                title: '🔵 Dica alternativa: use a verificação via DNS',
                body: 'Se não conseguir pelo método de meta-tag, o Facebook também aceita verificação por registro DNS TXT. No seu provedor de domínio (Cloudflare, GoDaddy, etc.), adicione um registro TXT com o valor fornecido pelo Facebook. Funciona mesmo sem a landing page.',
            },
        ],
    },
    {
        id: 'pdf',
        icon: <FileText className="w-5 h-5" />,
        color: '#f59e0b',
        badge: 'Etapa 2 — PDF & SMS',
        title: 'Usar o PDF para Verificação por SMS',
        subtitle: 'O Facebook pode pedir confirmação por SMS. Entenda como funciona e como trocar o CNPJ para receber o código no seu número.',
        steps: [
            {
                title: 'Entenda o processo de SMS do Facebook',
                description: 'Durante a verificação do negócio, o Facebook pode solicitar confirmação de identidade. Uma das opções é confirmar pelo número de telefone associado ao CNPJ — o Facebook envia um SMS com um código para esse número. O comprovante gerado pelo VerifyAds usa dados reais da Receita Federal, incluindo um número de contato.',
                hint: 'O Facebook envia um SMS para o número que aparece no documento que você enviar.',
                hintType: 'info',
            },
            {
                title: 'Gere o PDF da empresa no VerifyAds',
                description: 'Na página Minerar CNPJ, pesquise empresas usando os filtros de cidade e CNAE. Quando encontrar uma empresa com situação "ATIVA", clique nela para abrir o Dossiê Empresarial. Em seguida, clique no botão vermelho "GERAR PDF" no rodapé do modal. O PDF abrirá em uma nova aba.',
                hint: 'Use Ctrl+S (ou Cmd+S no Mac) para salvar o PDF no seu computador.',
                hintType: 'code',
            },
            {
                title: '⚠️ Troque o CNPJ pelo seu número de telefone para receber o SMS',
                description: 'ATENÇÃO: O número de telefone que aparece no PDF é o da empresa na Receita Federal. Para receber o SMS de verificação no SEU número, você precisa editar o PDF e substituir o telefone pelo seu. Abra o PDF em um editor (recomendamos ILovePDF.com — gratuito e online) → clique em "Editar" → use a ferramenta de texto para apagar o número antigo → escreva o seu número de celular no formato (DDD) NNNNN-NNNN.',
                hint: '⚠️ Troque o número do CNPJ pelo seu celular. O SMS do Facebook virá para esse número.',
                hintType: 'warning',
            },
            {
                title: 'Acesse o ILovePDF para editar',
                description: 'Acesse ilovepdf.com no navegador → clique em "Editar PDF" → faça upload do PDF gerado → use a ferramenta de texto (ícone "T") para adicionar ou substituir o telefone → clique em "Editar PDF" para aplicar → baixe o arquivo editado.',
                hint: 'Acesse: ilovepdf.com → Editar PDF → Ferramenta de Texto "T"',
                hintType: 'code',
            },
            {
                title: 'Envie o PDF ao Facebook e aguarde o SMS',
                description: 'No Facebook → Verificação do Negócio → escolha o método "Documento oficial" → faça upload do PDF editado. O Facebook analisará o documento e enviará um SMS com o código de verificação para o número que você colocou no PDF. Insira o código recebido para concluir a verificação.',
                hint: 'SMS recebido! Insira o código de 6 dígitos na tela do Facebook para confirmar.',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'warning',
                title: '⚠️ Dica importante sobre o número de telefone',
                body: 'O número inserido no PDF deve ser um celular brasileiro válido e que você tenha acesso imediato. O SMS do Facebook chega em até 5 minutos. Se não receber, você pode solicitar o reenvio. Números de VoIP ou virtuais podem não receber SMS — use seu celular físico.',
            },
        ],
    },
    {
        id: 'landingpage',
        icon: <Globe className="w-5 h-5" />,
        color: '#8b5cf6',
        badge: 'Etapa 3 — Landing Page',
        title: 'Gerar e Publicar sua Landing Page',
        subtitle: 'Crie a página de verificação da empresa no seu domínio e deixe ela pronta para o Facebook Ads.',
        steps: [
            {
                title: 'Conecte seu domínio no VerifyAds',
                description: 'Antes de gerar a landing page, você precisa de um domínio próprio conectado (ex: minhaempresa.com.br). Acesse Minha Área → aba "Domínios" → clique em "+ Adicionar Domínio". Insira seu domínio SEM https:// e clique em Salvar. O sistema vai exibir o registro DNS que você precisa configurar.',
                hint: 'Minha Área → Domínios → + Adicionar Domínio',
                hintType: 'code',
            },
            {
                title: 'Configure o DNS (CNAME) no seu registrador',
                description: 'Acesse o painel de controle onde você comprou o domínio (ex: Registro.br, GoDaddy, Hostgator, Cloudflare). Vá em "Gerenciar DNS" ou "Zone Editor" e adicione um registro CNAME. O HOST deve ser "@" ou o subdomínio desejado, e o VALOR deve apontar para cname.vercel-dns.com.',
                hint: 'CNAME  →  @  →  cname.vercel-dns.com  (TTL: Auto ou 300)',
                hintType: 'code',
            },
            {
                title: 'Aguarde a propagação e verifique a conexão',
                description: 'A propagação DNS pode levar de 5 minutos a 48 horas (com Cloudflare costuma ser menos de 5 minutos). Após configurar o CNAME, volte ao VerifyAds → Minha Área → Domínios → clique em "Verificar Conexão" no domínio adicionado. Quando aparecer o badge verde "Verificado", seu domínio está pronto.',
                hint: 'Com Cloudflare como nameserver, a propagação costuma ser quase instantânea.',
                hintType: 'info',
            },
            {
                title: 'Cole o Token do Facebook ANTES de gerar o link',
                description: 'Este passo é fundamental! Na tela de Minerar, após encontrar a empresa, clique para abrir o Dossiê. No campo "Verificação Facebook" → "Token Meta-tag", cole o código que o Facebook gerou para você (ex: <meta name="facebook-domain-verification" content="abc123">). O sistema extrai o token automaticamente. Faça isso ANTES de clicar em Gerar Link.',
                hint: '⚠️ Se gerar o link sem o token, o Facebook não conseguirá verificar o domínio. Cole o token primeiro!',
                hintType: 'warning',
            },
            {
                title: 'Selecione o domínio e gere o link',
                description: 'No Dossiê Empresarial (modal após clicar na empresa), na coluna direita "Página White Label", selecione o domínio que você conectou no passo 1 no menu suspenso. Em seguida, clique em "SALVAR & INJETAR CÓDIGO" (ou "GERAR LINK & SALVAR"). O sistema cria a landing page com os dados da empresa e o token do Facebook embutido no HTML.',
                hint: 'Sua landing page será publicada em: https://seudominio.com',
                hintType: 'code',
            },
            {
                title: 'Verifique a landing page no navegador',
                description: 'Abra uma nova aba e acesse o link do seu domínio (ex: https://seudominio.com.br). Você verá a página da empresa com nome, CNPJ, endereço e dados verificados pela Receita Federal. Se quiser confirmar que o token do Facebook está embutido, clique com botão direito na página → "Exibir código-fonte da página" → pressione Ctrl+F e busque por "facebook-domain-verification".',
                hint: 'Ctrl+F na página → busque "facebook-domain-verification" → deve aparecer seu token.',
                hintType: 'code',
            },
            {
                title: 'Adicione o domínio no Facebook e verifique',
                description: 'Com a landing page publicada e o token embutido, vá ao Facebook → Configurações do Negócio → Segurança da Marca → Domínios → clique em "+ Adicionar" → insira seu domínio (sem https://) → clique em "Verificar Domínio". O Facebook acessará sua página, lerá a meta-tag e confirmará a verificação em segundos.',
                hint: '✅ Domínio verificado! Agora você pode usar o domínio em campanhas do Facebook Ads.',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'tip',
                title: '💡 Dica: Confira o token na página gerada',
                body: 'Após gerar o link, acesse seu domínio no navegador, clique com botão direito → Ver Código-fonte (Ctrl+U). Pressione Ctrl+F e pesquise por "facebook-domain-verification". Você deve encontrar a linha com seu token. Se não encontrar, edite o domínio no VerifyAds, adicione o token e salve novamente.',
            },
        ],
    },
    {
        id: 'token',
        icon: <Key className="w-5 h-5" />,
        color: '#10b981',
        badge: 'Etapa 4 — Token Facebook',
        title: 'Como Obter o Token de Verificação do Facebook',
        subtitle: 'Passo a passo detalhado para encontrar e copiar o token correto no Meta Business Manager.',
        steps: [
            {
                title: 'Acesse o Meta Business Suite',
                description: 'Abra o navegador e acesse business.facebook.com. Faça login com sua conta do Facebook. Na tela inicial do Meta Business Suite, você verá o painel geral com suas páginas e ativos.',
                hint: 'business.facebook.com → Entrar',
                hintType: 'code',
            },
            {
                title: 'Vá em Configurações do Negócio',
                description: 'No canto inferior esquerdo do painel, clique no ícone de Configurações (⚙️ engrenagem). Isso abrirá a tela "Configurações do Negócio" com todas as opções administrativas.',
                hint: 'Ícone ⚙️ no canto inferior esquerdo → Configurações do Negócio',
                hintType: 'code',
            },
            {
                title: 'Acesse Segurança da Marca → Domínios',
                description: 'Na barra lateral esquerda das Configurações do Negócio, role para baixo até encontrar "Segurança da Marca". Clique em "Domínios" abaixo dessa opção. Você verá uma lista de domínios já adicionados (ou vazia se for a primeira vez).',
                hint: 'Configurações do Negócio → Segurança da Marca → Domínios',
                hintType: 'code',
            },
            {
                title: 'Adicione um novo domínio',
                description: 'Clique no botão "+ Adicionar" no canto superior esquerdo da lista de domínios. Uma janela pop-up será aberta pedindo o endereço do domínio. Digite seu domínio SEM "https://" e SEM barras. Exemplo: seudominio.com.br. Clique em "Adicionar Domínio".',
                hint: 'Digite apenas o domínio, sem https:// Ex: meusite.com.br',
                hintType: 'info',
            },
            {
                title: 'Escolha o método "Meta-tag HTML"',
                description: 'Após adicionar o domínio, o Facebook vai pedir que você escolha como quer verificar. Clique na opção "Adicione uma meta-tag ao código-fonte HTML do seu site". O Facebook vai gerar um código único para você, parecido com: <meta name="facebook-domain-verification" content="TOKEN_AQUI" />',
                hint: '<meta name="facebook-domain-verification" content="abc123xyz789..." />',
                hintType: 'code',
            },
            {
                title: 'COPIE o token e cole no VerifyAds',
                description: 'Copie TODO o código da meta-tag mostrado pelo Facebook (incluindo as tags <meta .../>). Volte ao VerifyAds, abra o Dossiê da empresa que deseja, e cole no campo "Token Meta-tag" da seção "Verificação Facebook". O sistema vai extrair automaticamente apenas o valor do "content". DEPOIS clique em "SALVAR & INJETAR CÓDIGO".',
                hint: '⚠️ Não feche a aba do Facebook! Você precisará voltar para clicar em Verificar.',
                hintType: 'warning',
            },
            {
                title: 'Volte ao Facebook e clique em Verificar Domínio',
                description: 'Com a landing page publicada e o token embutido, volte à aba do Facebook → Domínios → clique em "Verificar Domínio" ao lado do seu domínio. O Facebook vai acessar sua página e ler a meta-tag. Em alguns segundos aparecerá "Domínio verificado" com um ícone verde.',
                hint: '✅ Domínio verificado com sucesso no Facebook!',
                hintType: 'success',
            },
        ],
        extra: [
            {
                type: 'tip',
                title: '🔓 Facebook novo não mostra a opção "Verificar Domínio"?',
                body: 'Contas novas do Meta Business frequentemente não exibem a seção "Segurança da Marca → Domínios". Para desbloquear: acesse developers.facebook.com → clique em "Meus Apps" → "Criar App" → selecione "Outro" → avance para o tipo "Negócio" → preencha um nome qualquer → clique em "Criar App". Ao vincular o app ao seu Business Manager, o Facebook normalmente libera a opção de verificação de domínio em minutos. Após ver a opção desbloqueada, você pode excluir o app.',
            },
            {
                type: 'info',
                title: '📋 Alternativa: Verificação por DNS TXT',
                body: 'Se preferir não usar meta-tag, o Facebook também aceita verificação por registro DNS TXT. No painel do domínio (Cloudflare, etc.), adicione um registro TXT com o nome @ e o valor fornecido pelo Facebook. Funciona bem mesmo sem landing page publicada.',
            },
        ],
    },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
    {
        q: 'Por que o Facebook não mostra a opção de verificar empresa?',
        a: 'Contas novas do Meta Business não têm esse recurso liberado automaticamente. O atalho mais eficiente é criar um Aplicativo Facebook em developers.facebook.com → Meus Apps → Criar App → tipo "Negócio". Isso normalmente desbloqueia a verificação de empresa no Business Manager em minutos.',
    },
    {
        q: 'Onde exatamente eu coloco o token do Facebook no VerifyAds?',
        a: 'Na página Minerar, clique em uma empresa para abrir o Dossiê. No modal, na coluna do meio, tem a seção "Verificação Facebook" com o campo "Token Meta-tag". Cole lá o código completo da meta-tag (o sistema extrai o token sozinho). Cole ANTES de gerar o link.',
    },
    {
        q: 'Como confirmo que o token está na landing page gerada?',
        a: 'Abra seu domínio no navegador, clique com botão direito → "Exibir código-fonte da página" (ou pressione Ctrl+U). Use Ctrl+F para buscar por "facebook-domain-verification". Você deve encontrar a linha com seu token no <head> da página.',
    },
    {
        q: 'Para que serve trocar o CNPJ pelo meu número no PDF?',
        a: 'O Facebook usa o PDF para confirmar que você é dono do negócio. Ele pode enviar um SMS com código de verificação para o telefone que aparece no documento. Como o número original é da empresa na Receita Federal, você precisa substituir pelo SEU número de celular para receber o SMS.',
    },
    {
        q: 'O que é o ILovePDF e como usar para editar o PDF?',
        a: 'ILovePDF (ilovepdf.com) é um editor de PDF online gratuito. Acesse o site → clique em "Editar PDF" → faça upload do PDF gerado → use a ferramenta "T" de texto para selecionar e substituir o número de telefone → clique em "Editar PDF" → baixe o arquivo editado.',
    },
    {
        q: 'Por que meu domínio não está verificando?',
        a: 'O DNS pode levar até 48h para propagar. Certifique-se de que o registro CNAME está correto e não há registros A ou AAAA conflitando. Verifique também se o token do Facebook foi inserido antes de gerar o link — se não foi, edite o domínio no VerifyAds, adicione o token e salve novamente.',
    },
    {
        q: 'Quanto tempo leva para o Facebook verificar o domínio?',
        a: 'Normalmente segundos, desde que o DNS já tenha propagado e o token esteja corretamente embutido na landing page. O Facebook acessa seu site e lê a meta-tag automaticamente.',
    },
    {
        q: 'Posso usar o mesmo domínio para várias empresas?',
        a: 'Sim, mas o domínio serve como raiz (ex: seudominio.com). No momento, cada domínio hospeda a landing page de uma empresa por vez. Para múltiplas empresas, use múltiplos domínios ou subdomínios.',
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeGuide, setActiveGuide] = useState<string>('facebook');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const currentGuide = guides.find(g => g.id === activeGuide)!;

    const tabLabels: Record<string, string> = {
        facebook: 'Verificar no Facebook',
        pdf: 'PDF & SMS',
        landingpage: 'Landing Page',
        token: 'Obter Token',
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20 text-white" style={{ background: 'transparent', fontFamily: "'Inter', sans-serif" }}>
            <AuroraBackground />
            <div className="max-w-5xl mx-auto">
                <Navigation
                    title="Central de Ajuda"
                    description="Guias completos passo a passo para verificar sua empresa no Facebook Ads"
                />

                {/* Category tabs */}
                <div className="flex gap-2 mb-8 flex-wrap mt-8">
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
                        { icon: <Zap className="w-5 h-5" />, title: 'Cole o token primeiro', body: 'Sempre insira o token do Facebook ANTES de clicar em Gerar Link. Assim ele é embutido automaticamente na página.', color: '#f59e0b' },
                        { icon: <Shield className="w-5 h-5" />, title: 'Troque seu número no PDF', body: 'Substitua o telefone do CNPJ pelo seu celular no PDF para receber o SMS de verificação do Facebook.', color: '#3b82f6' },
                        { icon: <BookOpen className="w-5 h-5" />, title: 'Conta nova? Crie um App', body: 'Se o Facebook não mostrar a opção de verificar empresa, crie um App em developers.facebook.com para desbloquear o recurso.', color: '#8b5cf6' },
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
        <div
            className={`rounded-xl border ${s.border} p-5 flex gap-4`}
            style={{ background: s.bg }}
        >
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
