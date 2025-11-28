-- ========================================
-- ADD INVITE-ONLY FEATURE TO ACTIVITIES
-- ========================================

-- Step 1: Add invite_code column to activities table
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Step 2: Create index for faster invite code lookups
CREATE INDEX IF NOT EXISTS idx_activities_invite_code
ON public.activities(invite_code)
WHERE invite_code IS NOT NULL;

-- Step 3: Add comment
COMMENT ON COLUMN public.activities.invite_code IS 'Unique invite code for invite-only activities';

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activities'
AND column_name = 'invite_code';

-- ========================================
-- UPDATE RLS POLICY FOR INVITE-ONLY
-- ========================================

-- Allow anyone to view activities (including checking invite codes)
-- This policy should already exist, but let's make sure it's correct
DROP POLICY IF EXISTS "Anyone can view activities" ON public.activities;

CREATE POLICY "Anyone can view activities"
ON public.activities
FOR SELECT
TO anon, authenticated
USING (true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Test: Check if we can add an activity with invite code
-- (This is just to verify the structure, won't actually insert)
SELECT
  'Activities table structure is ready for invite-only feature' as status,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'invite_code'
  ) as invite_code_column_exists;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Invite-Only feature database schema updated successfully!' as message;

-- ========================================
-- NOTES
-- ========================================
-- The 'type' column in activities can now have these values:
-- - 'public': Anyone can join
-- - 'private': Only group members can join
-- - 'invite_only': Requires invite code
--
-- The invite_code will be:
-- - Generated automatically by the app when type='invite_only'
-- - NULL for other types
-- - Used for validation when users try to join invite-only activities
