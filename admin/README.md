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
│       ├── main.jsx
│       └── supabase.js ← Supabase client + helpers
├── portfolio/
│   └── index.html      ← Your portfolio (reads from Supabase)
├── .github/workflows/
│   └── deploy.yml      ← GitHub Pages auto-deploy
└── README.md
```

---

## ⚡ Setup

### 1 — Supabase

In SQL Editor, run:

```sql
create table if not exists portfolio_data (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table portfolio_data enable row level security;
create policy "public_read" on portfolio_data for select using (true);
create policy "admin_write" on portfolio_data for all using (true) with check (true);
alter publication supabase_realtime add table portfolio_data;
```

Then run `supabase_full.sql` to seed all data (about, skills, certs, experience, contact).

### 2 — Add credentials to portfolio HTML

In `portfolio/index.html`, find and fill:
```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3 — Deploy

```bash
git init
git add .
git commit -m "Portfolio OS v3"
git remote add origin https://github.com/cybaash/cybaash.github.io
git push -u origin main
```

In GitHub → Settings → Pages → Source: **GitHub Actions**

| URL | Content |
|---|---|
| `https://cybaash.github.io/` | Portfolio |
| `https://cybaash.github.io/admin/` | Admin panel |

Default admin password: `Aasiq@2025`
