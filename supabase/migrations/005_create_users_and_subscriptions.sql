-- ============================================
-- MIGRATION 005: Users, Roles & Subscriptions
-- PRODUCTION-GRADE VERSION
-- ============================================
-- Author: CTO Review
-- Target: Vercel + Supabase
-- Compliance: LGPD, SOC2
-- ============================================
-- CLEANUP (Idempotent - safe to re-run)
-- ============================================
-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS audit_profile_changes() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS current_user_role() CASCADE;
DROP FUNCTION IF EXISTS create_admin_user(TEXT) CASCADE;
-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
-- Drop type
DROP TYPE IF EXISTS user_role CASCADE;
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ============================================
-- ENUM: User Roles
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true,
    -- LGPD Compliance
    data_processing_consent BOOLEAN DEFAULT false,
    data_processing_consent_date TIMESTAMPTZ,
    marketing_consent BOOLEAN DEFAULT false,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET
);
-- ============================================
-- TABLE: subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID,
    -- Subscription state
    status TEXT DEFAULT 'active' NOT NULL,
    -- Billing
    price_at_period NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    -- Periods
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    -- External references (Stripe, etc)
    external_id TEXT UNIQUE,
    external_customer_id TEXT,
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (
        status IN (
            'active',
            'trialing',
            'canceled',
            'past_due',
            'unpaid',
            'expired',
            'pending'
        )
    )
);
-- ============================================
-- TABLE: plans
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    -- Pricing
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'BRL',
    interval TEXT DEFAULT 'month' NOT NULL,
    -- Features
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    -- State
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    -- External references
    external_id TEXT UNIQUE,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_interval CHECK (interval IN ('month', 'year'))
);
-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Who
    user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        user_email TEXT,
        -- What
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id UUID,
        -- Changes
        changes JSONB,
        -- Where
        ip_address INET,
        user_agent TEXT,
        -- Context
        metadata JSONB DEFAULT '{}'::jsonb,
        -- When
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)
WHERE role != 'user';
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active)
WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id ON subscriptions(external_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end)
WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active, is_public)
WHERE is_active = true
    AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
-- ============================================
-- SECURITY DEFINER FUNCTIONS (RLS Safe)
-- ============================================
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
    );
$$;
CREATE OR REPLACE FUNCTION is_superadmin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'superadmin'
            AND is_active = true
    );
$$;
CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT role
FROM profiles
WHERE id = auth.uid();
$$;
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR
SELECT USING (is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (
        auth.uid() = id
        AND role = (
            SELECT role
            FROM profiles
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "Admins can update all profiles" ON profiles FOR
UPDATE USING (is_admin());
CREATE POLICY "Superadmins can delete profiles" ON profiles FOR DELETE USING (is_superadmin());
-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR
SELECT USING (is_admin());
CREATE POLICY "System can create subscriptions" ON subscriptions FOR
INSERT WITH CHECK (
        is_admin()
        OR auth.uid() = user_id
    );
CREATE POLICY "System can update subscriptions" ON subscriptions FOR
UPDATE USING (
        is_admin()
        OR auth.uid() = user_id
    );
-- Plans policies
CREATE POLICY "Public can view active plans" ON plans FOR
SELECT USING (
        is_active = true
        AND is_public = true
    );
CREATE POLICY "Admins can view all plans" ON plans FOR
SELECT USING (is_admin());
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (is_admin());
-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR
SELECT USING (is_admin());
CREATE POLICY "System can insert audit logs" ON audit_logs FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$;
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE
UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE
UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- AUTO-CREATE PROFILE (FIRST USER = ADMIN)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE user_count INTEGER;
assigned_role user_role;
BEGIN -- Check if this is the first user
SELECT COUNT(*) INTO user_count
FROM public.profiles;
-- First user becomes admin, others are regular users
IF user_count = 0 THEN assigned_role := 'admin';
ELSE assigned_role := 'user';
END IF;
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        data_processing_consent,
        data_processing_consent_date
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        assigned_role,
        COALESCE(
            (NEW.raw_user_meta_data->>'data_consent')::boolean,
            false
        ),
        CASE
            WHEN (NEW.raw_user_meta_data->>'data_consent')::boolean = true THEN NOW()
            ELSE NULL
        END
    );
RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- ============================================
-- AUDIT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION audit_profile_changes() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF (TG_OP = 'UPDATE') THEN
INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        changes,
        ip_address
    )
VALUES (
        auth.uid(),
        NEW.email,
        'update',
        'profile',
        NEW.id,
        jsonb_build_object(
            'old',
            to_jsonb(OLD),
            'new',
            to_jsonb(NEW)
        ),
        inet_client_addr()
    );
ELSIF (TG_OP = 'DELETE') THEN
INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        changes
    )
VALUES (
        auth.uid(),
        OLD.email,
        'delete',
        'profile',
        OLD.id,
        to_jsonb(OLD)
    );
END IF;
RETURN NULL;
END;
$$;
CREATE TRIGGER audit_profiles
AFTER
UPDATE
    OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();
-- ============================================
-- HELPER FUNCTION: Create Admin
-- ============================================
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE profiles
SET role = 'admin'
WHERE email = admin_email;
IF NOT FOUND THEN RAISE EXCEPTION 'User with email % not found',
admin_email;
END IF;
END;
$$;
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE profiles IS 'User profiles with RBAC and LGPD compliance';
COMMENT ON TABLE subscriptions IS 'User subscriptions (Stripe-compatible)';
COMMENT ON TABLE plans IS 'Available subscription plans';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance (LGPD, SOC2)';
COMMENT ON FUNCTION is_admin() IS 'SECURITY DEFINER: Check if current user is admin (safe for RLS)';
COMMENT ON FUNCTION create_admin_user(TEXT) IS 'Manually promote user to admin';