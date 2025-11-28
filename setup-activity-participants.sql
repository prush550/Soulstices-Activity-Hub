-- ========================================
-- SETUP: Activity Participants Table & RLS Policies
-- ========================================
-- This creates the table for tracking which users have joined which activities
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: Create activity_participants table (if not exists)
-- ========================================

CREATE TABLE IF NOT EXISTS public.activity_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON public.activity_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_status ON public.activity_participants(status);

-- ========================================
-- STEP 2: Enable Row Level Security
-- ========================================

ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: Drop existing policies (if any)
-- ========================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'activity_participants') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.activity_participants', r.policyname);
    END LOOP;
END $$;

-- ========================================
-- STEP 4: Create RLS Policies
-- ========================================

-- Anyone authenticated can view participants
CREATE POLICY "Anyone can view activity participants"
ON public.activity_participants
FOR SELECT
TO authenticated
USING (true);

-- Users can join activities (insert their own participation)
CREATE POLICY "Users can join activities"
ON public.activity_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own participation
CREATE POLICY "Users can update own participation"
ON public.activity_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own participation
CREATE POLICY "Users can delete own participation"
ON public.activity_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Group admins can manage participants for their group's activities
CREATE POLICY "Group admins can manage activity participants"
ON public.activity_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.group_admins ga ON a.group_id = ga.group_id
    WHERE a.id = activity_participants.activity_id
    AND ga.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.group_admins ga ON a.group_id = ga.group_id
    WHERE a.id = activity_participants.activity_id
    AND ga.user_id = auth.uid()
  )
);

-- ========================================
-- STEP 5: Create function to auto-update participant counts
-- ========================================

-- Function to update current_participants count in activities table
CREATE OR REPLACE FUNCTION update_activity_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when someone joins (only if status is 'registered')
    IF NEW.status = 'registered' THEN
      UPDATE public.activities
      SET current_participants = COALESCE(current_participants, 0) + 1
      WHERE id = NEW.activity_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status = 'registered' AND NEW.status != 'registered' THEN
      -- Decrement if changing from registered to cancelled/attended
      UPDATE public.activities
      SET current_participants = GREATEST(COALESCE(current_participants, 0) - 1, 0)
      WHERE id = NEW.activity_id;
    ELSIF OLD.status != 'registered' AND NEW.status = 'registered' THEN
      -- Increment if changing to registered
      UPDATE public.activities
      SET current_participants = COALESCE(current_participants, 0) + 1
      WHERE id = NEW.activity_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when participation is deleted (only if was registered)
    IF OLD.status = 'registered' THEN
      UPDATE public.activities
      SET current_participants = GREATEST(COALESCE(current_participants, 0) - 1, 0)
      WHERE id = OLD.activity_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 6: Create trigger
-- ========================================

DROP TRIGGER IF EXISTS activity_participant_count_trigger ON public.activity_participants;

CREATE TRIGGER activity_participant_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.activity_participants
FOR EACH ROW
EXECUTE FUNCTION update_activity_participant_count();

-- ========================================
-- STEP 7: Initialize current_participants for existing activities
-- ========================================

-- Set current_participants to 0 for all activities that have NULL
UPDATE public.activities
SET current_participants = 0
WHERE current_participants IS NULL;

-- Count existing participants and update
UPDATE public.activities a
SET current_participants = (
  SELECT COUNT(*)
  FROM public.activity_participants ap
  WHERE ap.activity_id = a.id AND ap.status = 'registered'
);

-- ========================================
-- STEP 8: Verify setup
-- ========================================

-- Check table exists
SELECT 'activity_participants table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_participants')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- Check RLS is enabled
SELECT 'Row Level Security' as item,
       CASE WHEN relrowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_class
WHERE relname = 'activity_participants';

-- Check policies
SELECT 'RLS Policies' as item,
       COUNT(*) || ' policies created' as status
FROM pg_policies
WHERE tablename = 'activity_participants';

-- Show all policies
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'activity_participants'
ORDER BY policyname;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Activity Participants table is ready!' as status;
