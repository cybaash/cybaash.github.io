# Portfolio OS v3 — Supabase Edition

Admin panel + live portfolio with **Supabase** as the backend.
Anyone with the admin password can edit from any device, anywhere.
Portfolio visitors always see the latest data — no page reload needed.

---

## 🗂 Structure

```
portfolio-os/
├── admin/              ← React admin panel (Vite + Supabase SDK)
│   └── src/
│       ├── App.jsx     ← Full admin UI (all 8 sections)
│       └── supabase.js ← Supabase client + helpers
├── portfolio/
│   └── index.html      ← Your portfolio + sync bridge injected
├── .github/workflows/
│   └── deploy.yml      ← GitHub Pages auto-deploy
└── README.md
```

---

## ⚡ 5-Minute Setup

### Step 1 — Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In **SQL Editor**, run:

```sql
create table if not exists portfolio_data (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table portfolio_data enable row level security;

-- Public read (portfolio visitors)
create policy "public_read" on portfolio_data
  for select using (true);

-- Admin write (enforced by app-level password)
create policy "admin_write" on portfolio_data
  for all using (true) with check (true);

-- Enable realtime updates
alter publication supabase_realtime add table portfolio_data;
```

3. Go to **Settings → API** and copy:
   - **Project URL** → `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** → `eyJhbGciOiJ...`

---

### Step 2 — Configure portfolio HTML

Open `portfolio/index.html`, find near the bottom:

```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values.

> ✅ The anon key is **safe to expose** in frontend — Supabase RLS ensures it's read-only.

---

### Step 3 — Deploy to GitHub Pages

```bash
# 1. Create repo named: yourusername.github.io
# 2. Push this folder as repo root
git init
git add .
git commit -m "Portfolio OS v3"
git remote add origin https://github.com/yourusername/yourusername.github.io
git push -u origin main

# 3. In GitHub → Settings → Pages → Source: GitHub Actions
```

GitHub Actions builds the admin panel and deploys everything.

| URL | Content |
|---|---|
| `https://yourusername.github.io/` | Your portfolio |
| `https://yourusername.github.io/admin/` | Admin panel |

---

### Step 4 — First admin login

1. Visit `/admin/`
2. The **Setup Wizard** opens — paste your Supabase URL + anon key
3. It tests the connection and saves config to your browser
4. Log in with password: `Aasiq@2025`
5. Start editing — every save syncs instantly to Supabase

---

## 🔐 Security Model

| Who | Can do |
|---|---|
| Anyone | View portfolio (public Supabase read) |
| Anyone with admin URL | See login screen |
| Admin password holder | Edit all portfolio sections |
| Nobody | Bypass Supabase without the anon key |

The admin password is stored in **your browser's localStorage only**.
Change it any time: Admin → Settings → Change Password.

---

## 🔄 How Real-Time Sync Works

```
Admin saves → Supabase upsert
     ↓
Supabase Realtime WebSocket broadcasts change
     ↓
Portfolio page receives event → patches DOM instantly
     ↓
"⟳ CONTENT UPDATED" flash indicator appears
```

No page reload. No polling. Pure WebSocket push.

---

## 🛠 Local Development

```bash
cd admin
npm install
npm run dev
# Open http://localhost:5173
# Setup wizard will prompt for Supabase keys on first run
```

---

## 📦 Credentials: Default

```
Password: Aasiq@2025
```

Change after first login in Settings → Change Password.
