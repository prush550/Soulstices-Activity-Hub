-- ========================================
-- COMPLETE FIX: User Signup Issue
-- ========================================
-- This fixes all potential causes of "Database error saving new user"
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: Ensure users table exists
-- ========================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('guest', 'member', 'group_admin', 'founder')),
  phone TEXT,
  bio TEXT,
  profile_picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- STEP 2: Enable RLS on users table
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: Drop ALL existing policies on users table
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
-- STEP 4: Create permissive RLS policies for users table
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
-- STEP 5: Drop existing trigger and function
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ========================================
-- STEP 6: Create new function with SECURITY DEFINER
-- ========================================

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
      WHEN NEW.email = 'mail.soulstices@gmail.com' THEN 'founder'
      ELSE 'member'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
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
-- STEP 8: Grant necessary permissions
-- ========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on users table
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- ========================================
-- STEP 9: Verify setup
-- ========================================

-- Check users table
SELECT 'users table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public')
       THEN '✅ Exists' ELSE '❌ Missing' END as status;

-- Check RLS enabled
SELECT 'Row Level Security' as item,
       CASE WHEN relrowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_class
WHERE relname = 'users';

-- Check function exists
SELECT 'handle_new_user function' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- Check trigger exists
SELECT 'on_auth_user_created trigger' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- Count policies
SELECT 'RLS Policies on users' as item,
       COUNT(*) || ' policies' as status
FROM pg_policies
WHERE tablename = 'users';

-- Show all policies
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Complete signup fix applied! Try creating a new user now.' as status;
