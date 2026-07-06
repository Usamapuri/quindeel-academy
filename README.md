# Quindeel Academy — Website + LMS

Online Urdu classes by **Prof. Muhammad Zaheer Quindeel**. A single Next.js app with:

- **Public landing site** — bilingual (English ⇄ Urdu, full RTL), course "flashcards", fee structure, and a registration/booking form.
- **Inline editing** — while logged in as the teacher, click any heading, course name, description or fee **on the live page** to change it. Saving publishes instantly. (WordPress-but-simpler.)
- **Teacher admin** (`/admin`) — learners, registration inbox (approve → creates a learner login), fee records, live classes, recorded lectures, courses, and Google connection.
- **Student portal** (`/portal`) — each learner sees only their assigned courses, live-class Meet links, recordings, and fee records.

## Tech
Next.js 16 (App Router) · PostgreSQL + Prisma 6 · Tailwind v4 · custom JWT auth (`jose` + `bcryptjs`) · Google Calendar/Meet API · deploys to Railway.

## Local development

```bash
# 1. Start a local Postgres (Docker)
docker run --name quindeel-pg -e POSTGRES_PASSWORD=quindeel -e POSTGRES_USER=quindeel \
  -e POSTGRES_DB=quindeel -p 5433:5432 -d postgres:18

# 2. Configure env
cp .env.example .env      # then fill AUTH_SECRET etc. (defaults already point at the Docker DB)

# 3. Set up the database
npm install
npm run db:migrate        # create tables
npm run db:seed           # teacher + 8 courses + default site text

# 4. Run
npm run dev               # http://localhost:3000
```

Default teacher login comes from `.env` (`TEACHER_EMAIL` / `TEACHER_PASSWORD`). **Change the password after first login** (Admin → Learners has a reset, or re-seed with a new env value).

## How the teacher edits the website
1. Log in at `/login` with the teacher account.
2. Open the site (`/`). A yellow **Edit mode** bar appears.
3. Hover any text — it highlights. Click, type, click away. It's saved and live.
4. Use the **اردو / English** button to edit each language's version separately (Urdu wording included).

Structural changes (adding/removing courses, learners, classes, fees) are done in **`/admin`**.

## Deploying to Railway
1. Push this repo to GitHub and create a Railway project from it.
2. Add the **PostgreSQL** plugin (provides `DATABASE_URL`).
3. Set service variables (see `.env.example`): `AUTH_SECRET`, `TEACHER_NAME`, `TEACHER_EMAIL`, `TEACHER_PASSWORD`, `NEXT_PUBLIC_BASE_URL`, and — if using Google — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
4. `railway.json` already sets:
   - **build**: `npm run build` (`prisma generate && next build`)
   - **start**: `npm run start:prod` (`prisma migrate deploy && npm run db:seed && next start`)

   So migrations and the idempotent seed run automatically on every deploy — existing content/edits are never overwritten.

## Google Meet (optional)
Live classes work without Google — just paste a meeting link. To auto-create Meet links:
1. Create OAuth credentials in Google Cloud (scope `calendar.events`), redirect URI = `https://<your-domain>/api/google/callback`.
2. Set the three `GOOGLE_*` env vars.
3. In `/admin/google`, click **Connect Google account** once.

## Handy commands
| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Create/apply a migration (dev) |
| `npm run db:seed` | Seed teacher + courses + site text (idempotent) |
| `npm run db:studio` | Browse the database |
