# Fix: "Database error saving new user" - Signup Error

## Problem
When trying to sign up a new user, you get the error: **"Database error saving new user"**

## Root Cause
The database trigger that automatically creates user profiles in the `public.users` table when a new user signs up is either:
1. Missing
2. Has an error
3. Was accidentally deleted

## Solution

### Step 1: Run the Fix Script
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/mejsgjtnokcarssppdmx/sql
2. Open the file: `fix-signup-trigger.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. Wait for success message: "✅ Signup trigger fixed! You can now create new users."

### Step 2: Verify the Fix
After running the script, check:

1. **Function exists:**
   - Go to Supabase → Database → Functions
   - Look for `handle_new_user`
   - Should be present

2. **Trigger exists:**
   - Go to Supabase → Database → Triggers
   - Look for `on_auth_user_created`
   - Should be present on `auth.users` table

### Step 3: Test Signup
1. Go to your app: http://localhost:5173/signup
2. Fill in the signup form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Sign Up"
4. **Expected:** Email verification message appears
5. Check your email and verify
6. **Expected:** Can sign in successfully

### Step 4: Verify Database
After successful signup:

1. Go to Supabase → Authentication → Users
2. **Expected:** New user appears in the list

3. Go to Supabase → Table Editor → users
4. **Expected:** User profile exists with:
   - Same email
   - Role: "member" (or "founder" if email is mail.soulstices@gmail.com)
   - Name filled in
   - created_at and updated_at timestamps

## What the Fix Does

The `fix-signup-trigger.sql` script:

1. **Drops old trigger/function** (if exists)
2. **Creates new function** `handle_new_user()` that:
   - Inserts a record into `public.users` when someone signs up
   - Extracts name from signup metadata
   - Sets role to "founder" for mail.soulstices@gmail.com
   - Sets role to "member" for everyone else
   - Sets timestamps

3. **Creates trigger** `on_auth_user_created` that:
   - Fires AFTER INSERT on auth.users
   - Calls the handle_new_user() function
   - Runs for each new user

## If It Still Doesn't Work

### Check Console Errors
1. Open browser console (F12)
2. Go to Console tab
3. Try signing up again
4. Look for error messages
5. Share the exact error message

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Select "Postgres Logs"
4. Look for errors around the time you tried to sign up
5. Share any error messages you find

### Manual User Creation (Temporary Workaround)
If the trigger still doesn't work, you can manually create users:

1. Sign up through the app (will fail, but user created in auth.users)
2. Go to Supabase → Authentication → Users
3. Copy the user's UUID
4. Go to Supabase → SQL Editor
5. Run this query (replace values):

```sql
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
  'USER_UUID_HERE',
  'user@example.com',
  'User Name',
  'member',
  NOW(),
  NOW()
);
```

6. User can now sign in successfully

## Prevention

To prevent this issue in the future:

1. **Don't manually delete triggers** in Supabase Dashboard
2. **Always run setup scripts** when setting up new features
3. **Keep backups** of important SQL scripts
4. **Test signup** after running any database migrations

## Related Issues

This error can also occur if:

1. **RLS policies are too restrictive** on users table
   - Solution: Run `fix-rls-policies-v2.sql`

2. **users table doesn't exist**
   - Solution: Run `setup-user-profile.sql`

3. **Database connection issues**
   - Solution: Check Supabase dashboard for outages

## Quick Verification Commands

Run these in Supabase SQL Editor to check everything:

```sql
-- Check if function exists
SELECT COUNT(*) as function_exists
FROM pg_proc
WHERE proname = 'handle_new_user';
-- Should return: 1

-- Check if trigger exists
SELECT COUNT(*) as trigger_exists
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
-- Should return: 1

-- Check users table
SELECT COUNT(*) as table_exists
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';
-- Should return: 1
```

All three should return `1`. If any return `0`, that's the problem.

---

**Status:** Run `fix-signup-trigger.sql` to resolve
**Priority:** High - Blocks new user registration
**Impact:** Cannot create new users until fixed
