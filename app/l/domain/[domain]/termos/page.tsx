import Link from 'next/link';
import { FileText, ArrowLeft, Mail, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { getCompanyLandingData } from '@/lib/landing/company-landing-data';

interface Props {
    params: Promise<{ domain: string }>;
}

export default async function DomainTermosPage({ params }: Props) {
    const { domain } = await params;
    const company = await getCompanyLandingData(domain);

    const displayName = company?.cleanDisplayName || 'Empresa';
    const razaoSocial = company?.razaoSocial || displayName;
    const cnpj = company?.formattedCNPJ || '';
    const address = company?.fullAddress || 'Endereço registrado na Receita Federal';
    const email = company?.contactEmail || `contato@${domain}`;
    const municipio = company?.municipio || 'Brasil';
    const uf = company?.uf || 'BR';

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-slate-800/90 border border-slate-700 p-8 sm:p-12 rounded-3xl shadow-2xl backdrop-blur-sm">
                
                {/* Header */}
                <div className="text-center mb-12 border-b border-slate-700 pb-8">
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                        Termos e Condições Legais
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                        Termos de Uso do Website
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm sm:text-base">
                        {razaoSocial} {cnpj ? `• CNPJ: ${cnpj}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Regulamento de utilização do portal institucional e serviços informativos
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            1. Aceitação dos Termos
                        </h2>
                        <p>
                            Ao acessar e navegar pelo portal oficial da <strong>{razaoSocial}</strong>{cnpj ? ` (CNPJ: ${cnpj})` : ''}, com sede em <strong>{address}</strong>, o usuário expressa sua integral concordância e adesão às cláusulas, termos e condições aqui estabelecidos, bem como a todas as leis e normas aplicáveis no ordenamento jurídico brasileiro.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            2. Finalidade e Conteúdo do Portal
                        </h2>
                        <p>
                            Este website destina-se à apresentação institucional das atividades comerciais, soluções, portfólio e canais de comunicação da <strong>{razaoSocial}</strong>. As informações veiculadas buscam refletir com exatidão e transparência a situação cadastral ativa e a atuação profissional da empresa.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            3. Propriedade Intelectual e Uso Autorizado
                        </h2>
                        <p>
                            Todos os elementos deste website, incluindo marcas, logotipos, textos, layouts, códigos-fonte e materiais gráficos são de titularidade da <strong>{razaoSocial}</strong> ou utilizados sob licença expressa. É expressamente vedada a reprodução, alteração, distribuição pública ou comercialização de qualquer elemento sem autorização prévia e por escrito.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            4. Conduta do Usuário
                        </h2>
                        <p className="mb-3">
                            O usuário compromete-se a utilizar o website de maneira idônea e compatível com a legislação vigente, abstendo-se de:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-slate-300">
                            <li>Praticar atos ilícitos ou que violem direitos da empresa ou de terceiros;</li>
                            <li>Tentar violar os mecanismos de segurança ou infraestrutura do portal;</li>
                            <li>Disseminar vírus, códigos maliciosos ou praticar engenharia reversa;</li>
                            <li>Fornecer dados falsos nos formulários de contato e atendimento.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            5. Limitação de Responsabilidade
                        </h2>
                        <p>
                            A <strong>{razaoSocial}</strong> empenha seus melhores esforços para assegurar que a plataforma opere de forma contínua e segura. Todavia, não se responsabiliza por eventuais instabilidades temporárias decorrentes de fatores externos de rede ou manutenção técnica em provedores de infraestrutura global.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">
                            6. Foro de Eleição e Legislação Aplicável
                        </h2>
                        <p>
                            Os presentes Termos de Uso são regidos e interpretados em conformidade com as leis da República Federativa do Brasil. Para dirimir quaisquer litígios ou controvérsias oriundas deste documento, fica eleito o Foro da Comarca de <strong>{municipio} - {uf}</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                        </p>
                    </section>

                    <section className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-400" />
                            7. Dúvidas e Atendimento
                        </h2>
                        <div className="space-y-2 text-sm text-slate-300">
                            <p className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-500" />
                                <strong>Empresa:</strong> {razaoSocial}
                            </p>
                            <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <strong>Endereço:</strong> {address}
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <strong>E-mail:</strong>{' '}
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
