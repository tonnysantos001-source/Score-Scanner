-- Migration: Create Domain Verification System Tables
-- Description: Tables for Facebook domain verification, landing pages, and configurations
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Table 1: Verified Domains
-- Stores domains and their Facebook verification tokens
CREATE TABLE IF NOT EXISTS verified_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_cnpj TEXT NOT NULL,
    company_name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    verification_token TEXT NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Table 2: Landing Pages
-- Stores institutional landing page configurations
CREATE TABLE IF NOT EXISTS landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES verified_domains(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title_text TEXT,
    description_text TEXT,
    use_generic BOOLEAN DEFAULT TRUE,
    facebook_pixel_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Table 3: Facebook Configurations
-- Stores Facebook Pixel and additional configurations
CREATE TABLE IF NOT EXISTS facebook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    pixel_id TEXT NOT NULL,
    access_token TEXT,
    -- Optional, can be encrypted if needed
    additional_meta_tags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_verified_domains_user_id ON verified_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_domains_cnpj ON verified_domains(company_cnpj);
CREATE INDEX IF NOT EXISTS idx_verified_domains_domain ON verified_domains(domain);
CREATE INDEX IF NOT EXISTS idx_verified_domains_is_verified ON verified_domains(is_verified);
CREATE INDEX IF NOT EXISTS idx_landing_pages_domain_id ON landing_pages(domain_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_facebook_configs_landing_page_id ON facebook_configs(landing_page_id);
-- Row Level Security (RLS) Policies
ALTER TABLE verified_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_configs ENABLE ROW LEVEL SECURITY;
-- Policy: Users can only see their own verified domains
CREATE POLICY "Users can view their own verified domains" ON verified_domains FOR
SELECT USING (auth.uid() = user_id);
-- Policy: Users can insert their own verified domains
CREATE POLICY "Users can insert their own verified domains" ON verified_domains FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Policy: Users can update their own verified domains
CREATE POLICY "Users can update their own verified domains" ON verified_domains FOR
UPDATE USING (auth.uid() = user_id);
-- Policy: Users can delete their own verified domains
CREATE POLICY "Users can delete their own verified domains" ON verified_domains FOR DELETE USING (auth.uid() = user_id);
-- Policy: Users can view landing pages of their domains
CREATE POLICY "Users can view their landing pages" ON landing_pages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM verified_domains
            WHERE verified_domains.id = landing_pages.domain_id
                AND verified_domains.user_id = auth.uid()
        )
    );
-- Policy: Users can insert landing pages for their domains
CREATE POLICY "Users can insert their landing pages" ON landing_pages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM verified_domains
            WHERE verified_domains.id = landing_pages.domain_id
                AND verified_domains.user_id = auth.uid()
        )
    );
-- Policy: Users can update their landing pages
CREATE POLICY "Users can update their landing pages" ON landing_pages FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM verified_domains
            WHERE verified_domains.id = landing_pages.domain_id
                AND verified_domains.user_id = auth.uid()
        )
    );
-- Policy: Users can delete their landing pages
CREATE POLICY "Users can delete their landing pages" ON landing_pages FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM verified_domains
        WHERE verified_domains.id = landing_pages.domain_id
            AND verified_domains.user_id = auth.uid()
    )
);
-- Policy: Users can view Facebook configs of their landing pages
CREATE POLICY "Users can view their Facebook configs" ON facebook_configs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM landing_pages
                JOIN verified_domains ON verified_domains.id = landing_pages.domain_id
            WHERE landing_pages.id = facebook_configs.landing_page_id
                AND verified_domains.user_id = auth.uid()
        )
    );
-- Policy: Users can insert Facebook configs for their landing pages
CREATE POLICY "Users can insert their Facebook configs" ON facebook_configs FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM landing_pages
                JOIN verified_domains ON verified_domains.id = landing_pages.domain_id
            WHERE landing_pages.id = facebook_configs.landing_page_id
                AND verified_domains.user_id = auth.uid()
        )
    );
-- Policy: Users can update their Facebook configs
CREATE POLICY "Users can update their Facebook configs" ON facebook_configs FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM landing_pages
                JOIN verified_domains ON verified_domains.id = landing_pages.domain_id
            WHERE landing_pages.id = facebook_configs.landing_page_id
                AND verified_domains.user_id = auth.uid()
        )
    );
-- Policy: Users can delete their Facebook configs
CREATE POLICY "Users can delete their Facebook configs" ON facebook_configs FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM landing_pages
            JOIN verified_domains ON verified_domains.id = landing_pages.domain_id
        WHERE landing_pages.id = facebook_configs.landing_page_id
            AND verified_domains.user_id = auth.uid()
    )
);
-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers: Auto-update updated_at on all tables
CREATE TRIGGER update_verified_domains_updated_at BEFORE
UPDATE ON verified_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landing_pages_updated_at BEFORE
UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facebook_configs_updated_at BEFORE
UPDATE ON facebook_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Comments
COMMENT ON TABLE verified_domains IS 'Stores Facebook domain verification information';
COMMENT ON TABLE landing_pages IS 'Stores institutional landing page configurations';
COMMENT ON TABLE facebook_configs IS 'Stores Facebook Pixel and additional Meta configurations';