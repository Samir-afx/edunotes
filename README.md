# 🎓 EduNotes — MAKAUT CSE Student Platform & Community Notes Hub

A production-ready, Outcome-Based Education (OBE) collaborative academic platform built for **Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal** First-Year Computer Science & Engineering students (sem126 official curriculum).

---

## 🏗️ Production Architecture & Stack

| Layer | Technology | Free Tier |
| :--- | :--- | :--- |
| **Frontend** | Pure Semantic HTML5, Vanilla CSS3 (Design Tokens), Vanilla JS (ES6 Modules) | **Cloudflare Pages** (Unlimited bandwidth & requests) |
| **Backend / Database** | PostgreSQL 15+ with Row-Level Security (RLS) & Triggers | **Supabase** (500 MB DB, 50,000 MAU) |
| **Authentication** | Supabase Auth (JWT with email/password and session persistence) | **Supabase Auth** |
| **File Storage** | Supabase Storage (`community-notes` bucket with raw binary preservation) | **Supabase Storage** (1 GB Free) |
| **Source Control** | Git & GitHub | **GitHub** |

---

## 📁 Repository Structure

```
edunotes/
├── index.html              # Authenticated Single-Page Application (SPA) shell & modals
├── style.css               # Design system (Dark/Light themes, glassmorphism, responsive)
├── main.js                 # Master controller (routing, views, syllabus, notes, Q&A, chat)
├── auth-db-service.js      # Multi-user auth & database engine with session management
├── supabase-client.js      # Supabase client wrapper & configuration
├── makaut-syllabus-data.js # Official MAKAUT First-Year Syllabus (sem126 source of truth)
├── supabase_schema.sql     # PostgreSQL database schema with RLS security policies & triggers
├── _headers                # Cloudflare Pages security & caching headers
├── _redirects              # Cloudflare Pages SPA client-side routing fallback (/* -> /index.html 200)
├── .env.example            # Environment configuration template
├── .gitignore              # Protects secrets, credentials, and local environment files
└── README.md               # Documentation & Deployment Guide
```

---

## 🚀 Production Deployment Guide

### 1. Step 1 — GitHub Repository Setup

1. Create a new repository on GitHub named **`edunotes`**:
   - Repository type: **Public** or **Private**
2. Initialize and push the project:
   ```bash
   git init
   git add .
   git commit -m "feat: initial production-ready EduNotes platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/edunotes.git
   git push -u origin main
   ```
*(Note: Secrets and `.env` files are automatically excluded by `.gitignore`)*

---

### 2. Step 2 — Cloudflare Pages Deployment (Free)

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application** > **Pages** > **Connect to Git**.
3. Select your **`edunotes`** repository.
4. Configure Build Settings:
   - **Framework preset**: `None`
   - **Build command**: *(Leave empty)*
   - **Build output directory**: `/` or `.` (root directory)
5. Under **Environment variables (Advanced)**, add your public Supabase keys:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOi...your-anon-key`
6. Click **Save and Deploy**.
7. Cloudflare will provide a free production URL, e.g.:
   `https://edunotes.pages.dev`

---

### 3. Step 3 — Supabase Backend & Database Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the entire `supabase_schema.sql` file.
3. This creates:
   - All 15 relational tables (`profiles`, `courses`, `modules`, `topics`, `notes`, `note_ratings`, `note_comments`, `bookmarks`, `student_progress`, `questions`, `answers`, `chat_messages`, `announcements`, `reports`, `calendar_events`).
   - RLS security policies on all tables.
   - The database trigger `protect_profile_role_update()` preventing non-admins from promoting roles.
   - The `admin_set_user_role` RPC function.
   - The `community-notes` storage bucket.
   - The initial admin elevation for `sayangorai298@gmail.com`.

---

### 4. Step 4 — Supabase Authentication URL Configuration

To ensure authentication and password reset links redirect properly to your live domain:
1. In the Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. Set **Site URL**:
   `https://edunotes.pages.dev` (or your custom domain)
3. Under **Redirect URLs**, add:
   - `https://edunotes.pages.dev/**`
   - `http://localhost:3000/**` (for local development)
4. Click **Save**.

---

### 5. Step 5 — Storage Bucket Verification

1. In Supabase Dashboard, go to **Storage**.
2. Verify the **`community-notes`** bucket exists with **Public bucket** set to `true`.
3. Under **Policies**, ensure:
   - `Authenticated users can upload study files` (INSERT)
   - `Public read access for community-notes` (SELECT)
   - `Users can update and delete their own files` (DELETE)

---

## 🔐 Security Standards Applied

- 🛡️ **Zero Hardcoded Credentials**: Passwords and secrets are never committed or exposed.
- 🛡️ **Database-Enforced RBAC**: Role changes are guarded by PostgreSQL triggers and RPCs. Ordinary students cannot make themselves Admin via frontend, LocalStorage, console, or API modifications.
- 🛡️ **Original Binary Integrity**: File uploads and downloads transfer raw byte streams without text transformation.
- 🛡️ **XSS Sanitization**: All user inputs are escaped via `escapeHTML()` before DOM insertion.
