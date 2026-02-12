import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function TermosPage() {
    return (
        <main className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-center mb-10">
                    <ShieldAlert className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-900">Termos de Uso</h1>
                    <p className="text-slate-500 mt-2">Última atualização: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600">
                    <h3>1. Aceitação dos Termos</h3>
                    <p>
                        Ao acessar e utilizar este site, você concorda expressamente com os presentes Termos de Uso. Caso não concorde com qualquer termo aqui estipulado, pedimos que não utilize nossos serviços.
                    </p>

                    <h3>2. Natureza Informativa e Comercial</h3>
                    <p>
                        Este site tem como objetivo apresentar informações institucionais sobre a empresa e seus serviços/produtos. Todas as informações são fornecidas "como estão" e podem ser alteradas sem aviso prévio. A empresa envida esforços para manter os dados atualizados, mas não garante a precisão absoluta em tempo real.
                    </p>

                    <h3>3. Propriedade Intelectual</h3>
                    <p>
                        Todo o conteúdo deste site, incluindo textos, logotipos, imagens e design, é de propriedade exclusiva da empresa ou de seus licenciadores, sendo protegido pelas leis de direitos autorais e propriedade industrial vigentes. É vedada a reprodução total ou parcial sem autorização prévia.
                    </p>

                    <h3>4. Uso Aceitável</h3>
                    <p>
                        O usuário compromete-se a:
                    </p>
                    <ul>
                        <li>Não utilizar o site para fins ilegais ou não autorizados;</li>
                        <li>Não tentar violar a segurança do site ou acessar áreas restritas;</li>
                        <li>Não utilizar bots ou sistemas automatizados de extração de dados.</li>
                    </ul>

                    <h3>5. Limitação de Responsabilidade</h3>
                    <p>
                        Em nenhuma circunstância a empresa será responsável por danos indiretos, incidentais ou consequentes decorrentes do uso ou da incapacidade de uso deste site.
                    </p>

                    <h3>6. Alterações</h3>
                    <p>
                        Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo do site após tais alterações constitui aceitação dos novos termos.
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
