import Link from 'next/link';
import { Lock, ShieldCheck, ArrowLeft, Mail, MapPin, Building2 } from 'lucide-react';
import { getCompanyLandingData } from '@/lib/landing/company-landing-data';

interface Props {
    params: Promise<{ domain: string }>;
}

export default async function DomainPrivacidadePage({ params }: Props) {
    const { domain } = await params;
    const company = await getCompanyLandingData(domain);

    const displayName = company?.cleanDisplayName || 'Empresa';
    const razaoSocial = company?.razaoSocial || displayName;
    const cnpj = company?.formattedCNPJ || '';
    const address = company?.fullAddress || 'Endereço registrado na Receita Federal';
    const email = company?.contactEmail || `contato@${domain}`;

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-slate-800/90 border border-slate-700 p-8 sm:p-12 rounded-3xl shadow-2xl backdrop-blur-sm">
                
                {/* Header */}
                <div className="text-center mb-12 border-b border-slate-700 pb-8">
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                        Segurança & Conformidade Legal
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                        Política de Privacidade
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm sm:text-base">
                        {razaoSocial} {cnpj ? `• CNPJ: ${cnpj}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Atualizado em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            1. Informações Gerais e Compromisso
                        </h2>
                        <p>
                            A <strong>{razaoSocial}</strong>{cnpj ? `, inscrita no CNPJ sob o nº ${cnpj}` : ''}, com sede em <strong>{address}</strong>, valoriza a privacidade e a proteção dos dados pessoais de seus clientes, usuários e parceiros comerciais. Esta Política de Privacidade estabelece as diretrizes de coleta, uso, armazenamento e proteção de informações obtidas por meio deste portal oficial e de suas plataformas correlatas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            2. Dados Pessoais Coletados
                        </h2>
                        <p className="mb-3">
                            Podemos coletar e processar os seguintes tipos de informações:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300">
                            <li>
                                <strong>Dados fornecidos voluntariamente:</strong> Nome completo, endereço de e-mail, número de telefone com DDD e mensagens encaminhadas por meio de formulários de contato ou canais de atendimento direto.
                            </li>
                            <li>
                                <strong>Dados de navegação e telemetria:</strong> Endereço IP, data e hora de acesso, tipo de navegador, sistema operacional e páginas consultadas, utilizados exclusivamente para segurança, auditoria e aprimoramento da estabilidade do site.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            3. Finalidade do Tratamento de Dados
                        </h2>
                        <p className="mb-3">
                            Os dados pessoais coletados são utilizados estritamente para as seguintes finalidades legítimas:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300">
                            <li>Atendimento a solicitações comerciais, orçamentos e suporte técnico;</li>
                            <li>Cumprimento de obrigações legais, fiscais e regulatórias perante órgãos governamentais;</li>
                            <li>Garantia da segurança da informação e prevenção a fraudes eletrônicas;</li>
                            <li>Melhoria contínua da usabilidade e desempenho dos serviços prestados.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            4. Cookies e Tecnologias de Rastreamento (Meta Pixel e Analytics)
                        </h2>
                        <p>
                            Utilizamos cookies essenciais para o correto funcionamento da plataforma e tecnologias de análise e publicidade (incluindo o Meta Pixel e ferramentas analíticas). Essas ferramentas permitem mensurar a eficácia de nossas campanhas de comunicação institucional e personalizar o conteúdo exibido aos visitantes. O usuário possui total autonomia para gerenciar e desativar cookies nas configurações de seu navegador de internet a qualquer momento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            5. Compartilhamento de Dados com Terceiros
                        </h2>
                        <p>
                            A <strong>{razaoSocial}</strong> não comercializa, aluga ou cede dados pessoais a terceiros sob nenhuma hipótese. O compartilhamento ocorre exclusivamente com prestadores de serviços de infraestrutura de tecnologia (hospedagem em nuvem, servidores de e-mail seguros e processadores de formulários) sob estritos acordos de sigilo e confidencialidade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            6. Direitos do Titular de Dados (Art. 18 da LGPD)
                        </h2>
                        <p className="mb-3">
                            Em conformidade com a legislação brasileira, garantimos ao titular dos dados os seguintes direitos:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-slate-300">
                            <li>Confirmação da existência de tratamento;</li>
                            <li>Acesso facilitado e gratuito aos dados armazenados;</li>
                            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                            <li>Eliminação de dados pessoais tratados com consentimento prévio.</li>
                        </ul>
                    </section>

                    <section className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-400" />
                            7. Encarregado pelo Tratamento de Dados (DPO) e Contato
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Para exercer qualquer um de seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato diretamente com nosso canal de privacidade:
                        </p>
                        <div className="space-y-2 text-sm text-slate-300">
                            <p className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-500" />
                                <strong>Entidade:</strong> {razaoSocial}
                            </p>
                            <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <strong>Endereço:</strong> {address}
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <strong>E-mail de Contato:</strong>{' '}
                                <a href={`mailto:${email}`} className="text-blue-400 hover:underline">
                                    {email}
                                </a>
                            </p>
                        </div>
                    </section>
                </div>

                {/* Return button */}
                <div className="mt-12 pt-8 border-t border-slate-700 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para a Página Inicial
                    </Link>
                </div>
            </div>
        </main>
    );
}
