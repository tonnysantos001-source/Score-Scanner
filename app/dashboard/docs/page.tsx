'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/dashboard/Navigation';
import { FileText, Facebook, CheckCircle, ArrowRight, Smartphone, Globe } from 'lucide-react';

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <Navigation
                    title="Central de Ajuda"
                    description="Manuais e tutoriais passo-a-passo para utilizar a ferramenta"
                />

                <div className="space-y-12">

                    {/* Seção 1: Verificação Facebook */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-lg bg-blue-600/20">
                                <Facebook className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold">Como Verificar seu Domínio no Facebook Ads</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StepCard
                                number={1}
                                title="Acesse o Gerenciador de Negócios"
                                description="Vá em Configurações do Negócio > Segurança da Marca > Domínios."
                            >
                                <div className="bg-gray-800 p-4 rounded-lg text-xs font-mono text-gray-400">
                                    Menu Lateral &gt; Segurança da Marca &gt; Domínios
                                </div>
                            </StepCard>

                            <StepCard
                                number={2}
                                title="Adicione o Domínio"
                                description="Clique em 'Adicionar', selecione 'Criar um novo domínio' e cole o link da sua Landing Page gerada aqui no sistema."
                            >
                                <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded text-sm mb-2">
                                    💡 Use o link sem 'http://' ou 'https://'. Ex: <strong>seudominio.com</strong>
                                </div>
                            </StepCard>

                            <StepCard
                                number={3}
                                title="Copie a Meta-tag"
                                description='Selecione a opção "Adicione uma meta-tag ao seu código-fonte HTML". Copie o código que começa com <meta name="facebook-domain-verification"... />'
                            >
                                <div className="bg-gray-800 p-3 rounded border-l-4 border-green-500 font-mono text-xs overflow-x-auto text-green-400">
                                    &lt;meta name="facebook-domain-verification" content="TOKEN" /&gt;
                                </div>
                            </StepCard>

                            <StepCard
                                number={4}
                                title="Cole no Score Scanner"
                                description="Volte aqui no sistema, encontre seu domínio, clique em Editar (lápis) e cole o código no campo 'Token de Verificação'. Salve e Injete."
                            />

                            <StepCard
                                number={5}
                                title="Verifique no Facebook"
                                description="Volte ao Facebook e clique no botão verde 'Verificar Domínio'. Pronto! Deve ficar verificado em segundos."
                            >
                                <div className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 p-2 rounded w-fit">
                                    <CheckCircle className="w-4 h-4" /> Verificado
                                </div>
                            </StepCard>
                        </div>
                    </section>

                    <div className="h-px bg-[var(--color-border)] w-full" />

                    {/* Seção 2: PDF e SMS */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-lg bg-red-600/20">
                                <FileText className="w-6 h-6 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold">Como Editar o PDF para receber SMS</h2>
                        </div>

                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 mb-6">
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                Nossos PDFs de comprovante de residência são gerados de forma editável. Isso permite que você adicione seu próprio número de telefone se precisar receber um SMS de confirmação do Facebook.
                            </p>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                    <div>
                                        <h3 className="font-bold mb-1">Baixe o PDF Gerado</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">Após encontrar um CNPJ e gerar o comprovante, faça o download do arquivo.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                    <div>
                                        <h3 className="font-bold mb-1">Abra em um Editor de PDF</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">Recomendamos usar o Adobe Acrobat, Foxit Reader ou até sites online como ILovePDF (Editor).</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center font-bold text-sm shrink-0">3</div>
                                    <div>
                                        <h3 className="font-bold mb-1">Adicione seu Telefone</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Use a ferramenta de "Texto" ou "Editar Conteúdo" para substituir ou adicionar um campo de telefone no cabeçalho ou rodapé, conforme o modelo da conta de luz/água exige.
                                        </p>
                                        <div className="mt-2 text-xs bg-yellow-500/10 text-yellow-200 p-2 rounded border border-yellow-500/20 inline-flex items-center gap-2">
                                            <Smartphone className="w-3 h-3" />
                                            Dica: Mantenha a mesma fonte e tamanho para parecer original.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

function StepCard({ number, title, description, children }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl hover:border-blue-500/30 transition-colors"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-blue-900/50">
                    {number}
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
                {description}
            </p>
            {children}
        </motion.div>
    );
}
