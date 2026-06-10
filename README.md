# ECCP 2026 Platform

**Equity College Counselling Program** — Digital mentorship platform for Rwanda scholars, mentors, and org admins.

## Quick Start

```bash
npm install
npm run dev          # Dev: frontend :5173, API :3001
npm run build && npm start   # Production: http://localhost:3001
```

Database seeds automatically with **67 scholars**, **6 mentors**, and **3 admins**.

## Login Credentials

| Role | Login | Default Password |
|------|-------|------------------|
| Admin | eccpmentor.regismukiza@gmail.com (or mbabazi.sylvia@equitybank.co.rw, JUDITH.MUTESI@equitybank.co.rw) | Equity@2026 |
| Mentor | mentor email (see seed) | Equity@2026 |
| Scholar | PF Number (e.g. 56647) | Cohort@2026 |

## Documentation

| File | Purpose |
|------|---------|
| [WHY.md](WHY.md) | Why digital platform over traditional mentorship |
| [HOSTING.md](HOSTING.md) | 24/7 production deployment guide |
| [docs/USER_GUIDE_MENTEE.md](docs/USER_GUIDE_MENTEE.md) | Step-by-step scholar guide |
| [docs/USER_GUIDE_MENTOR.md](docs/USER_GUIDE_MENTOR.md) | Mentor workflow guide |
| [docs/USER_GUIDE_ADMIN.md](docs/USER_GUIDE_ADMIN.md) | Org admin command center |

In-app guide: `/guide` (role-specific)

## Platform Features

### Scholars (Mentees)
- Daily session flow, timed quizzes, mandatory reflections
- Application status tracker (admitted / applying / target universities)
- Resource library by category (SAT, essays, financial aid, etc.)
- Program timeline, responsibilities checklist, daily motivation quotes
- Personal progress (rankings hidden — mentors/admin only)
- Messaging to mentor, SAT prep hub, Know Your Mentor

### Mentors
- **Attendance modal** — tap scholar names to mark present/absent
- Create sessions with presentation upload + Google Drive links
- Timed quizzes (5–60 min) with missed penalties
- Weekly report PDF (always downloadable, structured even if empty)
- Reset own mentees' passwords upon request
- Resource library management, scholar follow-up alerts

### Org Admin
- Full user management (add/remove scholars, assign mentors, reset passwords)
- Create/edit/delete sessions globally
- **Program timeline editor** (visible to all)
- **Platform history** — chronological audit + login security log
- Broadcast messages, email reminders (SMTP)
- Export rankings, profiles, compliance reports

## Security

- Login attempt tracking with lockout after 8 failures
- JWT authentication, role-based access control
- Email password reset (scholar email on file)
- All actions logged in platform history

## Logo

Place at `public/logo.png` (used on site and PDF reports).

## Production

Set environment variables:
- `JWT_SECRET` — strong random string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — for email
- `DB_PATH` — persistent disk path (e.g. `/data/eccp.db`)

See [HOSTING.md](HOSTING.md) for full deployment steps.

## Contact

eccpmentor.regismukiza@gmail.com
