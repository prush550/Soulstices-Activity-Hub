# Fix Row Level Security (RLS) Error - Quick Guide

## 🔍 **Problem**

Error: `new row violates row-level security policy for table "group_admins"`

This happens because Supabase's Row Level Security (RLS) is blocking you from inserting data into the `group_admins` table.

---

## ✅ **Solution: Run the RLS Fix Script**

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project: `mejsgjtnokcarssppdmx`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### **Step 2: Copy and Run the SQL Script**

1. Open the file: `fix-rls-policies.sql` in a text editor
2. **Copy ALL the SQL code** from the file
3. **Paste** it into the Supabase SQL Editor
4. Click the **"Run"** button (green play button)

### **Step 3: Wait for Success**

You should see messages like:
- "Success. No rows returned"
- Multiple policy creation confirmations

At the end, you'll see a table showing all the policies that were created.

### **Step 4: Test Again**

1. Go back to your app: http://localhost:5173
2. Go to **Founder Dashboard**
3. Try to **assign a group admin** again
4. ✅ It should work now!

---

## 📋 **What the Script Does**

The script sets up proper RLS policies for all tables:

### **1. group_admins Table**
- ✅ Founders can insert, update, delete admin assignments
- ✅ Anyone can view admin assignments

### **2. groups Table**
- ✅ Anyone (even guests) can view groups
- ✅ Founders can create, update, delete groups

### **3. activities Table**
- ✅ Anyone (even guests) can view activities
- ✅ Group admins can create activities for their groups
- ✅ Users can update/delete only their own activities

### **4. users Table**
- ✅ Anyone can view user profiles
- ✅ Users can update their own profile
- ✅ Founders can update any user's role

---

## 🔐 **Why This Is Secure**

Even though some tables allow "anyone" to view:
- The `anon` key (anonymous/guest) can only READ public data
- Only authenticated users can CREATE/UPDATE/DELETE
- Founders have special permissions
- Users can only modify their own content
- Group admins can only create activities for their assigned groups

---

## 🐛 **If It Still Doesn't Work**

### Option 1: Temporarily Disable RLS (Quick Fix)

Run this in Supabase SQL Editor:

```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE public.group_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: This removes all security! Only do this for local testing. Re-enable before deploying:

```sql
-- Re-enable RLS when done testing
ALTER TABLE public.group_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Option 2: Check Your Policies Manually

Run this to see current policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('group_admins', 'groups', 'activities', 'users');
```

You should see policies for:
- Founders can manage group admins
- Anyone can view group admins
- Anyone can view groups
- Founders can manage groups
- Anyone can view activities
- Group admins can create activities
- Creators can manage their activities
- Users can view all profiles
- Users can update own profile
- Founders can update any profile

---

## 📊 **Verification Checklist**

After running the fix script, verify these work:

- [ ] Founder can create groups
- [ ] Founder can assign admins
- [ ] Group admin can create activities
- [ ] Users can view activities
- [ ] Users can view groups
- [ ] Users can view profiles
- [ ] Users can update their own profile
- [ ] Users CANNOT update other users' profiles
- [ ] Group admins can only edit/delete their own activities

---

## 🚨 **Common Errors**

### Error: "permission denied for schema public"
**Solution**: You might not have the right permissions. Contact Supabase support or use Supabase dashboard to grant permissions.

### Error: "policy already exists"
**Solution**: The policy was already created. The script drops existing policies first, so this shouldn't happen. If it does, manually drop the conflicting policy:
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
```

### Error: "must be owner of table"
**Solution**: Sign in to Supabase dashboard with the project owner account.

---

## 📖 **Understanding RLS**

**Row Level Security (RLS)** is like a bouncer at a club:
- It checks WHO you are (authenticated vs anonymous)
- It checks WHAT you're trying to do (read, insert, update, delete)
- It decides IF you're allowed to do it

**Example**:
- Guest trying to view activities → ✅ Allowed (public read)
- Member trying to delete someone else's activity → ❌ Blocked
- Founder trying to assign admin → ✅ Allowed (founder permissions)
- Group admin trying to create activity → ✅ Allowed (if they're admin of that group)

---

## ✅ **Success!**

Once you run the script, you should be able to:
1. ✅ Create groups as founder
2. ✅ Assign admins as founder
3. ✅ Create activities as group admin
4. ✅ Edit/delete your own activities
5. ✅ View all public data as any user

---

**File**: [fix-rls-policies.sql](fix-rls-policies.sql)
**Last Updated**: November 26, 2024
