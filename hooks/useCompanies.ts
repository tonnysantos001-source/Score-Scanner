'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================
export interface CompanyData {
    id: string;
    cnpj: string;
    company_name: string;
    created_at: string;
    domain: string | null;
    domain_id: string | null;
    domain_verified: boolean;
    domain_status: string;
    landing_page_active: boolean;
    landing_page_url: string | null;
    is_active: boolean;
}

// ============================================
// Fetch Companies
// ============================================
async function fetchCompanies(): Promise<CompanyData[]> {
    const res = await fetch('/api/companies/list');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao buscar empresas');
    return data.companies;
}

export function useCompanies() {
    return useQuery({
        queryKey: ['companies'],
        queryFn: fetchCompanies,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchInterval: 60_000,
        retry: 2,
    });
}

// ============================================
// Delete Company
// ============================================
async function deleteCompany(companyId: string): Promise<void> {
    const res = await fetch('/api/companies/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao excluir empresa');
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['domain-stats'] });
        },
    });
}
