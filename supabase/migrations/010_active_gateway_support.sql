-- ============================================
-- MIGRATION 010: Gateway Settings Enhancements
-- ============================================
-- Purpose: Add is_active column and update get_gateway_settings RPC to support multiple providers

-- Adiciona a coluna is_active se não existir
ALTER TABLE gateway_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Atualiza a função get_gateway_settings para retornar o gateway ativo
CREATE OR REPLACE FUNCTION get_gateway_settings() RETURNS TABLE (
        provider TEXT,
        api_key TEXT,
        api_secret TEXT,
        webhook_secret TEXT,
        is_production BOOLEAN
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' IS NULL THEN 
        IF current_setting('role', true) <> 'service_role' THEN
            RAISE EXCEPTION 'Unauthorized';
        END IF;
    END IF;
    
    -- Se houver algum explicitamente ativo, retorna ele
    IF EXISTS (SELECT 1 FROM gateway_settings WHERE is_active = true) THEN
        RETURN QUERY
        SELECT gs.provider,
            gs.api_key,
            gs.api_secret,
            gs.webhook_secret,
            gs.is_production
        FROM gateway_settings gs
        WHERE gs.is_active = true
        ORDER BY gs.updated_at DESC
        LIMIT 1;
    ELSE
        -- Fallback: retorna o configurado mais recentemente
        RETURN QUERY
        SELECT gs.provider,
            gs.api_key,
            gs.api_secret,
            gs.webhook_secret,
            gs.is_production
        FROM gateway_settings gs
        ORDER BY gs.updated_at DESC
        LIMIT 1;
    END IF;
END;
$$;
