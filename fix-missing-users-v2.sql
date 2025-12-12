-- ========================================
-- FIX: Migrate Missing Users from Auth to Users Table (v2)
-- ========================================
-- This script:
-- 1. Sets up the trigger for future signups
-- 2. Backfills existing authenticated users into the users table
-- Fixed for user_role enum type
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: Check if user_role enum exists, create if needed
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('guest', 'member', 'group_admin', 'founder');
    END IF;
END $$;

-- ========================================
-- STEP 2: Ensure users table exists with correct schema
-- ========================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role NOT NULL DEFAULT 'member',
  phone TEXT,
  bio TEXT,
  profile_picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- STEP 3: Enable RLS
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Drop existing policies
-- ========================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- ========================================
-- STEP 5: Create RLS policies
-- ========================================

-- Allow service role to insert (for trigger)
CREATE POLICY "Enable insert for service role"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to view all profiles
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to read (for public pages)
CREATE POLICY "Allow anon to read users"
ON public.users
FOR SELECT
TO anon
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Founders can update any profile
CREATE POLICY "Founders can update any profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'founder'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'founder'
  )
);

-- ========================================
-- STEP 6: Drop and recreate trigger function
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email = 'mail.soulstices@gmail.com' THEN 'founder'::user_role
      ELSE 'member'::user_role
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ========================================
-- STEP 7: Create trigger
-- ========================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 8: Grant permissions
-- ========================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- ========================================
-- STEP 9: BACKFILL - Migrate existing auth users to users table
-- ========================================

-- Insert all authenticated users that don't exist in users table
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  CASE
    WHEN au.email = 'mail.soulstices@gmail.com' THEN 'founder'::user_role
    ELSE 'member'::user_role
  END,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Only insert users that don't exist
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STEP 10: Verification
-- ========================================

-- Show count comparison
SELECT 'Auth Users' as source, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Public Users' as source, COUNT(*) as count FROM public.users
ORDER BY source;

-- Show any missing users (should be empty now)
SELECT 'Missing Users' as status, COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- List all users in users table
SELECT
  id,
  email,
  name,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Verify trigger exists
SELECT 'on_auth_user_created trigger' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
       THEN '✅ Active' ELSE '❌ Missing' END as status;

-- Count policies
SELECT 'RLS Policies' as item,
       COUNT(*) || ' policies active' as status
FROM pg_policies
WHERE tablename = 'users';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ All users migrated! Trigger active for future signups!' as status;
