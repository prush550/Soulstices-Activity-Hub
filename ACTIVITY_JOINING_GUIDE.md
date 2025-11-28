# Activity Joining Feature - Complete Guide

## Overview
The Activity Joining feature allows users to join activities, with support for three activity types:
- **Public:** Anyone can join
- **Private:** Only group members can join
- **Invite-Only:** Requires a valid invite code

## What Was Implemented

### 1. Database Setup
**File:** `setup-activity-participants.sql`

Created the `activity_participants` table with:
- Automatic participant count updates via triggers
- Row Level Security (RLS) policies
- Unique constraint (one user per activity)
- Status tracking: `registered`, `attended`, `cancelled`

**To set up the database:**
1. Open Supabase SQL Editor
2. Copy and paste the entire content of `setup-activity-participants.sql`
3. Click "Run" to execute
4. Verify success message: "✅ Activity Participants table is ready!"

### 2. ActivityDetail.jsx Updates
**File:** `frontend/src/pages/ActivityDetail.jsx`

**New Features:**
- Join/Leave activity buttons with state management
- Invite code modal for invite-only activities
- Activity type badges (Public, Private, Invite-Only)
- Participant limit validation
- Group membership checking for private activities
- Real-time participant count updates

**Key Functions:**
- `checkIfJoined()` - Checks if user has already joined (lines 77-95)
- `handleJoinActivity()` - Main join handler, shows invite modal if needed (lines 97-112)
- `joinActivity()` - Performs the actual join with all validations (lines 114-190)
- `handleLeaveActivity()` - Allows users to leave an activity (lines 192-221)
- `handleInviteCodeSubmit()` - Validates and submits invite code (lines 223-229)

**UI Changes:**
- Dynamic Join button that changes based on state:
  - Not joined: "Join This Activity" or "🔒 Join with Invite Code"
  - Joined: "✓ Joined - Click to Leave" (green, turns red on hover)
  - Full: "Activity Full" (disabled)
  - Loading: "Joining..." / "Processing..."
- Activity type badges in header (lines 334-348)
- Invite code modal with auto-uppercase input (lines 486-530)

### 3. Profile.jsx Updates
**File:** `frontend/src/pages/Profile.jsx`

**New Features:**
- Fetches and displays all activities user has joined
- Shows activity count in sidebar stats
- Click on activity card to navigate to detail page
- Shows "Joined on" date for each activity
- Empty state with "Browse Activities" button

**Key Functions:**
- `fetchMyActivities()` - Fetches user's joined activities (lines 26-70)
- `formatDate()` - Formats dates for display (lines 72-80)
- `formatTime()` - Formats time in 12-hour format (lines 82-89)

**UI Changes:**
- Replaced placeholder "Activity History" with real "My Activities" section
- Activity cards show: title, group, date, time, location, payment
- Activity count badge in sidebar (line 181)
- Loading state while fetching
- Empty state with call-to-action

## How It Works

### Joining Flow - Public Activities
1. User clicks "Join This Activity" button
2. System checks if activity is full
3. System inserts participation record
4. Database trigger increments `current_participants` count
5. UI updates to show "✓ Joined - Click to Leave"
6. Success message displayed
7. Activity appears in user's profile

### Joining Flow - Private Activities
1. User clicks "Join This Activity" button
2. System checks if activity is full
3. **System checks if user is a group member** (lines 140-154)
4. If not a member: Shows error "Only group members can join"
5. If member: Inserts participation record
6. Rest of flow same as public activities

### Joining Flow - Invite-Only Activities
1. User clicks "🔒 Join with Invite Code" button
2. **Invite code modal appears** (lines 486-530)
3. User enters invite code (auto-converts to uppercase)
4. User clicks "Join Activity"
5. System validates invite code against `activity.invite_code`
6. If invalid: Shows error "Invalid invite code"
7. If valid: Inserts participation record
8. Modal closes, success message shown
9. Activity appears in user's profile

