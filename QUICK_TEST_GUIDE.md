# Quick Test Guide - Founder Dashboard

## 🚀 Quick Start (5 Minutes)

### Step 1: Open the Application
1. Server is already running at: **http://localhost:5173**
2. Open your browser and navigate to this URL

### Step 2: Sign In as Founder
1. Click **"Sign In"** button in navbar
2. Use credentials:
   - **Email**: mail.soulstices@gmail.com
   - **Password**: (your password)
3. You should see your name in the navbar with a purple "👑 Founder" badge

### Step 3: Access Founder Dashboard
1. Click on your **avatar/name** in the top-right corner
2. In the dropdown menu, click **"⚡ Founder Dashboard"**
3. You should see the dashboard with 4 tabs

---

## ✅ Quick Tests to Run

### Test 1: View Analytics (30 seconds)
- **What to check**: Overview tab shows 4 cards with numbers
- **Expected**: See your current platform statistics
- ✅ Pass / ❌ Fail: _____

### Test 2: Create a Group (2 minutes)
1. Click **"Create Group"** tab
2. Fill in the form:
   ```
   Name: Quick Test Group
   Description: Testing the founder dashboard
   Category: Sports
   Joining Type: Public
   Cover Image: (leave blank)
   ```
3. Click **"Create Group"**
4. **Expected**: Green success message appears
5. ✅ Pass / ❌ Fail: _____

### Test 3: View Your New Group (30 seconds)
1. Click **"Manage Groups"** tab
2. **Expected**: See "Quick Test Group" at the top of the list
3. ✅ Pass / ❌ Fail: _____

### Test 4: Assign an Admin (1 minute)
1. Click **"Assign Admin"** tab
2. Select **"Quick Test Group"** from Group dropdown
3. Select any user from User dropdown
4. Click **"Assign as Admin"**
5. **Expected**: Green success message
6. ✅ Pass / ❌ Fail: _____

### Test 5: Verify Admin Assignment (30 seconds)
1. Go back to **"Manage Groups"** tab
2. Find "Quick Test Group"
3. **Expected**: See the admin you just assigned under "Admins:" section
4. ✅ Pass / ❌ Fail: _____

---

## 🎯 All Tests Passed?

If all 5 tests passed: **🎉 Founder Dashboard is working perfectly!**

If any test failed: Check [TESTING_FOUNDER_DASHBOARD.md](TESTING_FOUNDER_DASHBOARD.md) for detailed debugging.

---

## 📸 What You Should See

### Dashboard Overview:
```
┌─────────────────────────────────────────────────┐
│  Founder Dashboard                              │
│  Welcome back, [Your Name]!                     │
├─────────────────────────────────────────────────┤
│  📊 Overview | ➕ Create Group | 👤 Assign Admin | ⚙️ Manage Groups
├─────────────────────────────────────────────────┤
│                                                 │
│  [Analytics Cards with Numbers]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Successful Group Creation:
```
✅ Group created successfully!
```

### Successful Admin Assignment:
```
✅ Admin assigned successfully!
```

---

## 🐛 Common Issues

**Issue**: Can't see "⚡ Founder Dashboard" in menu
- **Fix**: Make sure you're signed in with mail.soulstices@gmail.com (founder account)

**Issue**: "Access Denied" error
- **Fix**: Your account role must be 'founder' in the database

**Issue**: No groups in dropdown
- **Fix**: Create a group first in the "Create Group" tab

**Issue**: No users in dropdown
- **Fix**: Create additional user accounts (Sign Up page)

---

## 📞 Need Help?

Check the detailed testing guide: [TESTING_FOUNDER_DASHBOARD.md](TESTING_FOUNDER_DASHBOARD.md)

---

**Testing Time**: ~5 minutes
**Last Updated**: November 26, 2024
