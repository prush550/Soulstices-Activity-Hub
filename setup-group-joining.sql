-- ========================================
-- SETUP: Group Joining Feature
-- ========================================
-- This sets up everything needed for users to join groups
-- Supports: Public, Invite-Only, and Screening types
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: Add invite_code column to groups table
-- ========================================

-- Add invite_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'groups' AND column_name = 'invite_code') THEN
        ALTER TABLE public.groups ADD COLUMN invite_code TEXT;
    END IF;
END $$;

-- Create index for faster invite code lookups
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);

-- ========================================
-- STEP 2: Ensure group_members table exists
-- ========================================

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  application_data JSONB,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);

-- ========================================
-- STEP 3: Enable Row Level Security
-- ========================================

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Drop existing policies on group_members
-- ========================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'group_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.group_members', r.policyname);
    END LOOP;
END $$;

-- ========================================
-- STEP 5: Create RLS Policies for group_members
-- ========================================

-- Anyone authenticated can view approved group members
CREATE POLICY "Anyone can view approved group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (status = 'approved' OR user_id = auth.uid());

-- Users can apply to join groups (insert their own membership)
CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own membership applications
CREATE POLICY "Users can view own memberships"
ON public.group_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can cancel their own pending applications
CREATE POLICY "Users can update own pending memberships"
ON public.group_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups"
ON public.group_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Group admins can manage members for their groups
CREATE POLICY "Group admins can manage group members"
ON public.group_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_admins ga
    WHERE ga.group_id = group_members.group_id
    AND ga.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_admins ga
    WHERE ga.group_id = group_members.group_id
    AND ga.user_id = auth.uid()
  )
);

-- ========================================
-- STEP 6: Create function to auto-update member counts
-- ========================================

CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when someone joins (only if status is 'approved')
    IF NEW.status = 'approved' THEN
      UPDATE public.groups
      SET member_count = COALESCE(member_count, 0) + 1
      WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      -- Increment if changing to approved
      UPDATE public.groups
      SET member_count = COALESCE(member_count, 0) + 1
      WHERE id = NEW.group_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      -- Decrement if changing from approved
      UPDATE public.groups
      SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0)
      WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when membership is deleted (only if was approved)
    IF OLD.status = 'approved' THEN
      UPDATE public.groups
      SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0)
      WHERE id = OLD.group_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 7: Create trigger for member count
-- ========================================

DROP TRIGGER IF EXISTS group_member_count_trigger ON public.group_members;

CREATE TRIGGER group_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_member_count();

-- ========================================
-- STEP 8: Initialize member_count for existing groups
-- ========================================

-- Set member_count to 0 for all groups that have NULL
UPDATE public.groups
SET member_count = 0
WHERE member_count IS NULL;

-- Count existing approved members and update
UPDATE public.groups g
SET member_count = (
  SELECT COUNT(*)
  FROM public.group_members gm
  WHERE gm.group_id = g.id AND gm.status = 'approved'
);

-- ========================================
-- STEP 9: Update groups table policies (if needed)
-- ========================================

-- Drop existing policies on groups table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'groups') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.groups', r.policyname);
    END LOOP;
END $$;

-- Recreate groups table policies
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

-- Group admins can update their groups
CREATE POLICY "Group admins can update their groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_admins ga
    WHERE ga.group_id = groups.id
    AND ga.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_admins ga
    WHERE ga.group_id = groups.id
    AND ga.user_id = auth.uid()
  )
);

-- ========================================
-- STEP 10: Verify setup
-- ========================================

-- Check invite_code column exists
SELECT 'invite_code column on groups' as item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'groups' AND column_name = 'invite_code')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- Check group_members table exists
SELECT 'group_members table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_members')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- Check RLS is enabled
SELECT 'Row Level Security' as item,
       CASE WHEN relrowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_class
WHERE relname = 'group_members';

-- Check policies
SELECT 'RLS Policies (group_members)' as item,
       COUNT(*) || ' policies created' as status
FROM pg_policies
WHERE tablename = 'group_members';

SELECT 'RLS Policies (groups)' as item,
       COUNT(*) || ' policies created' as status
FROM pg_policies
WHERE tablename = 'groups';

-- Show all group_members policies
SELECT 'Group Members Policies:' as info, policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'group_members'
ORDER BY policyname;

-- Show all groups policies
SELECT 'Groups Policies:' as info, policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY policyname;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Group Joining feature is ready!' as status;
