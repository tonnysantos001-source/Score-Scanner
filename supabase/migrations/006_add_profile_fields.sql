-- Migration 006: Add document and phone to profiles (SAFE)
DO $$ BEGIN -- Add document column if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'document'
) THEN
ALTER TABLE profiles
ADD COLUMN document TEXT;
END IF;
-- Add phone column if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'phone'
) THEN
ALTER TABLE profiles
ADD COLUMN phone TEXT;
END IF;
END $$;