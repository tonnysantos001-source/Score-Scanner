'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Calendar, Wallet, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { formatCNPJ } from '@/lib/utils/cnpj';

interface CompanyDataProps {
    company: any; // Tipar corretamente se possível, mas any funciona para o MVP
}

export default function CompanyData({ company }: CompanyDataProps) {
    return (
        <section id="dados" className="py-20 bg-slate-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                    {/* Header do Card */}
                    <div className="bg-slate-900 p-8 sm:p-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold mb-6">
                            <CheckCircle2 size={16} />
                            Empresa Verificada & Ativa
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dossiê Empresarial Público</h2>
                        <p className="text-slate-400">Dados oficiais consultados na Receita Federal</p>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-8 sm:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {/* Coluna 1 */}
                            <div className="space-y-6">
                                <InfoItem
                                    icon={<FileText />}
                                    label="Razão Social"
                                    value={company.razao_social}
                                />
                                <InfoItem
                                    icon={<Building2 />}
                                    label="CNPJ"
                                    value={formatCNPJ(company.cnpj)}
                                    highlight
                                />
                                <InfoItem
                                    icon={<Calendar />}
                                    label="Data de Abertura"
                                    value={formatDate(company.data_inicio_atividade)}
                                />
                            </div>

                            {/* Coluna 2 */}
                            <div className="space-y-6">
                                <InfoItem
                                    icon={<Wallet />}
                                    label="Capital Social"
                                    value={formatCurrency(company.capital_social)}
                                />
                                <InfoItem
                                    icon={<Building2 />}
                                    label="Natureza Jurídica"
                                    value={company.natureza_juridica}
                                />
                                <InfoItem
                                    icon={<MapPin />}
                                    label="Localização"
                                    value={`${company.municipio} - ${company.uf}`}
                                />
                            </div>
                        </div>

                        {/* Endereço Completo */}
                        <div className="mt-10 pt-10 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Endereço Registrado</h3>
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <MapPin className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-slate-900 font-medium">
                                        {company.descricao_tipo_de_logradouro} {company.logradouro}, {company.numero} {company.complemento}
                                    </p>
                                    <p className="text-slate-600">
                                        {company.bairro}, {company.municipio} - {company.uf}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">CEP: {company.cep}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function InfoItem({ icon, label, value, highlight = false }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg flex-shrink-0 ${highlight ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
                <p className={`text-lg font-semibold ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>
                    {value || 'Não informado'}
                </p>
            </div>
        </div>
    );
}
