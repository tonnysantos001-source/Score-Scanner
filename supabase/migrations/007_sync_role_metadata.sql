-- ============================================
-- MIGRATION 007: Sync Role to Auth Metadata
-- ============================================
-- Function to sync profile role to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Update auth.users metadata with the new role
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
WHERE id = NEW.id;
RETURN NEW;
END;
$$;
-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
AFTER
INSERT
    OR
UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_auth_metadata();
-- Manual sync for existing users
-- This ensures all current admins get their metadata updated immediately
DO $$
DECLARE curr_user RECORD;
BEGIN FOR curr_user IN
SELECT id,
    role
FROM public.profiles LOOP
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', curr_user.role)
WHERE id = curr_user.id;
END LOOP;
END;
$$;