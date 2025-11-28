# New Features Guide - Edit Group & Invite-Only Activities

## 🎉 What's New

### Feature #1: Edit Group Information ✅
Group admins can now edit their group's information!

### Feature #2: Invite-Only Activity Type ✅
Activities can now be invite-only, requiring a unique code to join!

---

## 📋 **Setup Instructions**

### **Step 1: Update Database Schema**

1. Open Supabase SQL Editor
2. Open `add-invite-only-feature.sql`
3. Copy ALL the SQL
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message

This adds the `invite_code` column to activities table.

---

## 🎯 **Feature #1: Edit Group**

### **How It Works:**

1. **Navigate to Group Admin Dashboard** → "My Groups" tab
2. **Find the group** you want to edit
3. **Click "✏️ Edit"** button
4. A new "Edit Group" tab appears
5. **Modify any of these fields**:
   - Group Name
   - Description
   - Category
   - Joining Type (Public, Invite Only, Screening)
6. **Click "Update Group"**
7. Success! Group is updated

### **What Can Be Edited:**
- ✅ Group name
- ✅ Description
- ✅ Category
- ✅ Joining type
- ❌ Cannot delete groups (only founders can)
- ❌ Cannot change group ownership

### **UI Features:**
- New "Edit" button on each group card
- Dedicated "Edit Group" tab
- Pre-filled form with current values
- Cancel button to abort changes
- Success/error messages

---

## 🎯 **Feature #2: Invite-Only Activities**

### **Activity Types Available:**

| Type | Who Can Join | Special Requirement |
|------|--------------|---------------------|
| **Public** | Anyone | None |
| **Private** | Only group members | Must be in the group |
| **Invite-Only** | Anyone with invite code | Must have the code |

### **Creating an Invite-Only Activity:**

1. **Go to** Group Admin Dashboard → "Create Activity"
2. **Fill in all fields** as usual
3. **Activity Type** → Select **"Invite-Only - Requires invite code"**
4. You'll see: 💡 "An invite code will be automatically generated"
5. **Click "Create Activity"**
6. **Success message shows**: "Activity created successfully! Invite code: ABC12345"
7. **Share this code** with people you want to invite

### **Invite Code Features:**

- **Auto-generated**: 8 characters, uppercase, alphanumeric
- **Example**: `A3B7C9D2`
- **Unique**: Each invite-only activity gets its own code
- **Persistent**: Code doesn't change or expire
- **Visible**: Shows in "My Activities" tab and activity details

### **Where to Find Invite Codes:**

1. **Success message** when creating activity
2. **"My Activities" tab** → Shows as blue badge: 🔑 Code: ABC12345
3. **Edit activity** → Code is displayed
4. **Activity card** → Visible to admin

### **Sharing Invite Codes:**

You can share the code via:
- WhatsApp message
- SMS
- Email
- In-person
- Posters/Flyers

**Example message**:
```
Join our Evening Badminton Session!
📅 Tomorrow, 6:00 PM
📍 DB City Sports Complex
🔑 Invite Code: A3B7C9D2

Use this code to join: [Activity Link]
```

---

## 🔧 **Technical Details**

### **Database Changes:**

**Activities Table** - New Column:
```sql
invite_code TEXT (nullable)
- NULL for public/private activities
- Auto-generated 8-char code for invite-only
- Indexed for fast lookups
```

**Activity Types**:
```
type: 'public' | 'private' | 'invite_only'
```

### **Code Generation:**

```javascript
// Generates: A3B7C9D2 (example)
const code = Math.random()
  .toString(36)
  .substring(2, 10)
  .toUpperCase()
```

### **RLS Policies:**

- ✅ Anyone can view activities (to check if invite code is valid)
- ✅ Only admins can create invite-only activities
- ✅ Only admins can see their own invite codes

---

## 📊 **Usage Examples**

### **Example 1: Exclusive Workshop**
```
Activity: Advanced Badminton Workshop
Type: Invite-Only
Why: Limited to experienced players only
Invite Code: XY7Z4A2B
Share with: Only players who passed skill test
```

### **Example 2: Friends Gathering**
```
Activity: Weekend Hiking Trip
Type: Invite-Only
Why: Limited group size, friends only
Invite Code: F9G2H5J8
Share with: Close friends group on WhatsApp
```

### **Example 3: Beta Testing Event**
```
Activity: New Fitness Program Trial
Type: Invite-Only
Why: Testing before public launch
Invite Code: T1E2S3T4
Share with: Selected beta testers
```

