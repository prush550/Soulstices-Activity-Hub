# Soulstices Activity Hub - Project Context

## 📋 Project Overview

**Name:** Soulstices Activity Hub  
**Purpose:** A community-driven platform for discovering and joining local activities in Bhopal, Madhya Pradesh  
**Central Question:** "What can I do today evening?"  
**Target Launch:** January 1, 2026  
**Target City:** Bhopal, MP, India  
**Developer:** Solo founder (prush550)  
**Founder Email:** mail.soulstices@gmail.com

## 🎯 Project Vision

A platform similar to Meetup.com where:
- Groups organize activities (sports, leisure, fitness, etc.)
- Users discover and join activities happening in their city
- Group admins manage their communities
- The platform answers: "What can I do today evening?"

## 👥 User Types & Roles

1. **Guests** - Unregistered users
   - Can view home page and public activities
   - Cannot interact or join activities
   - Must sign up to participate

2. **Members** - Registered users
   - Can join activities (public)
   - Can join groups (based on group settings)
   - Can view their profile and activity history

3. **Group Admins** - Manage specific groups
   - Can create activities for their group
   - Can edit/delete their group's activities
   - Can manage group members
   - Can set group joining rules

4. **Founder** - Platform owner (you)
   - Can create new groups
   - Can assign group admins
   - Full platform access
   - Currently: mail.soulstices@gmail.com

## 🏗️ System Architecture

### Group Structure:
- Each group has one or multiple Admins/Moderators
- Groups act as category-specific hubs (e.g., "Bhopal Badminton Club")
- Groups post activities on their group pages
- Groups have configurable joining rules:
  - **Public:** Anyone can join with one click
  - **Invite-Only:** Requires invite link from admin
  - **Screening:** Application form + admin approval

### Activity Structure:
**Mandatory Fields:**
- Place (location)
- Date
- Start Time
- End Time
- Probable Payment (cost)

**Activity Types:**
- **Public:** Non-group members can join
- **Private:** Only group members can join

**Participation Modes:**
- Limited capacity (max participants)
- Open/Unlimited
- Closed & Anonymous

## 💻 Technology Stack

### Frontend:
- **Framework:** React 18 with Vite
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS (dark theme)
- **Fonts:** Orbitron (display), Inter (body)
- **State:** React Context API
- **HTTP Client:** Supabase JS Client

### Backend:
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase (for future file uploads)
- **Legacy Backend:** Node.js + Express (minimal, mostly deprecated)

### Development Tools:
- **Editor:** Visual Studio Code
- **Version Control:** Git, GitHub (prush550)
- **Package Manager:** npm
- **Node.js:** Installed
- **OS:** Windows

## 📁 Current File Structure

```
soulstices-activity-hub/
├── backend/                    (Legacy - mostly unused now)
│   ├── data/
│   │   ├── activities.json     (Deprecated - data now in Supabase)
│   │   └── groups.json         (Deprecated - data now in Supabase)
│   ├── routes/
│   │   ├── activities.js
│   │   └── groups.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              ✅ Updated with auth
│   │   │   ├── ActivityCard.jsx        ✅ Fixed for Supabase
│   │   │   └── ProtectedRoute.jsx      ✅ New - route protection
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx                ✅ Updated for Supabase
│   │   │   ├── Groups.jsx              ✅ Working
│   │   │   ├── ActivityDetail.jsx      ✅ Fixed for Supabase
│   │   │   ├── SignUp.jsx              ✅ New - registration
│   │   │   ├── SignIn.jsx              ✅ New - login
│   │   │   └── Profile.jsx             ✅ New - user profile
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx         ✅ New - auth state management
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.js             ✅ New - Supabase client
│   │   │
│   │   ├── App.jsx                     ✅ Updated with auth routes
│   │   ├── main.jsx                    ✅ Working
│   │   └── index.css                   ✅ Dark theme styles
│   │
│   ├── .env                            ✅ Supabase credentials (not in git)
│   ├── index.html                      ✅ Working
│   ├── package.json                    ✅ Dependencies installed
│   ├── vite.config.js                  ✅ Configured
│   ├── tailwind.config.js              ✅ Custom dark theme
│   └── postcss.config.js               ✅ Working
│
├── .gitignore                          ✅ Configured
├── README.md                           ✅ Working
└── package.json                        ✅ Root config
```

