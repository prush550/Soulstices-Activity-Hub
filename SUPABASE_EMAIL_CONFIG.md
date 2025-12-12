# Supabase Email Configuration Fix

## Issue
Email confirmation links are failing with redirect errors.

## Solution: Configure Redirect URLs in Supabase

### Step 1: Add Redirect URLs in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **Soulstices Activity Hub** project
3. Click **Authentication** → **URL Configuration** (in left sidebar)
4. Under **"Redirect URLs"** section, add these URLs:

#### For Local Development:
```
http://localhost:5173/signin
http://localhost:5174/signin
```

#### For Production (Vercel):
```
https://your-vercel-url.vercel.app/signin
```
*Replace `your-vercel-url` with your actual Vercel deployment URL*

5. Click **Save**

### Step 2: Configure Email Templates (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Click on **"Confirm signup"** template
3. Make sure the confirmation link points to: `{{ .ConfirmationURL }}`
4. The redirect will now properly go to `/signin` page

### Step 3: Test Signup Flow

1. **Sign up** with a new email
2. **Check email** for confirmation link
3. **Click the link** - should redirect to `/signin` page
4. **Sign in** with your new credentials

## What Was Fixed in Code

### AuthContext.jsx
- **Line 96**: Changed `emailRedirectTo` from `/` to `/signin`
- **Lines 75-87**: Added check for existing users before signup
- **Lines 102-108**: Added additional check for duplicate email attempts

## Expected Behavior After Fix

### Duplicate Email Signup:
- ❌ **Before**: Allowed signup, sent fake confirmation email
- ✅ **After**: Shows error "An account with this email already exists. Please sign in instead."

### Email Confirmation:
- ❌ **Before**: Redirect error when clicking confirmation link
- ✅ **After**: Successfully redirects to `/signin` page where user can log in

## Troubleshooting

### If confirmation still fails:
1. Check that redirect URL is added in Supabase Dashboard
2. Verify the URL exactly matches your deployment URL
3. Make sure there are no trailing slashes
4. Try logging out and clearing browser cache

### If "user already exists" check doesn't work:
- The user might exist in `auth.users` but not in `public.users`
- Run the `fix-missing-users-v2.sql` script to sync them