---

## 🎨 **UI Updates**

### **Group Admin Dashboard:**

**My Groups Tab**:
- ✅ New "✏️ Edit" button on each group card
- ✅ Better layout with two buttons (Edit + Create Activity)

**Edit Group Tab** (New!):
- ✅ Appears when editing a group
- ✅ Pre-filled form
- ✅ Update/Cancel buttons
- ✅ Success/error messages

**Create Activity Tab**:
- ✅ New option: "Invite-Only"
- ✅ Helper text explaining invite code generation
- ✅ Invite code displayed in success message

**My Activities Tab**:
- ✅ Invite-only badge (blue)
- ✅ Invite code displayed: 🔑 Code: ABC12345
- ✅ Edit functionality preserves invite code

---

## 🧪 **Testing Guide**

### **Test Edit Group:**

1. [ ] Go to Group Admin Dashboard
2. [ ] Click "Edit" on a group
3. [ ] Change group name
4. [ ] Click "Update Group"
5. [ ] Verify name changed in "My Groups"
6. [ ] Verify name changed on home page

### **Test Invite-Only Activity:**

1. [ ] Create new activity
2. [ ] Select "Invite-Only" type
3. [ ] Submit form
4. [ ] Copy the invite code from success message
5. [ ] Go to "My Activities" tab
6. [ ] Verify invite code is visible
7. [ ] Edit the activity
8. [ ] Verify invite code is still there
9. [ ] Check activity on home page

### **Test Activity Types:**

1. [ ] Create Public activity → No invite code
2. [ ] Create Private activity → No invite code
3. [ ] Create Invite-Only activity → Has invite code
4. [ ] All three appear correctly in "My Activities"

---

## 🚀 **What's Next**

With these features complete, you can now:

1. ✅ Edit group information as group admin
2. ✅ Create three types of activities
3. ✅ Generate and share invite codes
4. ✅ Control who can join activities

### **Remaining from Project Roadmap:**

1. **Activity Joining** - Members can join activities
2. **Invite Code Validation** - Check code when joining
3. **Group Joining Flows** - Join groups (public/invite/screening)
4. **Member Management** - Approve/reject group members

---

## 📝 **Important Notes**

### **Permissions:**

- ✅ Group admins can edit THEIR groups
- ✅ Group admins can create activities for THEIR groups
- ✅ Founders can do everything
- ❌ Regular members cannot edit groups
- ❌ Regular members cannot create activities

### **Invite Codes:**

- Codes are **permanent** (don't expire)
- Codes are **case-insensitive** for joining
- Codes are **unique** per activity
- Codes **cannot be changed** once created
- Lost codes can be viewed in "My Activities"

### **Group Editing:**

- Cannot change group ID
- Cannot transfer ownership
- Changes are immediate
- All members see updated info
- Cannot delete groups (founder only)

---

## 🐛 **Troubleshooting**

### Issue: Edit button doesn't work
**Solution**: Make sure you're admin of that group. Check `group_admins` table.

### Issue: Invite code not generated
**Solution**:
1. Check activity type is "invite_only"
2. Check database has `invite_code` column
3. Run the SQL script to add column

### Issue: Can't see Edit Group tab
**Solution**: Click the "Edit" button on a group card first

### Issue: Invite code not showing
**Solution**:
1. Activity must be type "invite_only"
2. Check "My Activities" tab
3. Invite code appears as blue badge

---

## 📄 **Files Modified**

| File | Changes |
|------|---------|
| [GroupAdminDashboard.jsx](frontend/src/pages/GroupAdminDashboard.jsx) | Added Edit Group + Invite-Only |
| [add-invite-only-feature.sql](add-invite-only-feature.sql) | Database schema update |

---

## ✅ **Feature Checklist**

### Edit Group:
- [x] Edit button on group cards
- [x] Edit Group form
- [x] Update functionality
- [x] Success/error messages
- [x] Cancel button
- [x] UI integration

### Invite-Only Activities:
- [x] Third activity type option
- [x] Invite code generation
- [x] Code displayed in success message
- [x] Code visible in My Activities
- [x] Code preserved in edit mode
- [x] Blue badge for invite-only
- [x] Database schema updated
- [x] UI helper text

---

**Status**: ✅ Both Features Implemented
**Database Update Required**: Yes - Run [add-invite-only-feature.sql](add-invite-only-feature.sql)
**Ready for Testing**: Yes
**Next Step**: Test both features, then implement Activity Joining

---

Last Updated: November 26, 2024
