# Group Joining Feature - Complete Guide

## Overview
The Group Joining feature allows users to join groups with support for three joining types:
- **Public:** Anyone can join instantly
- **Invite-Only:** Requires a valid invite code
- **Screening:** Requires application submission + admin approval

## What Was Implemented

### 1. Database Setup
**File:** [setup-group-joining.sql](setup-group-joining.sql)

Created/updated:
- `invite_code` column on groups table
- `group_members` table with status tracking
- Row Level Security (RLS) policies
- Auto-counting triggers for member_count
- Full support for all three joining types

**To set up the database:**
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/mejsgjtnokcarssppdmx/sql
2. Copy the entire content of `setup-group-joining.sql`
3. Click "Run" to execute
4. Verify success message: "✅ Group Joining feature is ready!"

### 2. New Page: GroupDetail.jsx
**File:** [frontend/src/pages/GroupDetail.jsx](frontend/src/pages/GroupDetail.jsx)

**Features:**
- View group information (name, description, category, member count)
- Join/Leave buttons with state management
- Three joining flows:
  - **Public:** One-click join → Instant approval
  - **Invite-Only:** Invite code modal → Validation → Approval
  - **Screening:** Application form → Pending approval
- Membership status display (Member, Pending, Rejected)
- Joining type badges

**Key Functions:**
- `checkMembershipStatus()` - Checks if user is member (lines 47-63)
- `handleJoinGroup()` - Main join handler, shows modals if needed (lines 65-93)
- `joinGroup()` - Performs join with validations (lines 95-165)
- `handleLeaveGroup()` - Leave group functionality (lines 167-194)
- `getJoinButtonContent()` - Dynamic button configuration (lines 204-264)

### 3. Updated Groups.jsx
**File:** [frontend/src/pages/Groups.jsx](frontend/src/pages/Groups.jsx)

**Changes:**
- Migrated from backend API to Supabase
- Added navigation to group detail pages (click on card → `/group/:id`)
- Display joining type badges (Public, Invite-Only, Screening)
- Shows member_count for each group

### 4. Updated FounderDashboard.jsx
**File:** [frontend/src/pages/FounderDashboard.jsx](frontend/src/pages/FounderDashboard.jsx)

**New Features:**
- Generates 8-character invite code for invite-only groups
- Displays invite code with copy button after creation
- Shows warning to save the code

**Modified Functions:**
- `generateInviteCode()` - Creates random 8-char code (line 117-119)
- `handleCreateGroup()` - Generates invite code if needed (lines 121-174)

**UI Changes:**
- Invite code display box with:
  - Large monospace code display
  - Copy to clipboard button
  - Warning message to save code

### 5. Updated Profile.jsx
**File:** [frontend/src/pages/Profile.jsx](frontend/src/pages/Profile.jsx)

**New Features:**
- "My Groups" section showing all joined groups
- Group count in sidebar stats
- Grid layout for group cards
- Click on group card to navigate to details

**Key Functions:**
- `fetchMyGroups()` - Fetches approved memberships (lines 94-132)

**UI Changes:**
- My Groups section (lines 359-427)
- Updated group count (line 220)

### 6. Updated App.jsx
**File:** [frontend/src/App.jsx](frontend/src/App.jsx)

**Changes:**
- Added `/group/:id` route for GroupDetail page

## How It Works

### Joining Flow - Public Groups
1. User navigates to group detail page
2. Clicks "Join Group" button
3. System inserts membership with `status: 'approved'`
4. Database trigger increments `member_count`
5. UI updates to show "✓ Member - Click to Leave"
6. Group appears in user's profile

### Joining Flow - Invite-Only Groups
1. User clicks "🎫 Join with Invite Code"
2. **Invite code modal appears**
3. User enters invite code (auto-uppercase)
4. System validates against `group.invite_code`
5. If invalid: Error "Invalid invite code"
6. If valid: Membership created with `status: 'approved'`
7. Success message shown

**How to Get Invite Code:**
- Founder creates invite-only group
- System generates random 8-char code (e.g., A3B7C9D2)
- Code displayed in blue box with copy button
- Founder shares code with members

### Joining Flow - Screening Groups
1. User clicks "📋 Apply to Join"
2. **Application form modal appears**
3. User fills out:
   - Why do you want to join? (required)
   - Tell us about your experience (required)
   - Custom questions (if any)
