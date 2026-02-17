-- ============================================
-- MIGRATION 006: Gateway Settings & Domain Plans
-- ============================================
-- Author: Admin Panel Implementation
-- Date: 2026-02-17
-- Purpose: Add gateway settings & domain-based plans
-- Enable encryption extension (for storing API keys securely)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ============================================
-- TABLE: gateway_settings
-- ============================================
CREATE TABLE IF NOT EXISTS gateway_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL DEFAULT 'zentripay',
    -- Encrypted API credentials
    api_key TEXT,
    api_secret TEXT,
    webhook_secret TEXT,
    -- Environment
    is_production BOOLEAN DEFAULT false,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        updated_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL
);
-- ============================================
-- UPDATE: plans table (add max_domains)
-- ============================================
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS max_domains INTEGER DEFAULT 0;
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly';
-- ============================================
-- UPDATE: subscriptions table (add domain tracking)
-- ============================================
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS active_domains INTEGER DEFAULT 0;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix';
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gateway_settings_provider ON gateway_settings(provider);
CREATE INDEX IF NOT EXISTS idx_plans_max_domains ON plans(max_domains)
WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_domains ON subscriptions(active_domains);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_method ON subscriptions(payment_method);
-- ============================================
-- RLS POLICIES: gateway_settings
-- ============================================
ALTER TABLE gateway_settings ENABLE ROW LEVEL SECURITY;
-- Only superadmins can view gateway settings
CREATE POLICY "Superadmins can view gateway settings" ON gateway_settings FOR
SELECT USING (is_superadmin());
-- Only superadmins can insert gateway settings
CREATE POLICY "Superadmins can insert gateway settings" ON gateway_settings FOR
INSERT WITH CHECK (is_superadmin());
-- Only superadmins can update gateway settings
CREATE POLICY "Superadmins can update gateway settings" ON gateway_settings FOR
UPDATE USING (is_superadmin());
-- ============================================
-- TRIGGER: Update timestamp
-- ============================================
CREATE TRIGGER update_gateway_settings_updated_at BEFORE
UPDATE ON gateway_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- SEED: Initial Plans
-- ============================================
INSERT INTO plans (
        name,
        description,
        price,
        currency,
        interval,
        max_domains,
        features,
        limits,
        is_active,
        is_public,
        is_featured
    )
VALUES (
        'Starter',
        'Perfeito para começar sua operação de ads',
        100.00,
        'BRL',
        'month',
        4,
        '["4 domínios ativos", "Landing pages ilimitadas", "Verificação CNPJ automática", "Dashboard de gerenciamento", "Suporte por email"]'::jsonb,
        '{"max_domains": 4, "max_landing_pages": -1, "support_level": "email"}'::jsonb,
        true,
        true,
        false
    ),
    (
        'Professional',
        'Ideal para agências e profissionais',
        150.00,
        'BRL',
        'month',
        10,
        '["10 domínios ativos", "Landing pages ilimitadas", "Verificação CNPJ automática", "Dashboard avançado", "Suporte prioritário", "Relatórios detalhados"]'::jsonb,
        '{"max_domains": 10, "max_landing_pages": -1, "support_level": "priority", "analytics": true}'::jsonb,
        true,
        true,
        true
    ),
    (
        'Enterprise',
        'Para grandes operações e agências',
        250.00,
        'BRL',
        'month',
        20,
        '["20 domínios ativos", "Landing pages ilimitadas", "Verificação CNPJ automática", "Dashboard enterprise", "Suporte VIP 24/7", "Relatórios personalizados", "API dedicada", "Gerente de conta"]'::jsonb,
        '{"max_domains": 20, "max_landing_pages": -1, "support_level": "vip", "analytics": true, "api_access": true, "account_manager": true}'::jsonb,
        true,
        true,
        false
    ) ON CONFLICT DO NOTHING;
-- ============================================
-- HELPER FUNCTION: Get Gateway Settings (Decrypted)
-- ============================================
CREATE OR REPLACE FUNCTION get_gateway_settings() RETURNS TABLE (
        provider TEXT,
        api_key TEXT,
        api_secret TEXT,
        webhook_secret TEXT,
        is_production BOOLEAN
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Only allow server-side calls (not from client)
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' IS NULL THEN RAISE EXCEPTION 'Unauthorized';
END IF;
RETURN QUERY
SELECT gs.provider,
    gs.api_key,
    gs.api_secret,
    gs.webhook_secret,
    gs.is_production
FROM gateway_settings gs
WHERE gs.provider = 'zentripay'
ORDER BY gs.created_at DESC
LIMIT 1;
END;
$$;
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE gateway_settings IS 'Payment gateway configuration (ZentriPay)';
COMMENT ON COLUMN plans.max_domains IS 'Maximum active domains allowed for this plan';
COMMENT ON COLUMN subscriptions.active_domains IS 'Current number of active domains';
COMMENT ON FUNCTION get_gateway_settings() IS 'SECURITY DEFINER: Get gateway credentials (server-only)';