## 🗄️ Database Schema (Supabase PostgreSQL)

### Tables:

**users**
- id (UUID, FK to auth.users)
- email (TEXT, unique)
- name (TEXT)
- role (ENUM: guest, member, group_admin, founder)
- phone (TEXT, optional)
- bio (TEXT, optional)
- profile_picture (TEXT, optional)
- created_at, updated_at

**groups**
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- category (TEXT)
- joining_type (ENUM: public, invite_only, screening)
- screening_form (JSONB)
- cover_image (TEXT)
- created_by (UUID, FK to users)
- member_count (INTEGER, auto-updated)
- created_at, updated_at

**group_admins** (many-to-many)
- id (UUID, PK)
- group_id (UUID, FK)
- user_id (UUID, FK)
- created_at

**activities**
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- group_id (UUID, FK to groups)
- place (TEXT) - Location
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- payment (TEXT) - Cost information
- type (ENUM: public, private)
- participant_limit (INTEGER, nullable)
- current_participants (INTEGER, auto-updated)
- created_by (UUID, FK to users)
- created_at, updated_at

**group_members**
- id (UUID, PK)
- user_id (UUID, FK)
- group_id (UUID, FK)
- status (ENUM: pending, approved, rejected)
- application_data (JSONB)
- joined_at

**activity_participants**
- id (UUID, PK)
- user_id (UUID, FK)
- activity_id (UUID, FK)
- status (ENUM: registered, attended, cancelled)
- registered_at

### Key Features:
- Row Level Security (RLS) enabled on all tables
- Automatic triggers for member/participant counts
- Founder role auto-assigned to mail.soulstices@gmail.com
- Email verification required for all users

## ✅ Completed Features

### Phase 1: Foundation ✅
- [x] Project setup (React + Vite + Tailwind)
- [x] Dark theme with orange accent colors
- [x] Home page with activity listings
- [x] Activity cards with all mandatory fields
- [x] Groups page
- [x] Activity detail page
- [x] Google Maps integration
- [x] Add to Calendar functionality
- [x] Share functionality (WhatsApp + Copy Link)
- [x] Mobile responsive design

### Phase 2: Authentication ✅
- [x] Supabase setup and configuration
- [x] Database migration from JSON to PostgreSQL
- [x] User sign up with email verification
- [x] User sign in with 30-day sessions
- [x] User profile management
- [x] Role-based access control
- [x] Protected routes
- [x] Founder account created and verified

### Phase 3: Data Layer ✅
- [x] All data fetching from Supabase
- [x] Sample data populated (6 groups, 8 activities)
- [x] Proper table relationships
- [x] Auto-updating counts

## 🚧 Next Steps (In Priority Order)

### Immediate Next:
1. **Founder Dashboard**
   - Page to create new groups
   - Assign group admins
   - View all platform activity
   - Platform analytics

2. **Group Admin Dashboard**
   - Create activities for their group
   - Edit/delete activities
   - Manage group members
   - Update group information

3. **Activity Joining**
   - Members can join public activities
   - Check participant limits
   - Update participant counts
   - Show "My Activities" on profile

4. **Group Joining Flows**
   - Public: One-click join
   - Invite-only: Generate and use invite links
   - Screening: Application form + admin approval

### Future Features:
- Group member management (for admins)
- Activity history tracking
- Notifications system
- Payment integration
- Mobile app
- Search and advanced filters
- User ratings and reviews
- Social sharing enhancements

## 🎨 Design System

### Colors:
- **Background:** #0a0a0a (dark-bg)
- **Cards:** #1a1a1a (dark-card)
- **Borders:** #2a2a2a (dark-border)
- **Primary Accent:** #f97316 (orange)
- **Secondary Accent:** #fb923c (light orange)
- **Success:** Green-400
- **Warning:** Yellow-400
- **Error:** Red-400

### Typography:
- **Display Font:** Orbitron (headings, brand)
- **Body Font:** Inter (content, UI)

### UI Patterns:
- Dark theme throughout
- Orange hover states
- Rounded corners (lg = 8px)
- Smooth transitions (0.2s ease-in-out)
- Cards with hover effects
- Gradient CTAs

