'use client';

import { ShieldCheck } from 'lucide-react';

interface FooterProps {
    companyName: string;
    cnpj: string;
    address: string;
}

export default function Footer({ companyName, cnpj, address }: FooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-white text-lg font-bold mb-4">{companyName}</h3>
                        <p className="text-sm text-slate-400 mb-4 max-w-sm">
                            Empresa comprometida com a transparência e qualidade. Todos os dados exibidos nesta página são públicos e foram verificados.
                        </p>
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <ShieldCheck size={16} />
                            CNPJ Verificado e Ativo
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Institucional</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#hero" className="hover:text-white transition-colors">Início</a></li>
                            <li><a href="#sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
                            <li><a href="#dados" className="hover:text-white transition-colors">Dados da Empresa</a></li>
                            <li><a href="#contato" className="hover:text-white transition-colors">Fale Conosco</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
                            </li>
                            <li>
                                <a href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 mt-8 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p>© {currentYear} {companyName}. Todos os direitos reservados.</p>
                        <p className="mt-1">CNPJ: {cnpj}</p>
                        <p className="mt-1">{address}</p>
                    </div>
                    <div className="max-w-md text-center md:text-right opacity-60">
                        <p>
                            Este site não faz parte do site do Facebook ou Facebook Inc. Além disso, este site NÃO é endossado pelo Facebook de nenhuma maneira. FACEBOOK é uma marca comercial da FACEBOOK, Inc.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