4. User submits application
5. Membership created with `status: 'pending'`
6. Button shows "⏳ Application Pending"
7. **Admin must approve** (GroupAdminDashboard feature coming next)

### Leaving Flow
1. User clicks "✓ Member - Click to Leave"
2. Confirmation dialog appears
3. If confirmed: Membership record deleted
4. Database trigger decrements `member_count`
5. UI updates back to "Join Group"
6. Group removed from user's profile

## Database Schema

### groups Table
```sql
- id (UUID)
- name (TEXT)
- description (TEXT)
- category (TEXT)
- joining_type (TEXT: 'public', 'invite_only', 'screening')
- invite_code (TEXT, nullable) -- NEW!
- screening_form (JSONB, nullable)
- member_count (INTEGER, auto-updated)
- created_by (UUID)
- created_at, updated_at
```

### group_members Table
```sql
- id (UUID)
- user_id (UUID, FK to auth.users)
- group_id (UUID, FK to groups)
- status (TEXT: 'pending', 'approved', 'rejected')
- application_data (JSONB)
- joined_at (TIMESTAMPTZ)
- UNIQUE(user_id, group_id)
```

### Indexes
- `idx_groups_invite_code` on groups(invite_code)
- `idx_group_members_user` on group_members(user_id)
- `idx_group_members_group` on group_members(group_id)
- `idx_group_members_status` on group_members(status)

### Triggers
- `group_member_count_trigger` - Auto-updates member_count in groups table

## Files Modified/Created

### Created Files:
1. **setup-group-joining.sql** - Database setup
2. **frontend/src/pages/GroupDetail.jsx** - Group detail page
3. **GROUP_JOINING_GUIDE.md** - This documentation

### Modified Files:
1. **frontend/src/pages/Groups.jsx**
   - Changed fetch from API to Supabase (lines 14-29)
   - Added navigation onClick (line 59)
   - Updated joining type badges (lines 85-104)

2. **frontend/src/pages/FounderDashboard.jsx**
   - Added generatedInviteCode state (line 26)
   - Added generateInviteCode() function (lines 117-119)
   - Modified handleCreateGroup() (lines 121-174)
   - Added invite code display UI (lines 417-439)

3. **frontend/src/pages/Profile.jsx**
   - Added myGroups state (line 19-20)
   - Added fetchMyGroups() function (lines 94-132)
   - Updated groups count (line 220)
   - Added My Groups section (lines 359-427)

4. **frontend/src/App.jsx**
   - Added GroupDetail import (line 7)
   - Added /group/:id route (line 24)

## User Experience

### Visual States

**Join Button States:**
```
Not a Member (Public):
  → Orange button "Join Group"

Not a Member (Invite-Only):
  → Orange button "🎫 Join with Invite Code"

Not a Member (Screening):
  → Orange button "📋 Apply to Join"

Member:
  → Green button "✓ Member - Click to Leave"
  → Turns red on hover

Application Pending:
  → Yellow button "⏳ Application Pending" (disabled)

Application Rejected:
  → Red button "❌ Application Rejected" (disabled)

Processing:
  → Gray button "Processing..." (disabled)
```

**Joining Type Badges:**
```
Public:       🌍 Public        (green)
Invite-Only:  🎫 Invite-Only   (blue)
Screening:    📋 Screening     (yellow)
```

### User Feedback
- Join public: "Successfully joined the group! 🎉"
- Join invite-only: "Successfully joined the group! 🎉"
- Apply screening: "Application submitted! The group admin will review your request."
- Leave group: "You have left the group."
- Invalid code: "Invalid invite code. Please check and try again."
- Duplicate join: "You have already applied to join this group!"

## Testing Guide

### Prerequisites
**MUST RUN FIRST:** Database setup
1. Open Supabase SQL Editor
2. Run `setup-group-joining.sql`
3. Verify success message

### Test Scenario 1: Join Public Group (2 min)
1. Sign in as any user
2. Go to Groups page
3. Click on a **Public** group
4. Click "Join Group"
5. ✅ Success message appears
6. ✅ Button changes to "✓ Member - Click to Leave"
7. ✅ Member count increases by 1
8. Go to Profile page
9. ✅ Group appears in "My Groups"

