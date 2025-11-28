-- ========================================
-- FIX: User Signup Trigger
-- ========================================
-- This fixes the "Database error saving new user" issue
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: Drop existing trigger if any
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ========================================
-- STEP 2: Create function to handle new user signup
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 3: Create trigger
-- ========================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 4: Verify setup
-- ========================================

-- Check if function exists
SELECT 'handle_new_user function' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- Check if trigger exists
SELECT 'on_auth_user_created trigger' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
       THEN '✅ Created' ELSE '❌ Missing' END as status;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Signup trigger fixed! You can now create new users.' as status;
