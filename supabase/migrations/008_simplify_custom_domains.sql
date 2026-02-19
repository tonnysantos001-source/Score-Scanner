-- Migration 008: Simplify Custom Domains for CNAME Strategy
-- Description: Optimizes verified_domains for white-label use case
-- 1. Ensure columns exist and are consistent
DO $$ BEGIN -- Add domain_type if not exists (cname vs internal)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'verified_domains'
        AND column_name = 'domain_type'
) THEN
ALTER TABLE verified_domains
ADD COLUMN domain_type TEXT DEFAULT 'internal';
END IF;
-- Add custom_domain_status if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'verified_domains'
        AND column_name = 'custom_domain_status'
) THEN
ALTER TABLE verified_domains
ADD COLUMN custom_domain_status TEXT DEFAULT 'pending';
END IF;
-- Add custom_domain_error if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'verified_domains'
        AND column_name = 'custom_domain_error'
) THEN
ALTER TABLE verified_domains
ADD COLUMN custom_domain_error TEXT;
END IF;
END $$;
-- 2. Indexes for faster lookup in Middleware
CREATE INDEX IF NOT EXISTS idx_verified_domains_domain ON verified_domains(domain);
CREATE INDEX IF NOT EXISTS idx_verified_domains_custom_status ON verified_domains(custom_domain_status);
-- 3. Comments
COMMENT ON COLUMN verified_domains.domain_type IS 'internal (app subdomain) or external (client cname)';
COMMENT ON COLUMN verified_domains.custom_domain_status IS 'pending, active, failed_dns, failed_ssl';