### Leaving Flow
1. User clicks "✓ Joined - Click to Leave" button
2. Confirmation dialog: "Are you sure you want to leave this activity?"
3. If confirmed: Deletes participation record
4. Database trigger decrements `current_participants` count
5. UI updates back to "Join This Activity"
6. Activity removed from user's profile

## Validations

### Before Joining:
1. **User Authentication:** Must be signed in
2. **Participant Limit:** Check if activity is full
3. **Activity Type:**
   - Public: No additional check
   - Private: Must be approved group member
   - Invite-Only: Must provide valid invite code
4. **Duplicate Check:** Database prevents joining twice (unique constraint)

### Database Level:
- RLS policies ensure users can only manage their own participation
- Unique constraint on `(user_id, activity_id)` prevents duplicates
- Triggers automatically update participant counts
- Foreign key constraints ensure data integrity

## Testing Guide

### Test Scenario 1: Join Public Activity
1. Sign in as any user
2. Go to a public activity detail page
3. Click "Join This Activity"
4. Verify: Success message appears
5. Verify: Button changes to "✓ Joined - Click to Leave"
6. Verify: Participant count increases by 1
7. Go to Profile page
8. Verify: Activity appears in "My Activities" section

### Test Scenario 2: Join Invite-Only Activity
1. Create an invite-only activity (via Group Admin Dashboard)
2. Note the invite code shown after creation
3. Sign out and sign in as different user
4. Go to the invite-only activity detail page
5. Click "🔒 Join with Invite Code"
6. Verify: Modal appears
7. Enter wrong code, click "Join Activity"
8. Verify: Error message "Invalid invite code"
9. Enter correct code, click "Join Activity"
10. Verify: Success message and joined state

### Test Scenario 3: Join Private Activity (Not a Member)
1. Create a private activity for a group
2. Sign in as user who is NOT a member of that group
3. Go to the private activity detail page
4. Click "Join This Activity"
5. Verify: Error message "Only group members can join"

### Test Scenario 4: Join Full Activity
1. Create activity with participant_limit = 2
2. Join as User A
3. Join as User B
4. Sign in as User C
5. Go to activity detail page
6. Verify: Button shows "Activity Full" (disabled)
7. Verify: Red "Activity Full" badge shown
8. Verify: Cannot click Join button

### Test Scenario 5: Leave Activity
1. Join any activity
2. Go to activity detail page
3. Click "✓ Joined - Click to Leave" (button turns red on hover)
4. Verify: Confirmation dialog appears
5. Click "OK"
6. Verify: Success message "You have left the activity"
7. Verify: Button changes back to "Join This Activity"
8. Verify: Participant count decreases by 1
9. Go to Profile page
10. Verify: Activity removed from "My Activities"

### Test Scenario 6: Database Integrity
1. Join an activity
2. Open Supabase Table Editor
3. Go to `activity_participants` table
4. Verify: Your participation record exists
5. Go to `activities` table
6. Verify: `current_participants` count is correct
7. Try to manually insert duplicate participation
8. Verify: Database rejects it (unique constraint error)

### Test Scenario 7: My Activities Display
1. Join multiple activities (mix of public, private, invite-only)
2. Go to Profile page
3. Verify: All joined activities appear
4. Verify: Activity count in sidebar is correct
5. Verify: Activity cards show correct details
6. Click on an activity card
7. Verify: Navigates to activity detail page

## User Experience

### Visual States

**Join Button States:**
```
Not Joined (Public/Private):
  → Orange button "Join This Activity"

Not Joined (Invite-Only):
  → Orange button "🔒 Join with Invite Code"

Joined:
  → Green button "✓ Joined - Click to Leave"
  → Turns red on hover

Activity Full:
  → Gray button "Activity Full" (disabled)

Processing:
  → Gray button "Joining..." or "Processing..." (disabled)
```

