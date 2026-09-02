-- ==============================================================================
-- SCORE SCANNER (VERIFYADS) - MASTER DATABASE SCHEMA
-- ==============================================================================
-- Este script recria toda a estrutura do banco de dados no Supabase.
-- Como executar:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/fxytcbcwzkrniblihlin
-- 2. Clique em "SQL Editor" no menu lateral esquerdo
-- 3. Cole todo o conteúdo deste arquivo e clique em "Run" (Executar)
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS E ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
    END IF;
END $$;

-- 3. TABELAS PRINCIPAIS

-- 3.1. PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true,
    document TEXT,
    phone TEXT,
    data_processing_consent BOOLEAN DEFAULT false,
    data_processing_consent_date TIMESTAMPTZ,
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET
);

-- 3.2. PLANOS DE ASSINATURA
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'BRL',
    interval TEXT DEFAULT 'month' NOT NULL,
    max_domains INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    billing_interval TEXT DEFAULT 'monthly',
    external_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_interval CHECK (interval IN ('month', 'year'))
);

-- 3.3. ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_id UUID,
    status TEXT DEFAULT 'active' NOT NULL,
    price_at_period NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    payment_method TEXT DEFAULT 'pix',
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    pix_expires_at TIMESTAMPTZ,
    payment_confirmed_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    active_domains INTEGER DEFAULT 0,
    external_id TEXT,
    external_customer_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL,
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

-- 3.4. CONFIGURAÇÕES DE GATEWAYS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS public.gateway_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL DEFAULT 'zentripay',
    api_key TEXT,
    api_secret TEXT,
    webhook_secret TEXT,
    is_production BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3.5. DOMÍNIOS VERIFICADOS
CREATE TABLE IF NOT EXISTS public.verified_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_cnpj TEXT NOT NULL,
    company_name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    verification_token TEXT,
    facebook_verification_token TEXT,
    dns_status VARCHAR(20) DEFAULT 'pending',
    dns_verified_at TIMESTAMPTZ,
    dns_records JSONB,
    last_dns_check TIMESTAMPTZ,
    dns_instructions TEXT,
    domain_type TEXT DEFAULT 'internal',
    custom_domain_status TEXT DEFAULT 'pending',
    custom_domain_error TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6. LANDING PAGES INSTITUCIONAIS
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES public.verified_domains(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title_text TEXT,
    description_text TEXT,
    use_generic BOOLEAN DEFAULT TRUE,
    facebook_pixel_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7. CONFIGURAÇÕES DO FACEBOOK / META
CREATE TABLE IF NOT EXISTS public.facebook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    pixel_id TEXT NOT NULL,
    access_token TEXT,
    additional_meta_tags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8. EMPRESAS USADAS (WORDLIST EXCLUSIVA POR CLIENTE)
CREATE TABLE IF NOT EXISTS public.empresas_usadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES public.verified_domains(id) ON DELETE SET NULL,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9. TABELAS DE CACHE E MINERAÇÃO DE CNPJ
CREATE TABLE IF NOT EXISTS public.cnpj_whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    uf VARCHAR(2),
    municipio TEXT,
    capital_social NUMERIC,
    porte VARCHAR(20),
    trust_score INTEGER,
    found_at TIMESTAMPTZ DEFAULT NOW(),
    times_verified INTEGER DEFAULT 1,
    last_verified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cnpj_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    reason VARCHAR(50) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cnpj_used (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    user_session TEXT
);

-- 3.10. LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role != 'user';
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id ON public.subscriptions(external_id);

CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active, is_public) WHERE is_active = true AND is_public = true;

CREATE INDEX IF NOT EXISTS idx_gateway_settings_provider ON public.gateway_settings(provider);

CREATE INDEX IF NOT EXISTS idx_verified_domains_user_id ON public.verified_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_domains_domain ON public.verified_domains(domain);
CREATE INDEX IF NOT EXISTS idx_verified_domains_cnpj ON public.verified_domains(company_cnpj);
CREATE INDEX IF NOT EXISTS idx_verified_domains_dns_status ON public.verified_domains(dns_status);
CREATE INDEX IF NOT EXISTS idx_verified_domains_custom_status ON public.verified_domains(custom_domain_status);

CREATE INDEX IF NOT EXISTS idx_landing_pages_domain_id ON public.landing_pages(domain_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);

CREATE INDEX IF NOT EXISTS idx_empresas_usadas_cnpj ON public.empresas_usadas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_usadas_user_id ON public.empresas_usadas(user_id);

