import { Lock } from 'lucide-react';
import Link from 'next/link';

export default function PrivacidadePage() {
    return (
        <main className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-center mb-10">
                    <Lock className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-900">Política de Privacidade</h1>
                    <p className="text-slate-500 mt-2">Última atualização: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600">
                    <h3>1. Coleta de Informações</h3>
                    <p>
                        Respeitamos a sua privacidade. Este site pode coletar informações de duas formas:
                    </p>
                    <ul>
                        <li>**Informações fornecidas por você:** Nome, e-mail, telefone ou outras informações ao preencher formulários de contato.</li>
                        <li>**Informações automáticas:** Cookies, endereço IP, tipo de navegador e dados de navegação para fins estatísticos e de segurança.</li>
                    </ul>

                    <h3>2. Uso das Informações</h3>
                    <p>
                        As informações coletadas são utilizadas para:
                    </p>
                    <ul>
                        <li>Responder às suas solicitações e dúvidas;</li>
                        <li>Melhorar a experiência do usuário em nosso site;</li>
                        <li>Enviar comunicações sobre produtos, promoções ou atualizações, caso autorizado;</li>
                        <li>Cumprir obrigações legais.</li>
                    </ul>

                    <h3>3. Cookies e Tecnologias de Rastreamento</h3>
                    <p>
                        Utilizamos cookies para personalizar conteúdo e anúncios, fornecer recursos de mídia social e analisar nosso tráfego. Você pode configurar seu navegador para recusar cookies, mas isso pode limitar algumas funcionalidades do site.
                        <br />
                        Nossos parceiros de publicidade e análise (como Google e Facebook) também podem coletar dados sobre sua visita.
                    </p>

                    <h3>4. Compartilhamento de Dados</h3>
                    <p>
                        Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros não autorizados. Podemos compartilhar dados com fornecedores de serviços confiáveis que nos auxiliam na operação do site, desde que concordem em manter essas informações confidenciais.
                    </p>

                    <h3>5. Segurança</h3>
                    <p>
                        Implementamos diversas medidas de segurança para proteger suas informações pessoais. No entanto, nenhum método de transmissão pela internet é 100% seguro.
                    </p>

                    <h3>6. Seus Direitos (LGPD)</h3>
                    <p>
                        Você tem o direito de solicitar o acesso, correção ou exclusão de seus dados pessoais. Para exercer esses direitos, entre em contato conosco através dos canais disponíveis no site.
                    </p>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        &larr; Voltar para a Página Inicial
                    </Link>
                </div>
            </div>
        </main>
    );
}
