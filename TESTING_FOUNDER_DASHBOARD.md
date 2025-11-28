# Founder Dashboard Testing Guide

## 🎯 Test Environment
- **Local URL**: http://localhost:5173
- **Network URL**: http://192.168.0.102:5173
- **Founder Email**: mail.soulstices@gmail.com
- **Supabase**: Connected and running

---

## ✅ Testing Checklist

### 1. Access & Authentication Test

#### Test 1.1: Access as Guest (Should FAIL)
- [ ] Open browser in incognito mode
- [ ] Navigate to: `http://localhost:5173/founder-dashboard`
- [ ] **Expected**: Redirected to `/signin` page
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 1.2: Access as Regular Member (Should FAIL)
- [ ] Sign in with a non-founder account
- [ ] Try to navigate to: `http://localhost:5173/founder-dashboard`
- [ ] **Expected**: See "🚫 Access Denied" page
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 1.3: Access as Founder (Should SUCCESS)
- [ ] Sign in with: mail.soulstices@gmail.com
- [ ] Click your avatar in navbar
- [ ] **Expected**: See "⚡ Founder Dashboard" option in menu
- [ ] Click "⚡ Founder Dashboard"
- [ ] **Expected**: Redirected to dashboard with 4 tabs
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 2. Overview Tab Test

#### Test 2.1: Analytics Display
- [ ] Navigate to Overview tab (should be default)
- [ ] **Expected**: See 4 analytics cards:
  - 🏢 Total Groups (current count)
  - 🎯 Total Activities (current count)
  - 👥 Total Users (current count)
  - ✅ Active Members (current count)
- [ ] Verify numbers match actual data
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 2.2: Responsive Design
- [ ] Resize browser to mobile width (< 768px)
- [ ] **Expected**: Cards stack vertically
- [ ] Resize to tablet (768px - 1024px)
- [ ] **Expected**: 2 cards per row
- [ ] Resize to desktop (> 1024px)
- [ ] **Expected**: 4 cards per row
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 3. Create Group Tab Test

#### Test 3.1: Form Validation
- [ ] Click "Create Group" tab
- [ ] Try to submit empty form
- [ ] **Expected**: Browser shows validation errors
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 3.2: Create Public Group
- [ ] Fill in form:
  - Name: "Test Sports Club"
  - Description: "A test group for sports activities"
  - Category: "Sports"
  - Joining Type: "Public"
  - Cover Image: (leave blank)
- [ ] Click "Create Group"
- [ ] **Expected**:
  - Green success message appears
  - Form resets to empty
  - Analytics updates (Total Groups +1)
- [ ] **Status**: ✅ Pass / ❌ Fail
- [ ] **Group ID Created**: _____________

#### Test 3.3: Create Invite-Only Group
- [ ] Fill in form:
  - Name: "Exclusive Fitness Club"
  - Description: "Invite-only fitness group"
  - Category: "Fitness"
  - Joining Type: "Invite Only"
  - Cover Image: "https://picsum.photos/800/400"
- [ ] Click "Create Group"
- [ ] **Expected**: Success message and form reset
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 3.4: Create Screening Group
- [ ] Fill in form:
  - Name: "Premium Activity Hub"
  - Description: "Application required to join"
  - Category: "Leisure"
  - Joining Type: "Screening"
  - Cover Image: (leave blank)
- [ ] Click "Create Group"
- [ ] **Expected**: Success message and form reset
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 3.5: Error Handling
- [ ] Disconnect internet
- [ ] Try to create a group
- [ ] **Expected**: Red error message with error details
- [ ] Reconnect internet
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 4. Assign Admin Tab Test

#### Test 4.1: Empty Dropdowns
- [ ] Click "Assign Admin" tab
- [ ] Check if dropdowns are populated
- [ ] **Expected**:
  - Groups dropdown shows all groups
  - Users dropdown shows all users with their roles
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 4.2: Assign First Admin
- [ ] Select a group from dropdown
- [ ] Select a user (preferably with "member" role)
- [ ] Click "Assign as Admin"
- [ ] **Expected**:
  - Green success message
  - Dropdowns reset
  - User role updated to "group_admin" in database
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 4.3: Duplicate Admin Assignment (Should FAIL)
- [ ] Select same group and user as Test 4.2
- [ ] Click "Assign as Admin"
- [ ] **Expected**: Red error message: "User is already an admin of this group"
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 4.4: Assign Admin to Different Group
- [ ] Select a different group
- [ ] Select the same user from Test 4.2
- [ ] Click "Assign as Admin"
- [ ] **Expected**: Success (one user can be admin of multiple groups)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 4.5: Form Validation
- [ ] Select only group (no user)
- [ ] Click "Assign as Admin"
- [ ] **Expected**: Error message
- [ ] Select only user (no group)
- [ ] Click "Assign as Admin"
- [ ] **Expected**: Error message
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 5. Manage Groups Tab Test

#### Test 5.1: Groups List Display
- [ ] Click "Manage Groups" tab
- [ ] **Expected**: See list of all created groups
- [ ] Verify each group card shows:
  - Group name
  - Description
  - Category badge (orange)
  - Joining type badge (purple)
  - Admins list
  - Member count
  - Creation date
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 5.2: Empty State
- [ ] If no groups exist, should see:
  - 🏢 icon
  - "No groups created yet" message
  - "Create First Group" button
- [ ] Click button
- [ ] **Expected**: Navigate to "Create Group" tab
- [ ] **Status**: ✅ Pass / ❌ Fail (or N/A if groups exist)

