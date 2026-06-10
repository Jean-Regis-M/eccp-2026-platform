# ECCP 2026 — Production Hosting Guide

Deploy the **Equity College Counselling Program 2026** mentorship platform to run 24/7 for scholars, mentors, and administrators.

---

## Repository (GitHub)

| Item | Value |
|------|-------|
| **GitHub account** | [Jean-Regis-M](https://github.com/Jean-Regis-M) |
| **Repository name** | `eccp-2026-platform` |
| **Repository URL** | https://github.com/Jean-Regis-M/eccp-2026-platform |
| **Description** | Equity College Counselling Program 2026 — Digital mentorship platform for Rwanda scholars, mentors, and org admins. React + Express + SQLite. |

When creating the repo on GitHub, use:

- **Name:** `eccp-2026-platform`
- **Description:** `Equity College Counselling Program 2026 — Digital mentorship platform for Rwanda scholars, mentors, and administrators.`
- **Visibility:** Private (recommended) or Public
- **Do NOT** initialize with README (you already have one locally)

---

## Recommended Stack

| Component | Recommendation |
|-----------|----------------|
| Hosting | [Render.com](https://render.com) Starter ($7/mo) OR [Railway](https://railway.app) |
| Database | SQLite + persistent volume |
| Uptime monitor | [UptimeRobot](https://uptimerobot.com) (free, every 5 min) |
| Email | Gmail App Password or SendGrid |
| Domain | Optional custom domain |

---

## Step 1 — Prepare locally (Windows PowerShell as Administrator)

```powershell
cd "C:\Users\ELOHOME\Downloads\ECCP PLATFORM TO BE"

# Must be Node 22 (not 24)
node -v

npm install
npm run setup
npm run build
```

Confirm:

- `npm run setup` prints `✅ Database module OK`
- `npm run build` creates the `dist/` folder
- `public/logo.png` exists (used on site and PDF reports)

---

## Step 2 — Push to GitHub

### First-time setup

```powershell
cd "C:\Users\ELOHOME\Downloads\ECCP PLATFORM TO BE"

git init
git add .
git commit -m "ECCP 2026 Platform — production ready"
git branch -M main
git remote add origin https://github.com/Jean-Regis-M/eccp-2026-platform.git
git push -u origin main
```

### Later updates

```powershell
git add .
git commit -m "Describe your change"
git push
```

### Files excluded automatically (`.gitignore`)

- `node_modules/`
- `dist/` (rebuilt on deploy)
- `server/eccp.db` and WAL files
- `server/uploads/`
- `.env`

**Never commit** passwords, JWT secrets, or Gmail app passwords.

---

## Step 3 — Deploy on Render.com

1. Go to https://render.com and sign in with GitHub.
2. **New → Web Service** → connect repo `Jean-Regis-M/eccp-2026-platform`.
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `eccp-2026-platform` |
| **Region** | Frankfurt (EU) or closest to Rwanda |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | **Starter ($7/mo)** — required for 24/7 (free tier sleeps) |

4. **Environment Variables** (Render → Environment):

```
JWT_SECRET=generate-a-long-random-string-at-least-64-characters-here
NODE_ENV=production
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=eccpmentor.regismukiza@gmail.com
SMTP_PASS=your-gmail-app-password
DB_PATH=/data/eccp.db
```

Generate `JWT_SECRET` in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

5. **Persistent Disk** (critical — keeps database across restarts):

   - Render → your service → **Disks** → Add Disk
   - **Mount path:** `/data`
   - **Size:** 1 GB (enough for 67+ scholars)
   - Ensure `DB_PATH=/data/eccp.db` is set

6. Click **Deploy**. Wait for build to finish (3–5 minutes).

7. Your live URL will be: `https://eccp-2026-platform.onrender.com` (or similar).

---

## Step 4 — Gmail App Password (for email reminders & password reset)

1. Google Account → Security → enable **2-Step Verification**
2. Security → **App passwords** → create one for "Mail"
3. Copy the 16-character password into Render env var `SMTP_PASS`

---

## Step 5 — Keep server awake (free tier only)

If you temporarily use Render's free tier:

1. https://uptimerobot.com → Add Monitor
2. Type: HTTP(s)
3. URL: your Render URL (e.g. `https://eccp-2026-platform.onrender.com/api/health`)
4. Interval: 5 minutes

Scholars may see ~30s delay on first load after sleep.

---

## Step 6 — Post-deploy checklist

- [ ] Open live URL — login page loads with logo
- [ ] Login as **admin** (`eccpmentor.regismukiza@gmail.com` / `Equity@2026`)
- [ ] Login as **mentor** and **scholar**
- [ ] Mark test attendance — confirm it saves and shows on scholar dashboard
- [ ] Create a test quiz with 5-minute limit
- [ ] Download **Weekly Mentor Report PDF** — all 9 sections left-aligned, in order
- [ ] Send test reminder email (admin)
- [ ] **Change all default passwords**
- [ ] Add UptimeRobot monitor

---

## Security hardening

- Render provides free HTTPS/SSL automatically
- Use a strong unique `JWT_SECRET` (never the default)
- Rate limiting: 20 login attempts per 15 minutes (built-in)
- Failed logins logged in Platform History
- Back up `/data/eccp.db` weekly (Render disk snapshot or manual download)

---

## Scaling

| Users | Recommendation |
|-------|----------------|
| 67 scholars + 6 mentors + 3 admins | Render Starter + SQLite (current setup) |
| 500+ users | Migrate to PostgreSQL |

SQLite WAL mode handles concurrent reads for this cohort size.

---

## Troubleshooting deploy

| Problem | Fix |
|---------|-----|
| Build fails on `better-sqlite3` | Render uses Linux — prebuilt binaries work. Ensure `engines.node` is `>=20 <=22` in `package.json` |
| App starts but login fails | Check `JWT_SECRET` is set; check logs in Render dashboard |
| Data lost after restart | Add persistent disk at `/data` and set `DB_PATH=/data/eccp.db` |
| Email not sending | Verify Gmail App Password in `SMTP_PASS`; check Render logs |
| PDF sections misaligned | Fixed in latest version — redeploy after `git push` |

---

## Support

**ECCP Program:** eccpmentor.regismukiza@gmail.com  
**Platform developer:** [Jean-Regis-M on GitHub](https://github.com/Jean-Regis-M)
