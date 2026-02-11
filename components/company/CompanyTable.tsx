'use client';

import CompanyCard from './CompanyCard';

import { EnhancedCompanyData } from '@/types/company';

interface CompanyTableProps {
    companies: EnhancedCompanyData[];
    onOpenCompany: (company: EnhancedCompanyData) => void;
}

export default function CompanyTable({ companies, onOpenCompany }: CompanyTableProps) {
    if (companies.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <p className="text-[var(--color-text-muted)]">
                    Nenhuma empresa encontrada ainda. Configure os filtros e clique em &quot;MINERAR DADOS REAIS&quot;
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
                <CompanyCard
                    key={company.cnpj}
                    company={company}
                    onClick={() => onOpenCompany(company)}
                    index={index}
                />
            ))}
        </div>
    );
}