#### Test 5.3: Admin Display
- [ ] Find a group where you assigned admin (from Test 4.2)
- [ ] **Expected**: See admin name and email under "Admins:" section
- [ ] Find a group with no admins
- [ ] **Expected**: See "No admins assigned yet" in italics
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 5.4: Groups Order
- [ ] Verify groups are ordered by creation date (newest first)
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 6. Tab Navigation Test

#### Test 6.1: Tab Switching
- [ ] Click each tab in order
- [ ] **Expected**:
  - Active tab has orange underline
  - Active tab text is orange
  - Inactive tabs are gray
  - Content changes for each tab
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 6.2: Tab State Persistence
- [ ] Switch to "Create Group" tab
- [ ] Refresh the page
- [ ] **Expected**: Returns to "Overview" tab (default)
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 7. Real-time Data Updates Test

#### Test 7.1: Analytics Update After Group Creation
- [ ] Note current "Total Groups" count
- [ ] Create a new group
- [ ] Switch to "Overview" tab
- [ ] **Expected**: Count increased by 1
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 7.2: Groups List Update After Creation
- [ ] Go to "Manage Groups" tab
- [ ] Note current groups
- [ ] Go to "Create Group" tab
- [ ] Create a new group
- [ ] Return to "Manage Groups" tab
- [ ] **Expected**: New group appears at the top
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 7.3: Admin Assignment Reflection
- [ ] Assign an admin to a group
- [ ] Go to "Manage Groups" tab
- [ ] Find that group
- [ ] **Expected**: Admin appears in the admins list
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 8. UI/UX Test

#### Test 8.1: Loading States
- [ ] During group creation, observe button
- [ ] **Expected**:
  - Button text changes to "Creating..."
  - Button is disabled
- [ ] During admin assignment, observe button
- [ ] **Expected**:
  - Button text changes to "Assigning..."
  - Button is disabled
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 8.2: Message Auto-Dismiss
- [ ] Create a group successfully
- [ ] Observe success message
- [ ] Create another group
- [ ] **Expected**: Old message disappears, new message appears
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 8.3: Hover Effects
- [ ] Hover over inactive tabs
- [ ] **Expected**: Text color changes to white
- [ ] Hover over submit buttons
- [ ] **Expected**: Background color changes (darker orange)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 8.4: Mobile Navigation
- [ ] Open on mobile or resize to mobile width
- [ ] **Expected**:
  - Tabs scroll horizontally if needed
  - Icons and labels remain visible
  - Forms are full width and usable
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 9. Data Integrity Test

#### Test 9.1: Verify in Supabase
- [ ] Go to Supabase dashboard
- [ ] Open `groups` table
- [ ] **Expected**: See all created groups with correct data
- [ ] Open `group_admins` table
- [ ] **Expected**: See all admin assignments
- [ ] Open `users` table
- [ ] **Expected**: Assigned users have role = 'group_admin'
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 9.2: Created By Field
- [ ] In Supabase `groups` table
- [ ] Check `created_by` field for new groups
- [ ] **Expected**: Should be your founder user ID
- [ ] **Status**: ✅ Pass / ❌ Fail

---

### 10. Error Scenarios Test

#### Test 10.1: Network Error
- [ ] Open browser DevTools
- [ ] Go to Network tab
- [ ] Throttle to "Offline"
- [ ] Try to create a group
- [ ] **Expected**: Error message displayed
- [ ] Set back to "Online"
- [ ] **Status**: ✅ Pass / ❌ Fail

#### Test 10.2: Invalid URL Parameters
- [ ] Navigate to: `http://localhost:5173/founder-dashboard?invalid=true`
- [ ] **Expected**: Dashboard still works normally
- [ ] **Status**: ✅ Pass / ❌ Fail

---

## 🐛 Bug Tracking

### Bugs Found:
1. **Bug ID**: _________
   - **Description**: _________________________________
   - **Steps to Reproduce**: _________________________
   - **Expected**: ___________________________________
   - **Actual**: _____________________________________
   - **Severity**: Critical / High / Medium / Low
   - **Status**: Open / Fixed

2. **Bug ID**: _________
   - **Description**: _________________________________
   - **Steps to Reproduce**: _________________________
   - **Expected**: ___________________________________
   - **Actual**: _____________________________________
   - **Severity**: Critical / High / Medium / Low
   - **Status**: Open / Fixed

---

## 📊 Test Summary

- **Total Tests**: 40+
- **Tests Passed**: _____
- **Tests Failed**: _____
- **Tests Skipped**: _____
- **Pass Rate**: _____%
- **Bugs Found**: _____
- **Critical Bugs**: _____

---

## 🔍 Additional Exploratory Testing

Try these scenarios:
- [ ] Create a group with very long name (100+ characters)
- [ ] Create a group with special characters in name (@#$%^&*)
- [ ] Try to assign founder as admin (should work)
- [ ] Open dashboard in multiple tabs simultaneously
- [ ] Test with slow 3G network speed
- [ ] Test with browser zoom at 50%, 100%, 150%
- [ ] Test keyboard navigation (Tab key through forms)
- [ ] Test form auto-fill behavior

---

## 📝 Notes

Write any observations, suggestions, or improvements:

---

**Tested By**: ___________________
**Date**: November 26, 2024
**Browser**: ___________________
**OS**: Windows
**Screen Resolution**: ___________________