CREATE INDEX IF NOT EXISTS idx_cnpj_whitelist_cnpj ON public.cnpj_whitelist(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpj_whitelist_uf ON public.cnpj_whitelist(uf);
CREATE INDEX IF NOT EXISTS idx_cnpj_blacklist_cnpj ON public.cnpj_blacklist(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpj_used_cnpj ON public.cnpj_used(cnpj);

-- 5. FUNÇÕES E PROCEDURES

-- 5.1. Atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 5.2. Verificação de permissões (Segurança RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'superadmin'
            AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid();
$$;

-- 5.3. Criar perfil automaticamente no cadastro (Primeiro usuário vira Admin!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    user_count INTEGER;
    assigned_role user_role;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;

    -- Primeiro usuário cadastrado vira Admin automaticamente!
    IF user_count = 0 THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := 'user';
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
        COALESCE((NEW.raw_user_meta_data->>'data_consent')::boolean, false),
        CASE
            WHEN (NEW.raw_user_meta_data->>'data_consent')::boolean = true THEN NOW()
            ELSE NULL
        END
    );

    RETURN NEW;
END;
$$;

-- 5.4. Sincronizar Role para metadados de autenticação do usuário
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- 5.5. Auditoria de alterações
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (
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
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
            inet_client_addr()
        );
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
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

-- 5.6. Helper para promover usuário a admin
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE email = admin_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % not found', admin_email;
    END IF;
END;
$$;

-- 5.7. Função para buscar credenciais de gateway
CREATE OR REPLACE FUNCTION public.get_gateway_settings()
RETURNS TABLE (
    provider TEXT,
    api_key TEXT,
    api_secret TEXT,
    webhook_secret TEXT,
    is_production BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' IS NULL THEN
        IF current_setting('role', true) <> 'service_role' THEN
            RAISE EXCEPTION 'Unauthorized';
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM public.gateway_settings WHERE is_active = true) THEN
        RETURN QUERY
        SELECT gs.provider, gs.api_key, gs.api_secret, gs.webhook_secret, gs.is_production
        FROM public.gateway_settings gs
        WHERE gs.is_active = true
        ORDER BY gs.updated_at DESC
        LIMIT 1;
    ELSE
        RETURN QUERY
        SELECT gs.provider, gs.api_key, gs.api_secret, gs.webhook_secret, gs.is_production
        FROM public.gateway_settings gs
        ORDER BY gs.updated_at DESC
        LIMIT 1;
    END IF;
END;
$$;

-- 6. TRIGGERS

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_auth_metadata();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_profile_changes();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gateway_settings_updated_at ON public.gateway_settings;
CREATE TRIGGER update_gateway_settings_updated_at
BEFORE UPDATE ON public.gateway_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_verified_domains_updated_at ON public.verified_domains;
CREATE TRIGGER update_verified_domains_updated_at
BEFORE UPDATE ON public.verified_domains
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON public.landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_facebook_configs_updated_at ON public.facebook_configs;
CREATE TRIGGER update_facebook_configs_updated_at
BEFORE UPDATE ON public.facebook_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_usadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpj_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpj_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpj_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.1. Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- 7.2. Plans
DROP POLICY IF EXISTS "Public can view active plans" ON public.plans;
CREATE POLICY "Public can view active plans" ON public.plans FOR SELECT USING (is_active = true AND is_public = true);

DROP POLICY IF EXISTS "Admins can view all plans" ON public.plans;
CREATE POLICY "Admins can view all plans" ON public.plans FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL USING (public.is_admin());

-- 7.3. Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "System can create subscriptions" ON public.subscriptions;
CREATE POLICY "System can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscriptions;
CREATE POLICY "System can update subscriptions" ON public.subscriptions FOR UPDATE USING (public.is_admin() OR auth.uid() = user_id);

-- 7.4. Gateway Settings
DROP POLICY IF EXISTS "Admins can view gateway settings" ON public.gateway_settings;
CREATE POLICY "Admins can view gateway settings" ON public.gateway_settings FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert gateway settings" ON public.gateway_settings;
CREATE POLICY "Admins can insert gateway settings" ON public.gateway_settings FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update gateway settings" ON public.gateway_settings;
CREATE POLICY "Admins can update gateway settings" ON public.gateway_settings FOR UPDATE USING (public.is_admin());

-- 7.5. Verified Domains
DROP POLICY IF EXISTS "Users can view their own verified domains" ON public.verified_domains;
CREATE POLICY "Users can view their own verified domains" ON public.verified_domains FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own verified domains" ON public.verified_domains;
CREATE POLICY "Users can insert their own verified domains" ON public.verified_domains FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own verified domains" ON public.verified_domains;
CREATE POLICY "Users can update their own verified domains" ON public.verified_domains FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own verified domains" ON public.verified_domains;
CREATE POLICY "Users can delete their own verified domains" ON public.verified_domains FOR DELETE USING (auth.uid() = user_id);

-- 7.6. Landing Pages
DROP POLICY IF EXISTS "Public can view active landing pages" ON public.landing_pages;
CREATE POLICY "Public can view active landing pages" ON public.landing_pages FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can insert their landing pages" ON public.landing_pages;
CREATE POLICY "Users can insert their landing pages" ON public.landing_pages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.verified_domains WHERE verified_domains.id = landing_pages.domain_id AND verified_domains.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their landing pages" ON public.landing_pages;
CREATE POLICY "Users can update their landing pages" ON public.landing_pages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.verified_domains WHERE verified_domains.id = landing_pages.domain_id AND verified_domains.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their landing pages" ON public.landing_pages;
CREATE POLICY "Users can delete their landing pages" ON public.landing_pages FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.verified_domains WHERE verified_domains.id = landing_pages.domain_id AND verified_domains.user_id = auth.uid())
);

-- 7.7. Facebook Configs
DROP POLICY IF EXISTS "Users can view their Facebook configs" ON public.facebook_configs;
CREATE POLICY "Users can view their Facebook configs" ON public.facebook_configs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.landing_pages
        JOIN public.verified_domains ON verified_domains.id = landing_pages.domain_id
        WHERE landing_pages.id = facebook_configs.landing_page_id AND (verified_domains.user_id = auth.uid() OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "Users can insert their Facebook configs" ON public.facebook_configs;
CREATE POLICY "Users can insert their Facebook configs" ON public.facebook_configs FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.landing_pages
        JOIN public.verified_domains ON verified_domains.id = landing_pages.domain_id
        WHERE landing_pages.id = facebook_configs.landing_page_id AND verified_domains.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update their Facebook configs" ON public.facebook_configs;
CREATE POLICY "Users can update their Facebook configs" ON public.facebook_configs FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.landing_pages
        JOIN public.verified_domains ON verified_domains.id = landing_pages.domain_id
        WHERE landing_pages.id = facebook_configs.landing_page_id AND verified_domains.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete their Facebook configs" ON public.facebook_configs;
CREATE POLICY "Users can delete their Facebook configs" ON public.facebook_configs FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.landing_pages
        JOIN public.verified_domains ON verified_domains.id = landing_pages.domain_id
        WHERE landing_pages.id = facebook_configs.landing_page_id AND verified_domains.user_id = auth.uid()
    )
);

