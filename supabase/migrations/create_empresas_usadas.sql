-- Migration: Criar tabela empresas_usadas para wordlist
-- Esta tabela armazena CNPJs que já foram salvos por clientes
-- Garante que cada CNPJ seja exclusivo de um único cliente
-- Criar tabela
CREATE TABLE IF NOT EXISTS empresas_usadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES verified_domains(id) ON DELETE
    SET NULL,
        company_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para performance
CREATE INDEX idx_empresas_usadas_cnpj ON empresas_usadas(cnpj);
CREATE INDEX idx_empresas_usadas_user_id ON empresas_usadas(user_id);
CREATE INDEX idx_empresas_usadas_domain_id ON empresas_usadas(domain_id);
-- RLS (Row Level Security)
ALTER TABLE empresas_usadas ENABLE ROW LEVEL SECURITY;
-- Policy: Usuários podem ver apenas suas próprias empresas
CREATE POLICY "Users can view own companies" ON empresas_usadas FOR
SELECT USING (auth.uid() = user_id);
-- Policy: Usuários podem inserir empresas para si mesmos
CREATE POLICY "Users can insert own companies" ON empresas_usadas FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Policy: Usuários podem deletar suas próprias empresas
CREATE POLICY "Users can delete own companies" ON empresas_usadas FOR DELETE USING (auth.uid() = user_id);
-- Comentários
COMMENT ON TABLE empresas_usadas IS 'Wordlist de CNPJs já utilizados por clientes';
COMMENT ON COLUMN empresas_usadas.cnpj IS 'CNPJ da empresa (único no sistema)';
COMMENT ON COLUMN empresas_usadas.user_id IS 'ID do cliente que salvou esta empresa';
COMMENT ON COLUMN empresas_usadas.domain_id IS 'ID do domínio associado';