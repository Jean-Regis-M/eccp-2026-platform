# ECCP Platform — Windows Setup (Final)

Complete guide to run locally on **Windows PowerShell (Run as Administrator)** and deploy to production.

---

## What you need (one-time)

| Requirement | Version | Why |
|-------------|---------|-----|
| **Node.js** | **22.x** (NOT 24) | `better-sqlite3` database driver needs Node 20–22 on Windows |
| **npm** | Comes with Node | Installs packages and runs scripts |
| **PowerShell** | Built into Windows | Run all commands below |

No Docker, PostgreSQL, or extra databases required — SQLite is included.

---

## PART 1 — Install Node.js 22 (Administrator PowerShell)

Open **Start → type `PowerShell` → right-click → Run as administrator**.

### Step 1 — Install Node.js 22 (not the default LTS which may be v24)

```powershell
winget install OpenJS.NodeJS.22 --source winget --accept-package-agreements --accept-source-agreements
```

> If you previously installed Node 24 (`OpenJS.NodeJS.LTS`), uninstall it first:
> `winget uninstall OpenJS.NodeJS.LTS --source winget`
> then run the install command above.

### Step 2 — Close and reopen PowerShell as Administrator

Refresh PATH, then verify:

```powershell
node -v
npm -v
```

You must see **`v22.x.x`** (for example `v22.22.3`). If you see `v24`, Node 22 is not active — repeat Step 1.

---

## PART 2 — Install platform dependencies (Administrator PowerShell)

### Step 3 — Go to the project folder

```powershell
cd "C:\Users\ELOHOME\Downloads\ECCP PLATFORM TO BE"
```

### Step 4 — Stop any old servers (prevents file-lock errors)

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 5 — Clean install all packages

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

Wait until it finishes with no errors (warnings about deprecated packages are OK).

### Step 6 — Verify database module

```powershell
npm run setup
```

Expected output:

```
Node.js v22.x.x
✅ Database module OK — run: npm run dev
```

If this fails, see **Troubleshooting** at the bottom.

---

## PART 3 — Run locally (development)

### Step 7 — Start the platform

```powershell
npm run dev
```

Wait until you see **both**:

```
✅ API server ready at http://localhost:3001/api
Open: http://localhost:5173
```

### Step 8 — Open in browser

Type in the address bar (do **not** double-click an HTML file):

**http://localhost:5173**

The login page should show **"✅ Server connected"**.

### Step 9 — Test login

| Role | Login | Password |
|------|-------|----------|
| Admin | eccpmentor.regismukiza@gmail.com | Equity@2026 |
| Mentor | endamage416@gmail.com | Equity@2026 |
| Scholar | 56647 (any PF from seed) | Cohort@2026 |

### Step 10 — Stop the server

Press **Ctrl + C** in the same PowerShell window.

---

## PART 4 — Run locally (production mode)

Use this to test exactly what will run when deployed:

```powershell
npm run build
npm start
```

Open: **http://localhost:3001**

Stop with **Ctrl + C**.

---

## PART 5 — Deploy to production (Render / Railway)

After local dev and production mode both work:

### Step 11 — Build once more

```powershell
cd "C:\Users\ELOHOME\Downloads\ECCP PLATFORM TO BE"
npm run build
```

### Step 12 — Push to GitHub

```powershell
git init
git add .
git commit -m "ECCP 2026 Platform ready for deploy"
git remote add origin https://github.com/Jean-Regis-M/eccp-2026-platform.git
git push -u origin main
```

Do **not** commit: `node_modules/`, `server/eccp.db`, `server/uploads/`

### Step 13 — Deploy on Render.com

1. https://render.com → **New Web Service** → connect your GitHub repo
2. **Build command:** `npm install && npm run build`
3. **Start command:** `npm start`
4. **Plan:** Starter ($7/mo) for 24/7 uptime
5. **Environment variables:**

```
JWT_SECRET=your-64-char-random-secret-here
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=eccpmentor.regismukiza@gmail.com
SMTP_PASS=your-gmail-app-password
DB_PATH=/data/eccp.db
```

6. Add a **Persistent Disk** mounted at `/data` (keeps your database across restarts)

Full details: [HOSTING.md](HOSTING.md)

### Step 14 — Post-deploy checklist

- [ ] Login as admin, mentor, and one scholar
- [ ] Mark test attendance
- [ ] Create a test quiz
- [ ] Download weekly report PDF
- [ ] Change all default passwords

---

## Quick reference (copy-paste block)

Run this entire block in **Administrator PowerShell** for a fresh setup:

```powershell
# 1. Install Node 22 (skip if already v22)
winget install OpenJS.NodeJS.22 --source winget --accept-package-agreements --accept-source-agreements

# 2. Close & reopen PowerShell as Admin, then:
cd "C:\Users\ELOHOME\Downloads\ECCP PLATFORM TO BE"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
npm run setup
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Troubleshooting

### `npm` is not recognized

Close PowerShell completely and open a **new** Administrator window. Node adds itself to PATH on install.

### Node shows v24 instead of v22

```powershell
winget uninstall OpenJS.NodeJS.LTS --source winget
winget install OpenJS.NodeJS.22 --source winget --accept-package-agreements --accept-source-agreements
```

### `better-sqlite3` / EPERM / rebuild failed

1. Stop all servers: `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force`
2. Run PowerShell **as Administrator**
3. Clean rebuild:

```powershell
cd "C:\Users\ELOHOME\Downloads\ECCP PLATFORM TO BE"
Remove-Item -Recurse -Force node_modules\better-sqlite3\build -ErrorAction SilentlyContinue
npm rebuild better-sqlite3
npm run setup
```

### Login says "fetch failed"

The API is not running. Run `npm run dev` and wait for `✅ API server ready`.

### Port 3001 already in use

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run dev
```

---

## Status on this machine (verified)

- Node.js **v22.22.3** installed
- `npm install` — success (319 packages)
- `npm run setup` — database OK
- `npm run build` — frontend built to `dist/`
- `npm run dev` — API on :3001, frontend on :5173
- Admin login — working

You are ready to use the platform locally and deploy when you push to GitHub.