## 🔐 Authentication Flow

### Sign Up:
1. User fills form (name, email, password)
2. Password validation (min 8 chars + number)
3. Supabase creates auth user
4. Trigger creates user profile in public.users
5. Email verification sent
6. User clicks verification link
7. Auto-signed in
8. Founder role auto-assigned for mail.soulstices@gmail.com

### Sign In:
1. User enters email + password
2. Supabase validates credentials
3. JWT token created (30-day expiry)
4. Session stored in localStorage
5. User profile fetched
6. Redirected to previous page or home

### Session:
- Duration: 30 days
- Auto-refresh enabled
- PKCE flow for security
- Persists across browser restarts

## 🔧 Development Setup

### Environment Variables (.env in frontend/):
```
VITE_SUPABASE_URL=https://mejsgjtnokcarssppdmx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lanNnanRub2tjYXJzc3BwZG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjA3NjIsImV4cCI6MjA3OTE5Njc2Mn0.YLbo4hEAAqyw8juUBaSypEh0AEU_U5Xy-81Oq-vxz4g
```

### Run Development:
```bash
# Frontend (port 5173)
cd frontend
npm run dev

# Backend (optional, legacy - port 5000)
cd backend
npm start
```

### Access:
- **Local:** http://localhost:5173
- **Mobile (same WiFi):** http://YOUR_IP:5173

## 📝 Important Notes

### Current Status:
- ✅ Website is live locally
- ✅ Authentication working
- ✅ Founder account active (mail.soulstices@gmail.com)
- ✅ Sample data populated
- ✅ All core pages functional
- ⏳ Ready to build Founder Dashboard

### Known Issues:
- None currently - all systems working

### Design Decisions:
1. **Mobile-first responsive design**
2. **Dark theme for reduced eye strain**
3. **Free tier services (Supabase free tier)**
4. **No external dependencies beyond npm packages**
5. **Simple, intuitive UX**
6. **Focus on "What can I do today evening?" question**

### Business Model:
- Currently: 100% free for users
- Monetization: To be decided later
- Focus: Build user base first

## 🎯 Success Metrics (Post-Launch)

- Number of active groups
- Number of activities posted weekly
- Number of users joining activities
- User retention rate
- Group admin satisfaction

## 📱 Target Users

### Primary:
- Sports enthusiasts in Bhopal
- Fitness groups
- Leisure activity organizers
- People looking for social activities

### Initial Focus:
- Existing group admins from Instagram, Reddit, WhatsApp
- Sports and leisure categories

## 🔄 Migration Status

### From JSON to Supabase:
- ✅ Groups migrated (6 groups)
- ✅ Activities migrated (8 activities)
- ✅ All relationships preserved
- ✅ Frontend updated to use Supabase
- ✅ Backend deprecated (can be removed later)

## 🆘 Common Commands

```bash
# Install dependencies
npm install

# Run frontend dev server
cd frontend && npm run dev

# Run backend (legacy)
cd backend && npm start

# Clear cache and reinstall
npm cache clean --force
npm install

# Git commands
git add .
git commit -m "message"
git push origin main

# View file structure
tree /F    # Windows
ls -R      # Mac/Linux
```

## 📞 Contacts & Links

- **GitHub Repo:** https://github.com/prush550/soulstices-activity-hub
- **Supabase Project:** mejsgjtnokcarssppdmx
- **Founder Email:** mail.soulstices@gmail.com
- **Local Dev:** http://localhost:5173

---

**Last Updated:** November 26, 2024  
**Status:** ✅ Authentication Complete, Ready for Founder Dashboard  
**Next Task:** Build Founder Dashboard to create groups

---

## 💡 For Claude Code:

When working on this project:
1. Always respect the existing file structure
2. Use Supabase for all data operations (not JSON files)
3. Follow the dark theme color scheme
4. Maintain mobile responsiveness
5. Keep authentication context in mind
6. Test on both desktop and mobile
7. Use the existing component patterns
8. Follow the established naming conventions

The codebase is clean, well-structured, and ready for the next phase of development. All authentication is working correctly, and the founder account is active and ready to use.