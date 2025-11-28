-- ========================================
-- RESTORE FOUNDER ROLE
-- ========================================
-- This script restores your founder role if it was changed to group_admin

-- Step 1: Check your current role
SELECT id, email, name, role
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';

-- Step 2: Restore founder role
UPDATE public.users
SET role = 'founder'
WHERE email = 'mail.soulstices@gmail.com';

-- Step 3: Verify the change
SELECT id, email, name, role
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';

-- Step 4: Verify you're still a group admin in the group_admins table
SELECT
  ga.id,
  g.name as group_name,
  u.name as admin_name,
  u.email,
  u.role as user_role
FROM public.group_admins ga
JOIN public.groups g ON g.id = ga.group_id
JOIN public.users u ON u.id = ga.user_id
WHERE u.email = 'mail.soulstices@gmail.com';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Founder role restored! You should now see BOTH dashboards.' as message;

-- ========================================
-- NEXT STEPS
-- ========================================
-- After running this:
-- 1. Sign out from the app
-- 2. Sign in again
-- 3. Click your avatar
-- 4. You should see:
--    - ⚡ Founder Dashboard
--    - 🎯 Group Admin Dashboard
