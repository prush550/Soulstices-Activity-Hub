# Testing Group Joining Feature - Quick Checklist

## Prerequisites
Before testing, you MUST run the database setup:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/mejsgjtnokcarssppdmx/sql
2. Open file: `setup-group-joining.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message: "✅ Group Joining feature is ready!"

**⚠️ DO NOT SKIP THIS STEP** - The feature will not work without the database table!

---

## Quick Test Scenarios

### ✅ Test 1: Join Public Group (2 minutes)
1. Sign in as any user
2. Go to /groups
3. Click on any **Public** group (green 🌍 badge)
4. Click "Join Group" button
5. **Expected:** Success message appears
6. **Expected:** Button changes to green "✓ Member - Click to Leave"
7. **Expected:** Member count increases by 1
8. Go to Profile page
9. **Expected:** Group appears in "My Groups" section

**Pass Criteria:** All 4 expected results occur

---

### ✅ Test 2: Create Invite-Only Group & Join (4 minutes)
1. Sign in as Founder (mail.soulstices@gmail.com)
2. Go to Founder Dashboard → Create Group tab
3. Fill form:
   - Name: "Test Invite Group"
   - Description: "Test group"
   - Category: "Test"
   - Joining Type: **Invite Only**
4. Click "Create Group"
5. **Expected:** Blue box appears with invite code (e.g., A3B7C9D2)
6. Click "Copy" button
7. **Expected:** Alert "Invite code copied to clipboard!"
8. Save the code somewhere
9. Sign out
10. Sign in as different user
11. Go to Groups → Find "Test Invite Group"
12. Click on the group
13. Click "🎫 Join with Invite Code"
14. **Expected:** Modal appears
15. Enter wrong code (e.g., WRONG123)
16. Click "Join Group"
17. **Expected:** Error "Invalid invite code"
18. Enter correct code (from step 8)
19. Click "Join Group"
20. **Expected:** Success message, joined state

**Pass Criteria:** Invite code generated, wrong code rejected, correct code accepted

---

### ✅ Test 3: Apply to Screening Group (3 minutes)
1. Sign in as Founder
2. Create group with Joining Type: **Screening**
3. Note the group name
4. Sign out
5. Sign in as different user
6. Go to that group's detail page
7. Click "📋 Apply to Join"
8. **Expected:** Application form appears
9. Fill out:
   - Why do you want to join: "Test reason"
   - Tell us about your experience: "Test experience"
10. Click "Submit Application"
11. **Expected:** Success message "Application submitted!"
12. **Expected:** Button shows "⏳ Application Pending" (yellow, disabled)
13. Try clicking the button
14. **Expected:** Nothing happens (disabled)
15. Go to Profile page
16. **Expected:** Group does NOT appear in "My Groups" (pending approval)

**Pass Criteria:** Application submitted, status is pending, group not in profile yet

---

### ✅ Test 4: Leave Group (1 minute)
1. Join any public group (use Test 1)
2. Go to group detail page
3. Hover over "✓ Member - Click to Leave" button
4. **Expected:** Button turns red on hover
5. Click the button
6. **Expected:** Confirmation dialog appears
7. Click "OK"
8. **Expected:** Success message "You have left the group"
9. **Expected:** Button changes back to "Join Group"
10. **Expected:** Member count decreases by 1
11. Go to Profile page
12. **Expected:** Group removed from "My Groups"

**Pass Criteria:** All 6 expected results occur

---

### ✅ Test 5: My Groups Display (1 minute)
1. Join 2-3 different public groups
2. Go to Profile page
3. **Expected:** "My Groups" section shows all joined groups
4. **Expected:** Sidebar "Groups" count is correct (e.g., 3)
5. **Expected:** Each group card shows: name, category, badge, member count, join date
6. Click on any group card
7. **Expected:** Navigates to that group's detail page

**Pass Criteria:** All groups display correctly, navigation works

---

## Common Issues & Fixes

### Issue: Join button doesn't work, no error shown
**Fix:**
- Open browser console (F12)
- Look for red errors
- Most likely: Database table not created
- Solution: Run `setup-group-joining.sql`

### Issue: "new row violates row-level security policy"
**Fix:**
- The SQL script wasn't run
- Run `setup-group-joining.sql` in Supabase SQL Editor

### Issue: Member count doesn't update
**Fix:**
- Check if trigger exists in Supabase
- Go to Supabase → Database → Triggers
- Should see: `group_member_count_trigger`
- If missing: Re-run the SQL script

### Issue: Groups not showing in Profile
**Fix:**
1. Open Supabase → Table Editor → group_members
2. Find your membership record
3. Check the `status` field - must be 'approved'
4. If status is 'pending', you applied to screening group (admin must approve)

### Issue: No invite code generated
**Fix:**
1. Verify you selected "Invite Only" when creating group
2. Check browser console for errors
3. Verify invite_code column exists: Supabase → Table Editor → groups
4. Re-run SQL script if column missing

---

## Visual Verification Guide

### Join Button States
```
✅ Not Member (Public):     [Orange] "Join Group"
✅ Not Member (Invite):     [Orange] "🎫 Join with Invite Code"
✅ Not Member (Screening):  [Orange] "📋 Apply to Join"
✅ Member:                  [Green]  "✓ Member - Click to Leave"
✅ Member (Hover):          [Red]    "✓ Member - Click to Leave"
✅ Pending:                 [Yellow] "⏳ Application Pending" (disabled)
✅ Rejected:                [Red]    "❌ Application Rejected" (disabled)
✅ Processing:              [Gray]   "Processing..." (disabled)
```

### Joining Type Badges
```
✅ Public:       🌍 Public        (green badge)
✅ Invite-Only:  🎫 Invite-Only   (blue badge)
✅ Screening:    📋 Screening     (yellow badge)
```

### Success Messages
```
✅ Joined (Public/Invite):    "Successfully joined the group! 🎉"
✅ Applied (Screening):        "Application submitted! The group admin will review your request."
✅ Left group:                 "You have left the group."
✅ Invalid invite code:        "Invalid invite code. Please check and try again."
✅ Duplicate join:             "You have already applied to join this group!"
```

---

## Quick Database Check

If something isn't working, verify the database:

1. **Check table exists:**
   - Supabase → Table Editor → Look for "group_members"

2. **Check your membership:**
   - Supabase → Table Editor → group_members
   - Filter by your user_id
   - Should see records for groups you joined

3. **Check member counts:**
   - Supabase → Table Editor → groups
   - Find a group
   - Check `member_count` column
   - Should match number of approved members

4. **Check RLS policies:**
   - Supabase → Database → Policies
   - Table: group_members
   - Should see 6 policies

5. **Check invite codes:**
   - Supabase → Table Editor → groups
   - Find invite-only group
   - Check `invite_code` column
   - Should have 8-char code (e.g., A3B7C9D2)

---

## Acceptance Criteria (All Must Pass)

- [✓] Database table created successfully
- [✓] Can join public groups
- [✓] Can join invite-only groups with correct code
- [✓] Cannot join invite-only groups with wrong code
- [✓] Can apply to screening groups
- [✓] Applications show as pending (not approved yet)
- [✓] Can leave groups
- [✓] Member count updates automatically
- [✓] Groups appear on Profile page after joining
- [✓] Groups disappear from Profile after leaving
- [✓] Join button shows correct states
- [✓] Joining type badges display correctly
- [✓] Invite codes generated for invite-only groups
- [✓] All success/error messages appear correctly

---

## Performance Check

After testing, verify:
1. **No console errors** (F12 → Console should be clean)
2. **Fast loading** (Profile groups load in <1 second)
3. **Smooth transitions** (Button state changes are instant)
4. **No duplicate joins** (Trying to join twice shows error)

---

## What's Not Tested (Coming Next)

These features are planned but not implemented yet:
- ❌ Admin approval for screening applications (GroupAdminDashboard)
- ❌ Viewing join requests as admin
- ❌ Approving/rejecting applications

---

## Done Testing? Next Steps

If all tests pass:
1. ✅ Mark feature as complete (except admin approval)
2. 🎯 Move on to "GroupAdminDashboard Enhancement" (add join request management)

If tests fail:
1. ❌ Check "Common Issues & Fixes" above
2. 🔍 Check browser console for errors
3. 📊 Verify database setup
4. 📖 Read GROUP_JOINING_GUIDE.md for detailed troubleshooting

---

**Estimated Testing Time:** 12-15 minutes
**Must Complete:** Database setup + All 5 test scenarios
**Ready for Production:** After all tests pass (except admin approval feature)
