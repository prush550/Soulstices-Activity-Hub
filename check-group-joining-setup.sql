-- ========================================
-- DIAGNOSTIC: Check Group Joining Setup
-- ========================================
-- Run this in Supabase SQL Editor to verify setup

-- Check if group_members table exists
SELECT 'group_members table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_members' AND schemaname = 'public')
       THEN '✅ Exists' ELSE '❌ Missing - Run setup-group-joining.sql' END as status;

-- Check if RLS is enabled on group_members
SELECT 'Row Level Security on group_members' as item,
       CASE WHEN relrowsecurity THEN '✅ Enabled' ELSE '❌ Disabled - Run setup-group-joining.sql' END as status
FROM pg_class
WHERE relname = 'group_members' AND relnamespace = 'public'::regnamespace;

-- Check RLS policies on group_members
SELECT 'RLS Policies on group_members' as item,
       COUNT(*) || ' policies' as status
FROM pg_policies
WHERE tablename = 'group_members';

-- List all policies
SELECT 'Policy: ' || policyname as item,
       cmd || ' - ' || roles::text as status
FROM pg_policies
WHERE tablename = 'group_members'
ORDER BY policyname;

-- Check if invite_code column exists on groups table
SELECT 'invite_code column on groups' as item,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'groups'
         AND column_name = 'invite_code'
         AND table_schema = 'public'
       )
       THEN '✅ Exists' ELSE '❌ Missing - Run setup-group-joining.sql' END as status;

-- Check member count trigger
SELECT 'group_member_count_trigger' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'group_member_count_trigger')
       THEN '✅ Created' ELSE '❌ Missing - Run setup-group-joining.sql' END as status;

-- Test query: Can authenticated user insert their own membership?
SELECT '✅ Setup appears complete!' as message
WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Users can join groups');

-- If setup is incomplete, show this message
SELECT '❌ Setup incomplete! Run setup-group-joining.sql in Supabase SQL Editor' as message
WHERE NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Users can join groups');
