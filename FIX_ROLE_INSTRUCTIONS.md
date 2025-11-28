# Fix Founder Role - Step by Step Instructions

## 🎯 **EASIEST METHOD: Use Supabase Dashboard**

### Step 1: Go to Supabase
1. Open your browser
2. Go to: **https://supabase.com/dashboard**
3. Sign in to your Supabase account

### Step 2: Open Your Project
1. Find and click on your project: **mejsgjtnokcarssppdmx**
2. You should see the project dashboard

### Step 3: Open Table Editor
1. Look at the **left sidebar**
2. Click on **"Table Editor"** (it has a table icon 📋)
3. You'll see a list of your database tables

### Step 4: Open Users Table
1. In the list of tables, click on **"users"**
2. You'll see a spreadsheet-like view with all your users

### Step 5: Find Your Account
1. Look for the row with your email: **mail.soulstices@gmail.com**
2. If you can't find it, use the search/filter at the top

### Step 6: Edit the Role
1. In your account row, find the **"role"** column
2. Click on the cell showing your current role (probably "member" or "guest")
3. A text input will appear
4. Type: **founder**
5. Press **Enter** or click outside to save

### Step 7: Verify the Change
1. The cell should now show: **founder**
2. The change is saved automatically!

### Step 8: Test in Your App
1. Go back to: **http://localhost:5173**
2. If you're signed in, **sign out first** (very important!)
3. **Sign in again** with: mail.soulstices@gmail.com
4. Click your **avatar/name** in the top-right corner
5. You should now see:
   - 👑 **Founder** badge (purple)
   - ⚡ **Founder Dashboard** menu option

---

## 🎉 **SUCCESS! What You Should See:**

```
┌────────────────────────────────┐
│  [Avatar] Your Name         ▼  │  ← Click this
└────────────────────────────────┘
         │
         └──→ ┌──────────────────────────┐
              │  Your Name               │
              │  mail.soulstices@...     │
              │  👑 Founder              │  ← Should see this!
              ├──────────────────────────┤
              │  👤 My Profile           │
              │  📅 My Activities        │
              │  ⚡ Founder Dashboard   │  ← Should see this!
              ├──────────────────────────┤
              │  🚪 Sign Out             │
              └──────────────────────────┘
```

---

## 🐛 **Alternative Method: SQL Editor**

If Table Editor doesn't work, try this:

### Step 1: Go to SQL Editor
1. In Supabase dashboard (left sidebar)
2. Click **"SQL Editor"**
3. Click **"New query"**

### Step 2: Run This SQL
Copy and paste this into the editor:

```sql
-- Update role to founder
UPDATE public.users
SET role = 'founder'
WHERE email = 'mail.soulstices@gmail.com';

-- Check if it worked
SELECT email, name, role
FROM public.users
WHERE email = 'mail.soulstices@gmail.com';
```

### Step 3: Click "Run" Button
- At the bottom, click the green **"Run"** button
- You should see a success message
- The result should show your email with role = 'founder'

### Step 4: Test in Your App
- Follow Step 8 from above

---

## ❓ **Troubleshooting**

### "I can't find my email in the users table"
**Solution**: The user profile wasn't created. Run this SQL:

```sql
-- Check if you exist in auth.users
SELECT id, email FROM auth.users WHERE email = 'mail.soulstices@gmail.com';

-- If you see your ID, copy it and run:
INSERT INTO public.users (id, email, name, role)
VALUES (
  'YOUR-ID-HERE',  -- Replace with your ID from above
  'mail.soulstices@gmail.com',
  'Your Name',
  'founder'
);
```

### "The role changed but I still don't see Founder Dashboard"
**Solution**: Clear your browser session:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage" → Select your site
4. Click "Clear All"
5. Close browser completely
6. Open again and sign in

### "I get an error when trying to update"
**Solution**: Use SQL method instead of Table Editor

---

## 📸 **Visual Guide**

### What the Supabase Table Editor looks like:
```
┌─────────────────────────────────────────────────────┐
│ Table: users                                    [+] │
├────────┬─────────────────────┬──────────┬──────────┤
│   id   │       email         │   name   │   role   │
├────────┼─────────────────────┼──────────┼──────────┤
│ abc123 │ mail.soulstices@... │ Prush    │ member   │ ← Click here!
│ def456 │ user2@example.com   │ User 2   │ member   │
└────────┴─────────────────────┴──────────┴──────────┘
                                                    ↑
                                     Change this to "founder"
```

---

## ✅ **Checklist**

- [ ] Opened Supabase Dashboard
- [ ] Found users table
- [ ] Located my email row
- [ ] Changed role to "founder"
- [ ] Saved the change
- [ ] Signed out from app
- [ ] Signed in again
- [ ] Can see 👑 Founder badge
- [ ] Can see ⚡ Founder Dashboard option
- [ ] Founder Dashboard loads successfully

---

## 🆘 **Still Need Help?**

If nothing works:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Take a screenshot of any errors
4. Share with me and I'll help debug

---

**This should take about 2 minutes to complete!**

Good luck! 🚀
