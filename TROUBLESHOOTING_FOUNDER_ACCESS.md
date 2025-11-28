# Troubleshooting: Founder Badge & Dashboard Not Showing

## 🔍 Problem
After logging in with mail.soulstices@gmail.com, you don't see:
- 👑 Founder badge in the user menu
- ⚡ Founder Dashboard option in the dropdown

---

## 🎯 Root Cause
Your user account's `role` in the database is not set to `'founder'`. It's likely set to `'member'` or `'guest'`.

---

## ✅ Solution: 3 Methods to Fix

### **Method 1: Using the HTML Tool (Easiest)** ⭐ RECOMMENDED

1. **Open the fix tool**:
   - Navigate to: `file:///c:/Soulstices/Soulstices-Activity-Hub/fix-founder-role.html`
   - Or open `fix-founder-role.html` directly in your browser

2. **Follow the 3 steps in the tool**:
   - Click "1. Check Current Role" → See your current role
   - Click "2. Fix Role to Founder" → Update to founder
   - Click "3. Verify Fix" → Confirm the change

3. **Refresh your app**:
   - Go back to http://localhost:5173
   - Sign out (if signed in)
   - Sign in again with mail.soulstices@gmail.com
   - You should now see the 👑 Founder badge!

---

### **Method 2: Using Supabase Dashboard (Most Reliable)** ⭐

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Select project: `mejsgjtnokcarssppdmx`

2. **Open SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the SQL script**:
   ```sql
   -- Check current role
   SELECT id, email, name, role
   FROM public.users
   WHERE email = 'mail.soulstices@gmail.com';

   -- Update to founder
   UPDATE public.users
   SET role = 'founder'
   WHERE email = 'mail.soulstices@gmail.com';

   -- Verify
   SELECT id, email, name, role
   FROM public.users
   WHERE email = 'mail.soulstices@gmail.com';
   ```

4. **Alternative: Edit in Table Editor**:
   - Go to "Table Editor" in left sidebar
   - Click on `users` table
   - Find your email: mail.soulstices@gmail.com
   - Click on the `role` cell
   - Change it to: `founder`
   - Press Enter to save

5. **Refresh your app and sign in again**

---

### **Method 3: Using SQL File**

1. **Open** `fix-founder-role.sql` in a text editor
2. **Copy** all the SQL code
3. **Paste** into Supabase SQL Editor
4. **Run** the queries
5. **Refresh** your app and sign in again

---

## 🔍 Verification Steps

After fixing the role, verify it's working:

### 1. Check the Database
Run this query in Supabase SQL Editor:
```sql
SELECT email, name, role
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';
```
**Expected result**: `role = 'founder'`

### 2. Check in Your App
1. Go to http://localhost:5173
2. **Sign out** if you're signed in (important!)
3. **Sign in** again with mail.soulstices@gmail.com
4. Click your **avatar/name** in the top-right
5. **Expected to see**:
   - Purple badge: 👑 Founder
   - Menu option: ⚡ Founder Dashboard

### 3. Test Dashboard Access
1. Click "⚡ Founder Dashboard"
2. **Expected**: See the dashboard with 4 tabs
3. **If you see "Access Denied"**: The role didn't update correctly

---

## 🐛 Still Not Working? Advanced Troubleshooting

### Issue 1: User Profile Not Created
**Symptom**: SQL query returns no rows

**Solution**:
1. Check if user exists in `auth.users`:
   ```sql
   SELECT id, email, created_at
   FROM auth.users
   WHERE email = 'mail.soulstices@gmail.com';
   ```

2. If exists but not in `public.users`, manually create profile:
   ```sql
   INSERT INTO public.users (id, email, name, role)
   VALUES (
     '(your-auth-user-id-from-above)',
     'mail.soulstices@gmail.com',
     'Your Name',
     'founder'
   );
   ```

### Issue 2: Database Trigger Issue
**Symptom**: New signups don't create user profiles

