-- ========================================
-- FIX: Create User Profile and Setup Trigger
-- ========================================
-- Run this SQL in Supabase SQL Editor to fix the missing user profile issue

-- STEP 1: Check if you exist in auth.users (you should see your email)
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
WHERE email = 'mail.soulstices@gmail.com';

-- Copy the 'id' from the result above, you'll need it for Step 2


-- STEP 2: Create your user profile manually
-- IMPORTANT: Replace 'YOUR-USER-ID-HERE' with the actual ID from Step 1
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
  'YOUR-USER-ID-HERE',  -- ⚠️ REPLACE THIS with your auth user ID
  'mail.soulstices@gmail.com',
  'Prush',  -- Change this to your actual name if needed
  'founder',
  NOW(),
  NOW()
);

-- STEP 3: Verify your profile was created
SELECT id, email, name, role, created_at
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';
-- You should see your profile with role = 'founder'


-- ========================================
-- STEP 4: Setup Automatic Profile Creation for Future Users
-- ========================================
-- This creates a trigger so future signups automatically create profiles

-- Create the function that will create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    -- Automatically assign 'founder' role to your email, 'member' to others
    CASE
      WHEN NEW.email = 'mail.soulstices@gmail.com' THEN 'founder'
      ELSE 'member'
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that calls the function on new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Verify the trigger was created
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- You should see the trigger listed


-- ========================================
-- DONE! Summary of what we did:
-- ========================================
-- 1. Created your missing user profile in public.users table
-- 2. Set your role to 'founder'
-- 3. Created a trigger so future signups automatically create profiles
-- 4. Configured the trigger to automatically assign 'founder' to your email

-- Next steps:
-- 1. Go to your app: http://localhost:5173
-- 2. Sign out (if signed in)
-- 3. Sign in again
-- 4. You should now see the 👑 Founder badge and Founder Dashboard!
