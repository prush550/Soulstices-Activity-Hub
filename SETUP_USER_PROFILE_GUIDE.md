# Fix Missing User Profile - Step by Step Guide

## 🔍 **Problem Identified**

Your email exists in **Authentication → Users** but NOT in **Table Editor → users table**.

This happened because:
- The database trigger to create user profiles is missing or didn't work
- When you signed up, only the auth account was created
- The user profile in `public.users` table was never created

---

## ✅ **Solution: Create Your User Profile**

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project: `mejsgjtnokcarssppdmx`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

---

### **Step 2: Get Your User ID**

Copy and paste this SQL, then click **RUN**:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'mail.soulstices@gmail.com';
```

**You'll see something like this:**
```
id: 12345678-abcd-1234-abcd-123456789abc
email: mail.soulstices@gmail.com
created_at: 2024-11-26 ...
```

**📋 COPY THE ID** - You'll need it for the next step!

---

### **Step 3: Create Your User Profile**

Copy this SQL, **REPLACE `YOUR-USER-ID-HERE`** with the ID you copied above, then click **RUN**:

```sql
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
  'YOUR-USER-ID-HERE',  -- ⚠️ REPLACE THIS!
  'mail.soulstices@gmail.com',
  'Prush',  -- Change to your name if needed
  'founder',
  NOW(),
  NOW()
);
```

**Example** (with a fake ID):
```sql
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
  '12345678-abcd-1234-abcd-123456789abc',  -- Your actual ID here
  'mail.soulstices@gmail.com',
  'Prush',
  'founder',
  NOW(),
  NOW()
);
```

You should see: **"Success. 1 row affected."**

---

### **Step 4: Verify It Worked**

Run this SQL:

```sql
SELECT id, email, name, role
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';
```

**You should see:**
```
email: mail.soulstices@gmail.com
name: Prush
role: founder  ← This is what we want!
```

---

### **Step 5: Check in Table Editor**

1. Go to **Table Editor** in Supabase
2. Click on **"users"** table
3. **You should now see your email** with role = founder!

---

### **Step 6: Test in Your App**

1. Go to: http://localhost:5173
2. **Sign out** if you're signed in
3. **Sign in again** with mail.soulstices@gmail.com
4. Click your avatar in top-right
5. **You should now see:**
   - 👑 **Founder** badge (purple)
   - ⚡ **Founder Dashboard** menu option

---

## 🔧 **Step 7: Setup Automatic Profile Creation (Important!)**

To prevent this issue for future users, run this SQL to create a trigger:

```sql
-- Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

Click **RUN**. You should see: **"Success"**

Now, whenever someone signs up, their profile will be automatically created!

---

## 📋 **Quick Checklist**

- [ ] Ran Step 2 - Got my user ID
- [ ] Ran Step 3 - Created user profile (replaced ID)
- [ ] Ran Step 4 - Verified profile exists
- [ ] Checked Table Editor - See my email in users table
- [ ] Ran Step 7 - Created trigger for future users
- [ ] Signed out from app
- [ ] Signed in again
- [ ] See 👑 Founder badge
- [ ] See ⚡ Founder Dashboard option
- [ ] Founder Dashboard loads successfully

---

## ⚠️ **Common Mistakes**

### ❌ "duplicate key value violates unique constraint"
**Cause**: You already have a profile
**Solution**: Check Table Editor, your profile might already exist

### ❌ "null value in column 'id' violates not-null constraint"
**Cause**: You forgot to replace `YOUR-USER-ID-HERE`
**Solution**: Go back to Step 2 and copy your actual user ID

### ❌ "insert or update on table 'users' violates foreign key constraint"
**Cause**: The ID you used doesn't exist in auth.users
**Solution**: Double-check you copied the correct ID from Step 2

---

## 🎉 **Expected Result**

After completing all steps:

1. **In Supabase Table Editor:**
   ```
   users table:
   ┌──────────────────────┬──────────┬─────────┐
   │ email                │ name     │ role    │
   ├──────────────────────┼──────────┼─────────┤
   │ mail.soulstices@...  │ Prush    │ founder │
   └──────────────────────┴──────────┴─────────┘
   ```

2. **In Your App (after signing in):**
   ```
   Navbar → Avatar → Dropdown:
   ┌──────────────────────────┐
   │  Prush                   │
   │  mail.soulstices@...     │
   │  👑 Founder              │  ← You'll see this!
   ├──────────────────────────┤
   │  👤 My Profile           │
   │  📅 My Activities        │
   │  ⚡ Founder Dashboard   │  ← You'll see this!
   ├──────────────────────────┤
   │  🚪 Sign Out             │
   └──────────────────────────┘
   ```

---

## 📄 **Alternative: Use the SQL File**

I've created a complete SQL file with all the commands:
- **File**: `setup-user-profile.sql`
- Open it in a text editor
- Follow the instructions inside
- Copy and paste into Supabase SQL Editor

---

## 🆘 **Still Having Issues?**

If it still doesn't work after following all steps:
1. Take a screenshot of the SQL results from Step 4
2. Take a screenshot of your Table Editor showing the users table
3. Open browser DevTools (F12) → Console tab
4. Take a screenshot of any errors
5. Share these with me and I'll help debug further

---

**This should take about 5 minutes to complete!**

Good luck! 🚀