**Solution**: Check if this trigger exists in Supabase:
```sql
-- Check for trigger
SELECT * FROM information_schema.triggers
WHERE trigger_name LIKE '%user%';

-- If missing, create trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    CASE
      WHEN NEW.email = 'mail.soulstices@gmail.com' THEN 'founder'
      ELSE 'member'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Issue 3: RLS (Row Level Security) Blocking Updates
**Symptom**: SQL query runs but doesn't update

**Solution**: Disable RLS temporarily or update policies:
```sql
-- Check current policies
SELECT * FROM pg_policies
WHERE tablename = 'users';

-- Temporarily disable RLS (for testing only!)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Update the role
UPDATE public.users
SET role = 'founder'
WHERE email = 'mail.soulstices@gmail.com';

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Issue 4: Browser Cache Issue
**Symptom**: Role is correct in database but app doesn't show it

**Solution**:
1. Open browser DevTools (F12)
2. Go to "Application" tab
3. Clear:
   - Local Storage → Clear all
   - Session Storage → Clear all
   - Cookies → Clear all
4. Close browser completely
5. Reopen and sign in again

### Issue 5: Auth Context Not Updating
**Symptom**: Role is founder but `isFounder` is false

**Solution**: Check AuthContext is working:
1. Open DevTools → Console
2. Type:
   ```javascript
   localStorage.getItem('soulstices-auth')
   ```
3. If null, session expired
4. Sign out and sign in again

---

## 📋 Complete Checklist

Use this checklist to diagnose the issue:

- [ ] User exists in `public.users` table
- [ ] User's email is exactly `mail.soulstices@gmail.com`
- [ ] User's role is set to `founder` (not `member` or `guest`)
- [ ] Signed out and signed in again after fixing role
- [ ] Cleared browser cache/localStorage
- [ ] Can see user profile when signed in
- [ ] Navbar shows user avatar with name
- [ ] Dropdown menu appears when clicking avatar
- [ ] Founder badge (👑) shows in dropdown
- [ ] "Founder Dashboard" option shows in dropdown
- [ ] Clicking "Founder Dashboard" navigates to `/founder-dashboard`
- [ ] Dashboard page loads without "Access Denied" error

---

## 🆘 Quick Commands

### Check if role is founder:
```sql
SELECT role FROM public.users WHERE email = 'mail.soulstices@gmail.com';
```

### Set role to founder:
```sql
UPDATE public.users SET role = 'founder' WHERE email = 'mail.soulstices@gmail.com';
```

### Check all users and their roles:
```sql
SELECT email, name, role FROM public.users ORDER BY created_at;
```

### Delete and recreate user profile (nuclear option):
```sql
-- Delete from public.users only (NOT from auth.users!)
DELETE FROM public.users WHERE email = 'mail.soulstices@gmail.com';

-- Recreate with founder role
-- Get auth user id first:
SELECT id FROM auth.users WHERE email = 'mail.soulstices@gmail.com';

-- Then insert:
INSERT INTO public.users (id, email, name, role)
VALUES ('your-auth-id-here', 'mail.soulstices@gmail.com', 'Your Name', 'founder');
```

---

## 📞 Need More Help?

If none of these solutions work:

1. **Share the output** of this query:
   ```sql
   SELECT
     u.id,
     u.email,
     u.name,
     u.role,
     u.created_at,
     (SELECT id FROM auth.users WHERE email = u.email) as auth_id
   FROM public.users u
   WHERE u.email = 'mail.soulstices@gmail.com';
   ```

2. **Check browser console** (F12 → Console) for any errors

3. **Check Network tab** (F12 → Network) when loading the page

---

## ✅ Success Indicators

You've successfully fixed the issue when you see:

1. ✅ In Supabase: `role = 'founder'`
2. ✅ In app navbar: Purple 👑 Founder badge
3. ✅ In dropdown menu: "⚡ Founder Dashboard" option
4. ✅ Dashboard loads: 4 tabs visible (Overview, Create Group, Assign Admin, Manage Groups)
5. ✅ No "Access Denied" error

---

**Last Updated**: November 26, 2024