**Activity Type Badges:**
```
Public: 🌍 Public Event (green)
Private: 🔒 Private Event (purple)
Invite-Only: 🎫 Invite-Only (blue)
```

### User Feedback
- Success message when joined: "Successfully joined the activity! 🎉"
- Success message when left: "You have left the activity."
- Error message when full: "Sorry, this activity is full!"
- Error message when invalid code: "Invalid invite code. Please check and try again."
- Error message when private: "This is a private activity. Only group members can join."
- Error message when duplicate: "You have already joined this activity!"

## Database Schema

### activity_participants Table
```sql
CREATE TABLE activity_participants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_id UUID REFERENCES activities(id),
  status TEXT ('registered', 'attended', 'cancelled'),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
)
```

### Indexes
- `idx_activity_participants_user` on user_id
- `idx_activity_participants_activity` on activity_id
- `idx_activity_participants_status` on status

### Triggers
- `activity_participant_count_trigger` - Auto-updates `current_participants` in `activities` table

## Files Modified

1. **setup-activity-participants.sql** (NEW)
   - Database table creation
   - RLS policies
   - Triggers for auto-counting
   - Verification queries

2. **frontend/src/pages/ActivityDetail.jsx** (MODIFIED)
   - Added state variables (lines 14-17)
   - Added useEffect for checking join status (lines 23-27)
   - Added checkIfJoined function (lines 77-95)
   - Replaced handleJoinActivity with full implementation (lines 97-229)
   - Updated Join button UI (lines 386-412)
   - Added activity type badges (lines 334-348)
   - Added invite code modal (lines 486-530)

3. **frontend/src/pages/Profile.jsx** (MODIFIED)
   - Added imports (lines 1, 4)
   - Added state variables (lines 17-18)
   - Added useEffect (lines 20-24)
   - Added fetchMyActivities function (lines 26-70)
   - Added formatDate and formatTime functions (lines 72-89)
   - Updated activities count (line 181)
   - Replaced Activity History section (lines 316-390)

## Next Steps

After completing this feature, the next priorities are:

1. **Group Joining Flows**
   - Public: One-click join
   - Invite-only: Generate and use invite links
   - Screening: Application form + admin approval

2. **Member Management (for Group Admins)**
   - View group members
   - Approve/reject join requests
   - Remove members

3. **Notifications System**
   - Activity reminders
   - New activity notifications
   - Join request notifications

## Troubleshooting

### Issue: "new row violates row-level security policy"
**Solution:** Run the `setup-activity-participants.sql` script in Supabase SQL Editor

### Issue: Join button doesn't work
**Solution:**
1. Check browser console for errors
2. Verify user is signed in
3. Verify activity_participants table exists
4. Check RLS policies are enabled

### Issue: Participant count not updating
**Solution:**
1. Verify trigger exists: `activity_participant_count_trigger`
2. Run this in SQL Editor to recreate trigger:
```sql
DROP TRIGGER IF EXISTS activity_participant_count_trigger ON public.activity_participants;
CREATE TRIGGER activity_participant_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.activity_participants
FOR EACH ROW
EXECUTE FUNCTION update_activity_participant_count();
```

### Issue: Activities not showing in Profile
**Solution:**
1. Check if activities exist: Go to Supabase → Table Editor → activity_participants
2. Verify user_id matches your user ID
3. Check browser console for errors
4. Verify status is 'registered' (not 'cancelled')

## Success Criteria

✅ Users can join public activities
✅ Users can join invite-only activities with valid code
✅ Private activities require group membership
✅ Participant limits are enforced
✅ Users can leave activities
✅ Participant counts update automatically
✅ Activities appear on user's profile
✅ Duplicate joins are prevented
✅ UI shows correct states (joined/not joined/full)
✅ All error cases are handled gracefully

---

**Status:** ✅ Feature Complete
**Last Updated:** November 27, 2024
**Next Feature:** Group Joining Flows
