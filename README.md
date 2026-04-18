# Order Tracker — Full Stack Web App

A real-time, multi-user order tracking system built with **Next.js 14**, **Supabase**, and deployed on **Vercel**. Supports 5 distinct roles with fine-grained permissions, inline cell editing, simultaneous multi-user collaboration, and automatic Sales notifications on delay.

---

## Features

- **5 Roles**: Admin, Planner1, Inventory, Logistics, Sales
- **Role-based editing**: Each role can only edit their permitted fields (enforced at DB level via RLS)
- **Inline cell editing**: Click any cell to edit in-place, Enter to save, Esc to cancel
- **Realtime sync**: All users see changes instantly via Supabase Realtime WebSockets
- **Sales delay alerts**: Sales users get a toast notification + bell badge when General Status → "delay"
- **Full order form**: 109 fields across 7 tabbed sections (Order Info, Part Details, Dates, Pricing, Assembly, Tracking, Delay Flags)
- **Column picker**: Toggle which columns are visible in the table
- **Audit log**: Every change is logged with user, field, before/after values
- **User management**: Admin can create accounts, edit roles, activate/deactivate users
- **Responsive**: Works on mobile, tablet, and desktop

---

## Role Permissions

| Role      | Can Edit                                         |
|-----------|--------------------------------------------------|
| Admin     | All fields + User Management + Audit Log         |
| Planner1  | All fields                                       |
| Inventory | Consumption Status only                          |
| Logistics | Tracking #, Invoice #, Assembly Invoice # only   |
| Sales     | Read-only — notified when status changes to Delay|

---

## Setup Guide

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/order-tracker.git
cd order-tracker
npm install
```

### 2. Create a Supabase Project

1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **Anon Key** from Settings > API
3. In the Supabase **SQL Editor**, paste and run the contents of:
   `supabase/migrations/001_initial.sql`

### 3. Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Create the First Admin User

Sign up through the app at `/login`, then in the Supabase SQL Editor run:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Run Locally

```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel

**Recommended: GitHub Integration**

1. Push this repo to GitHub
2. Go to https://vercel.com → Import Project → Select your repo
3. Add these environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click Deploy — every push to `main` auto-deploys

---

## Project Structure

```
src/
├── app/
│   ├── login/            Login page
│   └── dashboard/
│       ├── layout.tsx    Nav bar + auth guard
│       ├── page.tsx      Main orders table + stats
│       ├── admin/        User management (admin only)
│       └── audit/        Audit log (admin only)
├── components/
│   ├── OrderTable.tsx         Inline-editable data table
│   ├── OrderFormModal.tsx     Full 109-field order form (7 tabs)
│   └── NotificationBell.tsx   Realtime notifications
└── lib/
    ├── types.ts               TypeScript types + role config
    ├── auth-context.tsx        Auth provider + hook
    └── supabase/
        ├── client.ts           Browser Supabase client
        └── server.ts           Server Supabase client

supabase/
└── migrations/
    └── 001_initial.sql   Tables, RLS policies, triggers
```

---

## Database Schema

| Table         | Purpose                                          |
|---------------|--------------------------------------------------|
| profiles      | User accounts (extends Supabase auth.users)      |
| orders        | All 109 order tracking fields                    |
| audit_log     | Every field change with before/after values      |
| notifications | Sales delay alerts                               |

Key DB features:
- Row Level Security (RLS) enforces permissions at DB level, not just UI
- Auto-notify trigger creates notifications for Sales on delay status
- Auto-profile trigger creates a profile row on signup
- updated_at auto-managed on all tables

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14 (App Router), React, TypeScript |
| Styling    | Tailwind CSS                            |
| Database   | Supabase (PostgreSQL)                   |
| Auth       | Supabase Auth (JWT)                     |
| Realtime   | Supabase Realtime (WebSockets)          |
| Deployment | Vercel                                  |
