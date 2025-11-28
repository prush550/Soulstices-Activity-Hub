-- ========================================
-- FIX: Row Level Security Policies (Version 2)
-- ========================================
-- This version drops ALL existing policies first, then creates new ones

-- ========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ========================================

-- Drop ALL policies from group_admins
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'group_admins') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.group_admins', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from groups
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'groups') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.groups', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from activities
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'activities') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies from users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- ========================================
-- STEP 2: CREATE NEW POLICIES
-- ========================================

-- ========================================
-- 2.1 group_admins TABLE
-- ========================================

-- Founders can manage group admins
CREATE POLICY "Founders can manage group admins"
ON public.group_admins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'founder'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'founder'
  )
);

-- Anyone can view group admins
CREATE POLICY "Anyone can view group admins"
ON public.group_admins
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- 2.2 groups TABLE
-- ========================================

-- Anyone can view groups
CREATE POLICY "Anyone can view groups"
ON public.groups
FOR SELECT
TO anon, authenticated
USING (true);

-- Founders can manage groups
CREATE POLICY "Founders can manage groups"
ON public.groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'founder'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'founder'
  )
);

-- ========================================
-- 2.3 activities TABLE
-- ========================================

-- Anyone can view activities
CREATE POLICY "Anyone can view activities"
ON public.activities
FOR SELECT
TO anon, authenticated
USING (true);

-- Group admins can create activities for their groups
CREATE POLICY "Group admins can create activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_admins
    WHERE group_admins.user_id = auth.uid()
    AND group_admins.group_id = activities.group_id
  )
);

-- Creators can update their activities
CREATE POLICY "Creators can update their activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Creators can delete their activities
CREATE POLICY "Creators can delete their activities"
ON public.activities
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- ========================================
-- 2.4 users TABLE
-- ========================================

-- Anyone can view user profiles
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Founders can update any user's profile
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
-- STEP 3: VERIFY POLICIES
-- ========================================

SELECT
  tablename,
  policyname,
  cmd,
  CASE WHEN roles = '{authenticated}' THEN 'authenticated'
       WHEN roles = '{anon,authenticated}' THEN 'anon, authenticated'
       ELSE roles::text
  END as roles
FROM pg_policies
WHERE tablename IN ('group_admins', 'groups', 'activities', 'users')
ORDER BY tablename, policyname;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ All RLS policies have been successfully configured!' as status;