### Test Scenario 2: Join Invite-Only Group (3 min)
1. Sign in as Founder
2. Go to Founder Dashboard → Create Group
3. Name: "Test Invite Group"
4. Joining Type: **Invite Only**
5. Create group
6. ✅ Invite code displayed (e.g., A3B7C9D2)
7. Copy the invite code
8. Sign out
9. Sign in as different user
10. Go to Groups → Click on "Test Invite Group"
11. Click "🎫 Join with Invite Code"
12. Enter **wrong code** → ✅ Error shown
13. Enter **correct code** → ✅ Success, joined

### Test Scenario 3: Apply to Screening Group (3 min)
1. Sign in as Founder
2. Create group with Joining Type: **Screening**
3. Sign out
4. Sign in as different user
5. Go to that group's page
6. Click "📋 Apply to Join"
7. ✅ Application form appears
8. Fill out form and submit
9. ✅ Success message: "Application submitted!"
10. ✅ Button shows "⏳ Application Pending"
11. Try clicking button → ✅ Disabled, nothing happens

### Test Scenario 4: Leave Group (1 min)
1. Join any group (from Test 1)
2. Go to group detail page
3. Hover "✓ Member" button → ✅ Turns red
4. Click button
5. ✅ Confirmation appears
6. Click OK
7. ✅ Success: "You have left the group"
8. ✅ Button back to "Join Group"
9. ✅ Member count decreased
10. Go to Profile → ✅ Group removed from "My Groups"

### Test Scenario 5: My Groups Display (2 min)
1. Join 2-3 different groups
2. Go to Profile page
3. ✅ "My Groups" section shows all joined groups
4. ✅ Groups count in sidebar correct
5. ✅ Group cards show: name, category, member count, join date
6. Click on a group card
7. ✅ Navigates to group detail page

### Test Scenario 6: Invite Code Generation (2 min)
1. Sign in as Founder
2. Go to Founder Dashboard → Create Group
3. Joining Type: Invite-Only
4. Fill form and create
5. ✅ Blue box appears with invite code
6. ✅ Code is 8 characters, uppercase
7. Click "Copy" button
8. ✅ Alert: "Invite code copied to clipboard!"
9. Paste somewhere → ✅ Code copied correctly

## Validations

### Before Joining:
1. **User Authentication:** Must be signed in
2. **Joining Type:**
   - Public: No additional check
   - Invite-Only: Must provide valid invite code
   - Screening: Must fill application form
3. **Duplicate Check:** Database prevents joining twice (unique constraint)

### Database Level:
- RLS policies ensure users can only manage their own memberships
- Unique constraint on `(user_id, group_id)` prevents duplicates
- Triggers automatically update member counts
- Foreign key constraints ensure data integrity

## What's Coming Next

**GroupAdminDashboard Enhancement:**
- New tab: "Join Requests"
- View all pending applications
- Approve/Reject applications
- View application data (reason, experience, custom answers)

## Troubleshooting

### Issue: "new row violates row-level security policy"
**Solution:** Run `setup-group-joining.sql` in Supabase SQL Editor

### Issue: Join button doesn't work
**Solution:**
1. Check browser console for errors
2. Verify user is signed in
3. Verify group_members table exists
4. Check RLS policies are enabled

### Issue: Member count not updating
**Solution:**
1. Verify trigger exists: `group_member_count_trigger`
2. Go to Supabase → Database → Triggers
3. If missing: Re-run the SQL script

### Issue: Groups not showing in Profile
**Solution:**
1. Open Supabase → Table Editor → group_members
2. Find your membership record
3. Check `status` field - must be 'approved'
4. If 'pending', admin hasn't approved yet

### Issue: Invite code not generated
**Solution:**
1. Check if joining_type is 'invite_only'
2. Check browser console for errors
3. Verify invite_code column exists in groups table
4. Re-run SQL script if needed

## Success Criteria

✅ Users can join public groups
✅ Users can join invite-only groups with valid code
✅ Users can apply to screening groups
✅ Applications show as pending
✅ Users can leave groups
✅ Member counts update automatically
✅ Groups appear on user's profile
✅ Duplicate joins prevented
✅ UI shows correct states
✅ Invite codes generated for invite-only groups
✅ All error cases handled gracefully

## Next Steps

After completing this feature:
1. **GroupAdminDashboard Enhancement** - Add join request management
2. **Notifications System** - Notify admins of new applications
3. **Bulk Actions** - Allow admins to approve/reject multiple requests

---

**Status:** ✅ Feature Complete (except admin approval UI)
**Last Updated:** November 27, 2024
**Next Feature:** GroupAdminDashboard - Join Request Management
