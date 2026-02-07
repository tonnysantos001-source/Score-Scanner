/**
 * Company data structure from BrasilAPI
 */
export interface CompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj_raiz: string;
  data_inicio_atividade: string;
  data_situacao_cadastral: string;
  tipo_situacao_cadastral: string;
  motivo_situacao_cadastral: string;
  nome_cidade_exterior?: string;
  codigo_natureza_juridica: string;
  data_especial?: string;
  opcao_pelo_mei: boolean;
  opcao_pelo_simples: boolean;
  capital_social: number;
  porte:string;
 descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  ddd_fax?: string;
  qualificacao_do_responsavel: number;
  capital_social_display?: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: Array<{
    codigo: number;
    descricao: string;
  }>;
  qsa?: Array<{
    identificador_de_socio: number;
    nome_socio: string;
    cnpj_cpf_do_socio: string;
    codigo_qualificacao_socio: number;
    percentual_capital_social: number;
    data_entrada_sociedade: string;
    cpf_representante_legal?: string;
    nome_representante_legal?: string;
    codigo_qualificacao_representante_legal?: number;
  }>;
}

/**
 * Enhanced company data with trust score and custom fields
 */
export interface EnhancedCompanyData extends CompanyData {
  trust_score: number;
  trust_score_breakdown: TrustScoreBreakdown;
  custom_phone?: string;
  custom_email?: string;
  custom_notes?: string;
  custom_tags?: string[];
  cached_at: string;
  updated_at: string;
}

/**
 * Trust Score breakdown showing individual components
 */
export interface TrustScoreBreakdown {
  cadastral_situation: number; // max 40
  capital_social: number; // max 25
  activity_time: number; // max 20
  company_size: number; // max 10
  location: number; // max 5
  total: number; // max 100
  level: 'low' | 'medium' | 'good' | 'excellent';
}

/**
 * Search filters
 */
export interface SearchFilters {
  capital_min?: number;
  capital_max?: number;
  situacao_cadastral?: string[];
  uf?: string[];
  municipio?: string;
  porte?: string[];
  cnae?: string;
  trust_score_min?: number;
  trust_score_max?: number;
}

/**
 * Search result item (lighter version for list view)
 */
export interface CompanySearchResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  municipio: string;
  uf: string;
  situacao_cadastral: string;
  capital_social: number;
  trust_score: number;
  trust_level: 'low' | 'medium' | 'good' | 'excellent';
}

/**
 * API error response
 */
export interface APIError {
  message: string;
  status: number;
  details?: unknown;
}
