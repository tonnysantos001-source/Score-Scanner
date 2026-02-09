-- Migration: Refactor para Domínios Customizados com Vercel
-- Data: 2026-02-09
-- Descrição: Remove token próprio, adiciona verificação DNS e token do Facebook
-- 1. Alterar tabela verified_domains
ALTER TABLE verified_domains -- Remover coluna antiga (token gerado por nós)
    DROP COLUMN IF EXISTS verification_token,
    -- Adicionar novos campos
ADD COLUMN IF NOT EXISTS facebook_verification_token TEXT,
    -- Token fornecido pelo CLIENTE do Facebook
ADD COLUMN IF NOT EXISTS dns_status VARCHAR(20) DEFAULT 'pending',
    -- pending, active, failed
ADD COLUMN IF NOT EXISTS dns_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dns_records JSONB,
    -- Armazena resultado do DNS lookup
ADD COLUMN IF NOT EXISTS last_dns_check TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dns_instructions TEXT;
-- Instruções específicas de DNS para o cliente
-- 2. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_verified_domains_dns_status ON verified_domains(dns_status);
CREATE INDEX IF NOT EXISTS idx_verified_domains_domain ON verified_domains(domain);
-- 3. Atualizar domínios existentes para status pendente
UPDATE verified_domains
SET dns_status = 'pending'
WHERE dns_status IS NULL;
-- 4. Comentários nas colunas
COMMENT ON COLUMN verified_domains.facebook_verification_token IS 'Token de verificação fornecido pelo cliente do Facebook Business Manager';
COMMENT ON COLUMN verified_domains.dns_status IS 'Status da verificação DNS: pending, active, failed';
COMMENT ON COLUMN verified_domains.dns_records IS 'Resultado do último DNS lookup (JSON)';
COMMENT ON COLUMN verified_domains.dns_verified_at IS 'Data/hora da última verificação DNS bem-sucedida';
COMMENT ON COLUMN verified_domains.last_dns_check IS 'Data/hora da última tentativa de verificação DNS';