-- 7.8. Empresas Usadas
DROP POLICY IF EXISTS "Users can view own companies" ON public.empresas_usadas;
CREATE POLICY "Users can view own companies" ON public.empresas_usadas FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own companies" ON public.empresas_usadas;
CREATE POLICY "Users can insert own companies" ON public.empresas_usadas FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own companies" ON public.empresas_usadas;
CREATE POLICY "Users can delete own companies" ON public.empresas_usadas FOR DELETE USING (auth.uid() = user_id);

-- 7.9. CNPJ Cache (Whitelist, Blacklist, Used)
DROP POLICY IF EXISTS "Public read whitelist" ON public.cnpj_whitelist;
CREATE POLICY "Public read whitelist" ON public.cnpj_whitelist FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert whitelist" ON public.cnpj_whitelist;
CREATE POLICY "Public insert whitelist" ON public.cnpj_whitelist FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update whitelist" ON public.cnpj_whitelist;
CREATE POLICY "Public update whitelist" ON public.cnpj_whitelist FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read blacklist" ON public.cnpj_blacklist;
CREATE POLICY "Public read blacklist" ON public.cnpj_blacklist FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert blacklist" ON public.cnpj_blacklist;
CREATE POLICY "Public insert blacklist" ON public.cnpj_blacklist FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read used" ON public.cnpj_used;
CREATE POLICY "Public read used" ON public.cnpj_used FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert used" ON public.cnpj_used;
CREATE POLICY "Public insert used" ON public.cnpj_used FOR INSERT WITH CHECK (true);

-- 7.10. Audit Logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. DADOS INICIAIS (SEED)

-- Planos Padrão
INSERT INTO public.plans (
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
VALUES
(
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
)
ON CONFLICT DO NOTHING;

-- Configuração inicial do gateway padrão
INSERT INTO public.gateway_settings (provider, api_key, is_production, is_active)
VALUES ('active_gateway', 'zentripay', false, true)
ON CONFLICT DO NOTHING;
