-- Fix Founder Role SQL Script
-- Run this in Supabase SQL Editor to set your account as founder

-- Step 1: Check current role
SELECT id, email, name, role, created_at
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';

-- Step 2: Update role to founder
UPDATE public.users
SET role = 'founder'
WHERE email = 'mail.soulstices@gmail.com';

-- Step 3: Verify the update
SELECT id, email, name, role, created_at
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';

-- Expected result: role should be 'founder'
