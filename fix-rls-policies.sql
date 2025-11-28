-- ========================================
-- FIX: Row Level Security Policies
-- ========================================
-- This script sets up proper RLS policies for all tables

-- ========================================
-- 1. FIX group_admins TABLE
-- ========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Founders can manage group admins" ON public.group_admins;
DROP POLICY IF EXISTS "Group admins can view their assignments" ON public.group_admins;
DROP POLICY IF EXISTS "Anyone can view group admins" ON public.group_admins;

-- Create new policies
-- Allow founders to insert/update/delete group admins
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

-- Allow anyone to view group admins (needed for displaying admin info)
CREATE POLICY "Anyone can view group admins"
ON public.group_admins
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- 2. FIX groups TABLE
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
DROP POLICY IF EXISTS "Founders can manage groups" ON public.groups;

-- Allow anyone (even guests) to view groups
CREATE POLICY "Anyone can view groups"
ON public.groups
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow founders to create/update/delete groups
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
-- 3. FIX activities TABLE
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view activities" ON public.activities;
DROP POLICY IF EXISTS "Group admins can manage their activities" ON public.activities;
DROP POLICY IF EXISTS "Creators can manage their activities" ON public.activities;

-- Allow anyone (even guests) to view activities
CREATE POLICY "Anyone can view activities"
ON public.activities
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow group admins to create activities for their groups
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

-- Allow users to update/delete their own activities
CREATE POLICY "Creators can manage their activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can delete their activities"
ON public.activities
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- ========================================
-- 4. FIX users TABLE
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Founders can update any profile" ON public.users;

-- Allow anyone to view user profiles (needed for displaying names, etc.)
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

-- Allow founders to update any user's role
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
-- 5. VERIFY POLICIES ARE CREATED
-- ========================================

-- Check group_admins policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'group_admins';

-- Check groups policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'groups';

-- Check activities policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'activities';

-- Check users policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users';

-- ========================================
-- DONE!
-- ========================================
-- After running this script:
-- 1. Founders can create groups and assign admins
-- 2. Group admins can create activities for their groups
-- 3. Users can view all public data
-- 4. Users can only edit/delete their own content
