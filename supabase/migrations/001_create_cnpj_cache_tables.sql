-- ============================================
-- CNPJ CACHE SYSTEM - DATABASE SCHEMA
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard/project/myyduuwrnumojagihaei/editor
-- ============================================
-- TABLE 1: cnpj_whitelist
-- ============================================
-- Stores validated, active CNPJs
CREATE TABLE IF NOT EXISTS cnpj_whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    uf VARCHAR(2),
    municipio TEXT,
    capital_social NUMERIC,
    porte VARCHAR(20),
    trust_score INTEGER,
    found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    times_verified INTEGER DEFAULT 1,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================
-- TABLE 2: cnpj_blacklist
-- ============================================
-- Stores invalid CNPJs (not found, inactive, etc.)
CREATE TABLE IF NOT EXISTS cnpj_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    reason VARCHAR(50) NOT NULL,
    -- 'NOT_FOUND', 'INACTIVE', 'ERROR', 'FILTERED'
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================
-- TABLE 3: cnpj_used
-- ============================================
-- Stores CNPJs marked as "used" by users
CREATE TABLE IF NOT EXISTS cnpj_used (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_session TEXT
);
-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cnpj_whitelist_cnpj ON cnpj_whitelist(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpj_whitelist_uf ON cnpj_whitelist(uf);
CREATE INDEX IF NOT EXISTS idx_cnpj_whitelist_found_at ON cnpj_whitelist(found_at DESC);
CREATE INDEX IF NOT EXISTS idx_cnpj_blacklist_cnpj ON cnpj_blacklist(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpj_blacklist_added_at ON cnpj_blacklist(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_cnpj_used_cnpj ON cnpj_used(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpj_used_used_at ON cnpj_used(used_at DESC);
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE cnpj_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnpj_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnpj_used ENABLE ROW LEVEL SECURITY;
-- ============================================
-- POLICIES: PUBLIC READ/WRITE ACCESS
-- ============================================
-- Everyone can read and contribute to the shared cache
-- cnpj_whitelist policies
CREATE POLICY "Public read whitelist" ON cnpj_whitelist FOR
SELECT USING (true);
CREATE POLICY "Public insert whitelist" ON cnpj_whitelist FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public update whitelist" ON cnpj_whitelist FOR
UPDATE USING (true);
-- cnpj_blacklist policies
CREATE POLICY "Public read blacklist" ON cnpj_blacklist FOR
SELECT USING (true);
CREATE POLICY "Public insert blacklist" ON cnpj_blacklist FOR
INSERT WITH CHECK (true);
-- cnpj_used policies
CREATE POLICY "Public read used" ON cnpj_used FOR
SELECT USING (true);
CREATE POLICY "Public insert used" ON cnpj_used FOR
INSERT WITH CHECK (true);
-- ============================================
-- VERIFICATION
-- ============================================
-- Run these to verify tables were created:
-- SELECT * FROM cnpj_whitelist LIMIT 10;
-- SELECT * FROM cnpj_blacklist LIMIT 10;
-- SELECT * FROM cnpj_used LIMIT 10;
-- Check indexes:
-- SELECT * FROM pg_indexes WHERE tablename IN ('cnpj_whitelist', 'cnpj_blacklist', 'cnpj_used');
-- Check policies:
-- SELECT * FROM pg_policies WHERE tablename IN ('cnpj_whitelist', 'cnpj_blacklist', 'cnpj_used');