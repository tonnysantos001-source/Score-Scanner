'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Domain List Hook
// ============================================
export interface DomainData {
    id: string;
    domain: string;
    company_name: string;
    cnpj: string;
    is_verified: boolean;
    verified_at: string | null;
    verification_token: string | null;
    created_at: string;
    domain_type: 'system' | 'external';
    custom_domain_status?: string;
    custom_domain_error?: string;
    dns_status?: 'pending' | 'verified' | 'error';
    dns_error_reason?: string; // We map this to custom_domain_error in the API
    last_dns_check_at?: string; // We map this to last_dns_check in the API
    dns_verified_at?: string;   // We map this to verified_at in the API
    landing_pages: Array<{
        id: string;
        slug: string;
        is_active: boolean;
        title_text?: string;
        description_text?: string;
        facebook_pixel_id?: string;
    }>;
    landing_page_url: string | null;
    landing_page_active: boolean;
}

async function fetchDomains(): Promise<DomainData[]> {
    const res = await fetch('/api/domain/list');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao buscar domínios');
    return data.domains;
}

export function useDomains() {
    const query = useQuery({
        queryKey: ['domains'],
        queryFn: fetchDomains,
        staleTime: 15_000,           // 15s - dados considerados "fresh"
        refetchOnWindowFocus: true,  // Refetch ao voltar à aba  
        refetchInterval: (query) => {
            // Adaptive polling: faster when pending domains exist
            const domains = query.state.data;
            const hasPending = domains?.some(
                (d) => d.custom_domain_status === 'pending' || d.custom_domain_status === 'failed'
            );
            return hasPending ? 15_000 : 60_000; // 15s pending, 60s stable
        },
        retry: 2,
    });
    return query;
}

// ============================================
// Domain Stats Hook
// ============================================
export interface DomainStats {
    total_domains: number;
    verified_domains: number;
    pending_domains: number;
    active_landing_pages: number;
    created_this_month: number;
}

async function fetchStats(): Promise<DomainStats> {
    const res = await fetch('/api/domain/stats');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao buscar stats');
    return data.stats;
}

export function useDomainStats() {
    return useQuery({
        queryKey: ['domain-stats'],
        queryFn: fetchStats,
        staleTime: 60_000,           // 1 min cache
        refetchOnWindowFocus: true,
        retry: 2,
    });
}

// ============================================
// Verify DNS Mutation
// ============================================
interface VerifyDNSParams {
    domain: string;
    domainId: string;
}

interface VerifyDNSResult {
    success: boolean;
    verification: {
        verified: boolean;
        error?: string;
        record?: string;
        method?: string;
    };
    dns_status: string;
}

async function verifyDNS(params: VerifyDNSParams): Promise<VerifyDNSResult> {
    const res = await fetch('/api/domain/verify-dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao verificar DNS');
    return data;
}

export function useVerifyDNS() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: verifyDNS,
        onSuccess: async () => {
            // Small delay to ensure Supabase DB commit is visible to subsequent reads
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Invalidate domains and stats to show updated status
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domain-stats'] });
        },
    });
}

// ============================================
// Delete Domain Mutation
// ============================================
async function deleteDomain(domainId: string): Promise<void> {
    const res = await fetch('/api/domain/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain_id: domainId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao deletar domínio');
}

export function useDeleteDomain() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteDomain,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domain-stats'] });
        },
    });
}

// ============================================
// Add Domain Mutation
// ============================================
interface AddDomainParams {
    cnpj: string;
    domain: string;
    company_name: string;
}

interface AddDomainResult {
    success: boolean;
    domain_id: string;
    slug: string;
    dns_instructions: string;
    message: string;
}

async function addDomain(params: AddDomainParams): Promise<AddDomainResult> {
    const res = await fetch('/api/domain/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao adicionar domínio');
    return data;
}

export function useAddDomain() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addDomain,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domain-stats'] });
        },
    });
}
