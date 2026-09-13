'use client';

import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
    companyName: string;
    razaoSocial?: string;
    cnpj: string;
    address: string;
}

export default function Footer({ companyName, razaoSocial, cnpj, address }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const legalName = razaoSocial || companyName;

    return (
        <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                    {/* Col 1 & 2: Institutional */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <h3 className="text-white text-lg font-bold">
                                {companyName}
                            </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                            Portal institucional oficial de <strong>{legalName}</strong>. Atendimento profissional pautado em qualidade, integridade e conformidade jurídica.
                        </p>
                        <div className="text-xs text-slate-400 space-y-1 pt-2">
                            <p className="text-white font-medium">CNPJ: {cnpj}</p>
                            <p>{address}</p>
                        </div>
                    </div>

                    {/* Col 3: Navigation */}
                    <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
                            Navegação
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                            <li><a href="#hero" className="hover:text-white transition-colors">Início</a></li>
                            <li><a href="#sobre" className="hover:text-white transition-colors">Sobre a Empresa</a></li>
                            <li><a href="#servicos" className="hover:text-white transition-colors">Serviços & Atuação</a></li>
                            <li><a href="#dados" className="hover:text-white transition-colors">Ficha Cadastral</a></li>
                            <li><a href="#contato" className="hover:text-white transition-colors">Fale Conosco</a></li>
                        </ul>
                    </div>

                    {/* Col 4: Legal & Compliance */}
                    <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
                            Jurídico & Compliance
                        </h4>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                            <li>
                                <Link href="/termos" className="hover:text-white transition-colors flex items-center gap-1.5">
                                    Termos de Uso
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacidade" className="hover:text-white transition-colors flex items-center gap-1.5">
                                    <Lock className="w-3 h-3 text-emerald-400" />
                                    Política de Privacidade (LGPD)
                                </Link>
                            </li>
                        </ul>

                        <div className="mt-6 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-snug">
                            <span className="text-emerald-400 font-semibold block mb-0.5">● Registro Oficial Ativo</span>
                            Dados validados perante a Receita Federal do Brasil.
                        </div>
                    </div>
                </div>

                {/* Bottom row */}
                <div className="border-t border-slate-800/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <p className="text-center md:text-left">
                        © {currentYear} {legalName}. Todos os direitos reservados.
                    </p>
                    <p className="text-center md:text-right text-[11px] text-slate-400">
                        Conexão Segura com Criptografia SSL 256-bit
                    </p>
                </div>
            </div>
        </footer>
    );
}
