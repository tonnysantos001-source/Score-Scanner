'use client';

import { Building2, MapPin, Calendar, Wallet, FileText, ShieldCheck, Briefcase } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { formatCNPJ } from '@/lib/utils/cnpj';

interface CompanyDataProps {
    company: any;
}

export default function CompanyData({ company }: CompanyDataProps) {
    const mainActivity = company.cnae_fiscal_descricao || company.atividade_principal?.[0]?.text;
    const cnaeCode = company.cnae_fiscal || company.cnaeCodigo;

    const fullStreetAddress = [
        company.descricao_tipo_de_logradouro,
        company.logradouro,
        company.numero,
        company.complemento,
    ].filter(Boolean).join(' ');

    const districtCity = [company.bairro, company.municipio && company.uf ? `${company.municipio} - ${company.uf}` : company.municipio].filter(Boolean).join(' - ');

    return (
        <section id="dados" className="py-24 bg-slate-50 border-t border-slate-200/80">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
                    {/* Header do Card */}
                    <div className="bg-slate-900 p-8 sm:p-10 text-center text-white relative overflow-hidden">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Transparência Cadastral
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                            Ficha Cadastral Oficial
                        </h2>
                        <p className="text-slate-400 text-sm max-w-xl mx-auto">
                            Dados e informações registradas no Cadastro Nacional da Pessoa Jurídica (CNPJ)
                        </p>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-8 sm:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Coluna 1 */}
                            <div className="space-y-6">
                                <InfoItem
                                    icon={<FileText className="w-5 h-5 text-blue-600" />}
                                    label="Razão Social (Nome Legal)"
                                    value={company.razao_social || company.razaoSocial}
                                />
                                <InfoItem
                                    icon={<Building2 className="w-5 h-5 text-blue-600" />}
                                    label="CNPJ"
                                    value={formatCNPJ(company.cnpj)}
                                    highlight
                                />
                                <InfoItem
                                    icon={<Calendar className="w-5 h-5 text-blue-600" />}
                                    label="Data de Início de Atividade"
                                    value={formatDate(company.data_inicio_atividade || company.dataInicioAtividade)}
                                />
                                <InfoItem
                                    icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
                                    label="Situação Cadastral"
                                    value={
                                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md text-sm">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                            {company.tipo_situacao_cadastral || company.situacaoCadastral || 'ATIVA'}
                                        </span>
                                    }
                                />
                            </div>

                            {/* Coluna 2 */}
                            <div className="space-y-6">
                                <InfoItem
                                    icon={<Wallet className="w-5 h-5 text-blue-600" />}
                                    label="Capital Social Registrado"
                                    value={formatCurrency(company.capital_social || company.capitalSocial || 0)}
                                />
                                <InfoItem
                                    icon={<Building2 className="w-5 h-5 text-blue-600" />}
                                    label="Natureza Jurídica"
                                    value={company.natureza_juridica || company.naturezaJuridica || 'Empresário Individual'}
                                />
                                <InfoItem
                                    icon={<MapPin className="w-5 h-5 text-blue-600" />}
                                    label="Município / UF"
                                    value={`${company.municipio || 'Brasil'} - ${company.uf || 'BR'}`}
                                />
                                {mainActivity && (
                                    <InfoItem
                                        icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                                        label="Atividade Econômica Principal"
                                        value={`${mainActivity}${cnaeCode ? ` (CNAE: ${cnaeCode})` : ''}`}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Endereço Completo Registrado */}
                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                                Endereço Completo da Sede
                            </span>
                            <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                                <MapPin className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-slate-900 font-bold text-base">
                                        {fullStreetAddress || company.fullAddress || 'Endereço registrado na Receita Federal'}
                                    </p>
                                    <p className="text-slate-600 text-sm">
                                        {districtCity}
                                    </p>
                                    {company.cep && (
                                        <p className="text-slate-500 text-xs font-medium">
                                            CEP: {company.cep}
                                        </p>
                                    )}
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
        <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${highlight ? 'bg-blue-100/80 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-0.5">
                    {label}
                </p>
                <div className={`text-base font-bold truncate ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>
                    {value || 'Não informado'}
                </div>
            </div>
        </div>
    );
}
