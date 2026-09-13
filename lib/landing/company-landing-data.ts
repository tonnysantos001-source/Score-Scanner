import { createAdminClient } from '@/lib/supabase/admin';
import { fetchCNPJFromAnyProvider, CNPJData } from '@/lib/api/cnpj-providers';
import { formatCNPJ } from '@/lib/utils/cnpj';

export interface FormattedLandingCompany {
    rawCompanyName: string;
    cleanDisplayName: string;
    razaoSocial: string;
    nomeFantasia?: string;
    cnpj: string;
    formattedCNPJ: string;
    dataInicioAtividade?: string;
    foundedYear?: number | null;
    capitalSocial: number;
    naturezaJuridica: string;
    porte: string;
    situacaoCadastral: string;
    cnaeCodigo?: string | number;
    cnaeDescricao?: string;
    cnaesSecundarios?: Array<{ codigo: number | string; descricao: string }>;
    fullAddress: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio: string;
    uf: string;
    cep?: string;
    telefone?: string;
    email?: string;
    contactEmail: string;
    description: string;
    verificationToken?: string;
    pixelId?: string;
    canonicalUrl: string;
    domain: string;
}

/**
 * Removes CNPJ prefix commonly found in MEI company names
 * e.g., "53.101.400 REGIVALDO LUCIVALDO FREITAS DOS SANTOS" -> "REGIVALDO LUCIVALDO FREITAS DOS SANTOS"
 */
export function cleanBusinessName(rawName: string): string {
    if (!rawName) return 'Empresa';
    // Matches patterns like "12.345.678 ", "12345678 ", "12.345.678/0001-90 "
    const cleaned = rawName
        .replace(/^\d{2}\.?\d{3}\.?\d{3}(?:\/?\d{4}-?\d{2})?\s*[-–]?\s*/i, '')
        .trim();
    return cleaned || rawName;
}

export async function getCompanyLandingData(rawDomainParam: string): Promise<FormattedLandingCompany | null> {
    const rawDomain = decodeURIComponent(rawDomainParam).toLowerCase().replace(/:\d+$/, '').trim();
    const apexDomain = rawDomain.replace(/^www\./, '');
    const supabase = createAdminClient();

    // 1. Query verified_domains + landing_pages
    const { data: verifiedDomain } = await supabase
        .from('verified_domains')
        .select('*, landing_pages(*)')
        .or(`domain.eq.${rawDomain},domain.eq.${apexDomain}`)
        .maybeSingle();

    if (!verifiedDomain) {
        return null;
    }

    const landingPage = Array.isArray(verifiedDomain.landing_pages)
        ? verifiedDomain.landing_pages[0]
        : verifiedDomain.landing_pages;

    // 2. Query empresas_usadas
    const { data: empresaUsada } = await supabase
        .from('empresas_usadas')
        .select('cnpj, company_name')
        .eq('domain_id', verifiedDomain.id)
        .maybeSingle();

    const cnpj = empresaUsada?.cnpj || verifiedDomain.company_cnpj;
    if (!cnpj) {
        return null;
    }

    const cleanCNPJ = cnpj.replace(/\D/g, '');
    const rawStoredName = landingPage?.title_text || empresaUsada?.company_name || verifiedDomain.company_name || 'Empresa';

    // 3. Multi-source CNPJ fetching with fallback
    let apiData: CNPJData | undefined;
    try {
        const response = await fetchCNPJFromAnyProvider(cleanCNPJ);
        if (response.success && response.data) {
            apiData = response.data;
        }
    } catch (err) {
        console.error('[getCompanyLandingData] Erro ao buscar provedores de CNPJ:', err);
    }

    // 4. Assemble comprehensive data
    const razaoSocial = apiData?.razao_social || rawStoredName;
    const nomeFantasia = apiData?.nome_fantasia && apiData.nome_fantasia !== razaoSocial
        ? apiData.nome_fantasia
        : undefined;

    const cleanDisplayName = nomeFantasia || cleanBusinessName(razaoSocial);

    const logradouro = apiData?.logradouro;
    const numero = apiData?.numero;
    const complemento = apiData?.complemento;
    const bairro = apiData?.bairro;
    const municipio = apiData?.municipio || 'Brasil';
    const uf = apiData?.uf || 'BR';
    const cep = apiData?.cep;

    const streetParts = [logradouro, numero, complemento].filter(Boolean).join(', ');
    const districtParts = [bairro, municipio && uf ? `${municipio} - ${uf}` : municipio].filter(Boolean).join(' - ');
    const fullAddress = [streetParts, districtParts, cep ? `CEP: ${cep}` : null].filter(Boolean).join(', ')
        || 'Endereço registrado na Receita Federal do Brasil';

    const foundedDate = apiData?.data_inicio_atividade || verifiedDomain.created_at;
    const foundedYear = foundedDate ? new Date(foundedDate).getFullYear() : null;

    let telefone = apiData?.ddd_telefone_1;
    if (telefone) {
        const digits = telefone.replace(/\D/g, '');
        if (digits.length === 10) {
            telefone = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        } else if (digits.length === 11) {
            telefone = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
    }

    const email = apiData?.email;
    const contactEmail = email || `contato@${rawDomain}`;

    const defaultDescription = apiData?.cnae_fiscal_descricao
        ? `Empresa especializada em ${apiData.cnae_fiscal_descricao.toLowerCase()}. Atendimento corporativo, transparência e conformidade legal.`
        : `Portal institucional de ${cleanDisplayName}. Informações cadastrais oficiais e atendimento ao cliente.`;

    const description = landingPage?.description_text || defaultDescription;

    return {
        rawCompanyName: rawStoredName,
        cleanDisplayName,
        razaoSocial,
        nomeFantasia,
        cnpj: cleanCNPJ,
        formattedCNPJ: formatCNPJ(cleanCNPJ),
        dataInicioAtividade: foundedDate,
        foundedYear,
        capitalSocial: apiData?.capital_social || 0,
        naturezaJuridica: apiData?.codigo_natureza_juridica || 'Empresário Individual',
        porte: apiData?.porte || 'Microempresa (ME)',
        situacaoCadastral: apiData?.tipo_situacao_cadastral || 'ATIVA',
        cnaeCodigo: apiData?.cnae_fiscal,
        cnaeDescricao: apiData?.cnae_fiscal_descricao,
        cnaesSecundarios: apiData?.cnaes_secundarios,
        fullAddress,
        logradouro,
        numero,
        complemento,
        bairro,
        municipio,
        uf,
        cep,
        telefone,
        email,
        contactEmail,
        description,
        verificationToken: verifiedDomain.verification_token,
        pixelId: landingPage?.facebook_pixel_id,
        canonicalUrl: `https://${rawDomain}`,
        domain: rawDomain,
    };
}
