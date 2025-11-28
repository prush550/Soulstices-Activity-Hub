# Testing Activity Joining Feature - Quick Checklist

## Prerequisites
Before testing, you MUST run the database setup:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/mejsgjtnokcarssppdmx/sql
2. Open file: `setup-activity-participants.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message: "✅ Activity Participants table is ready!"

**⚠️ DO NOT SKIP THIS STEP** - The feature will not work without the database table!

---

## Quick Test Scenarios

### ✅ Test 1: Join Public Activity (2 minutes)
1. Sign in as any user
2. Go to Home page
3. Click on any **public** activity
4. Click "Join This Activity" button
5. **Expected:** Success message appears
6. **Expected:** Button changes to green "✓ Joined - Click to Leave"
7. **Expected:** Participant count increases by 1
8. Go to your Profile page
9. **Expected:** Activity appears in "My Activities" section

**Pass Criteria:** All 4 expected results occur

---

### ✅ Test 2: Join Invite-Only Activity (3 minutes)
1. Sign in as Founder (mail.soulstices@gmail.com)
2. Go to Group Admin Dashboard
3. Create Activity → Select "Invite-Only" type
4. Fill form and create
5. **Note the invite code** shown in success message (e.g., A3B7C9D2)
6. Sign out
7. Sign in as different user
8. Go to that activity's detail page
9. Click "🔒 Join with Invite Code"
10. Enter **wrong code** (e.g., WRONG123)
11. **Expected:** Error "Invalid invite code"
12. Enter **correct code**
13. **Expected:** Success message and joined state

**Pass Criteria:** Wrong code rejected, correct code accepted

---

### ✅ Test 3: Leave Activity (1 minute)
1. Join any activity (use Test 1)
2. Go to activity detail page
3. Hover over "✓ Joined - Click to Leave" button
4. **Expected:** Button turns red on hover
5. Click the button
6. **Expected:** Confirmation dialog appears
7. Click "OK"
8. **Expected:** Success message "You have left the activity"
9. **Expected:** Button changes back to "Join This Activity"
10. **Expected:** Participant count decreases by 1

**Pass Criteria:** All 5 expected results occur

---

### ✅ Test 4: Activity Full (2 minutes)
1. Sign in as Founder
2. Create activity with **Participant Limit = 1**
3. Join that activity (should work)
4. Sign out
5. Sign in as different user
6. Go to that activity
7. **Expected:** Button shows "Activity Full" (disabled, gray)
8. **Expected:** Red badge shows "Activity Full"
9. Try clicking button
10. **Expected:** Nothing happens (disabled)

**Pass Criteria:** Cannot join full activity

---

### ✅ Test 5: My Activities Display (1 minute)
1. Join 2-3 different activities
2. Go to Profile page
3. **Expected:** "My Activities" section shows all joined activities
4. **Expected:** Sidebar shows correct activity count (e.g., "Activities: 3")
5. Click on any activity card
6. **Expected:** Navigates to that activity's detail page

**Pass Criteria:** All activities display correctly

---

## Common Issues & Fixes

### Issue: Join button doesn't work, no error shown
**Fix:**
- Open browser console (F12)
- Look for red errors
- Most likely: Database table not created
- Solution: Run `setup-activity-participants.sql`

### Issue: "new row violates row-level security policy"
**Fix:**
- The SQL script wasn't run
- Run `setup-activity-participants.sql` in Supabase SQL Editor

### Issue: Participant count doesn't update
**Fix:**
- Check if trigger exists in Supabase
- Go to Supabase → Database → Triggers
- Should see: `activity_participant_count_trigger`
- If missing: Re-run the SQL script

### Issue: Activities not showing in Profile
**Fix:**
1. Open Supabase → Table Editor → activity_participants
2. Find your participation record
3. Check the `status` field - must be 'registered'
4. If status is 'cancelled', you left the activity

---

## Visual Verification Guide

### Join Button States
```
✅ Not Joined (Public):     [Orange] "Join This Activity"
✅ Not Joined (Invite):     [Orange] "🔒 Join with Invite Code"
✅ Joined:                  [Green]  "✓ Joined - Click to Leave"
✅ Joined (Hover):          [Red]    "✓ Joined - Click to Leave"
✅ Full:                    [Gray]   "Activity Full" (disabled)
✅ Processing:              [Gray]   "Joining..." (disabled)
```

### Activity Type Badges
```
✅ Public:       🌍 Public Event      (green badge)
✅ Private:      🔒 Private Event     (purple badge)
✅ Invite-Only:  🎫 Invite-Only       (blue badge)
```

### Success Messages
```
✅ Joined:     "Successfully joined the activity! 🎉"
✅ Left:       "You have left the activity."
✅ Full:       "Sorry, this activity is full!"
✅ Invalid:    "Invalid invite code. Please check and try again."
```

---

## Quick Database Check

If something isn't working, verify the database:

1. **Check table exists:**
   - Supabase → Table Editor → Look for "activity_participants"

2. **Check your participation:**
   - Supabase → Table Editor → activity_participants
   - Filter by your user_id
   - Should see records for activities you joined

3. **Check participant counts:**
   - Supabase → Table Editor → activities
   - Find an activity
   - Check `current_participants` column
   - Should match number of participants

4. **Check RLS policies:**
   - Supabase → Database → Policies
   - Table: activity_participants
   - Should see 5 policies

---

## Acceptance Criteria (All Must Pass)

- [✓] Database table created successfully
- [✓] Can join public activities
- [✓] Can join invite-only activities with correct code
- [✓] Cannot join invite-only activities with wrong code
- [✓] Can leave activities
- [✓] Participant count updates automatically
- [✓] Activity appears on Profile page after joining
- [✓] Activity disappears from Profile after leaving
- [✓] Cannot join full activities
- [✓] Join button shows correct states
- [✓] Activity type badges display correctly
- [✓] All success/error messages appear correctly

---

## Performance Check

After testing, verify:
1. **No console errors** (F12 → Console should be clean)
2. **Fast loading** (Profile activities load in <1 second)
3. **Smooth transitions** (Button state changes are instant)
4. **No duplicate joins** (Trying to join twice shows "already joined" error)

---

## Done Testing? Next Steps

If all tests pass:
1. ✅ Mark feature as complete
2. 🎯 Move on to "Group Joining Flows" (next priority in Project_Context.md)

If tests fail:
1. ❌ Check "Common Issues & Fixes" above
2. 🔍 Check browser console for errors
3. 📊 Verify database setup
4. 📖 Read ACTIVITY_JOINING_GUIDE.md for detailed troubleshooting

---

**Estimated Testing Time:** 10-15 minutes
**Must Complete:** Database setup + All 5 test scenarios
**Ready for Production:** After all tests pass
