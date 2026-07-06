@AGENTS.md

# Quindeel Academy — project notes

Landing page + LMS for an online Urdu academy (Prof. Muhammad Zaheer Quindeel). Built to be
**dead simple for a non-technical 60+ teacher to run and edit**.

## Stack
- Next.js 16 App Router (TypeScript), Tailwind v4, PostgreSQL + Prisma 6.
- Custom auth: `jose` JWT in an httpOnly cookie (`lib/jwt.ts` edge-safe, `lib/auth.ts` Node). Gating in `proxy.ts`.
- Mutations are **Server Actions** in `app/actions/*` — there is no REST API layer.
- Local DB is Docker Postgres on port **5433**; prod is Railway.

## Key concepts
- **Inline editing** is the core UX. `components/Editable.tsx` renders `contentEditable` for a logged-in
  TEACHER and plain text for everyone else. It saves via `app/actions/content.ts` → `saveContent(field, value)`.
  `field` is either `setting:<key>` (→ `SiteSetting`) or `course:<id>:<column>` (whitelisted columns only).
  Saving calls `revalidatePath("/", "layout")`, so edits publish immediately.
- **Bilingual**: `lib/i18n.ts` (UI strings + `pick()` + `dir()`), `lib/lang.ts` reads the `qa_lang` cookie,
  `components/LangProvider.tsx` + `LangToggle` flip it. Urdu → `dir="rtl"` + Noto Nastaliq Urdu font.
  Content has `*En` / `*Ur` variants; the shown/edited one depends on the current language.
- **Roles**: `TEACHER` (one, seeded) and `STUDENT`. Teacher creates learners (Admin → Learners) or approves
  registration requests (Admin → Registrations, which creates the login + enrollment).
- **Gating**: content (recordings, live links) is filtered by `Enrollment` — a learner only sees courses
  they're enrolled in. `proxy.ts` protects `/admin` (TEACHER) and `/portal` (STUDENT).
- **Google Meet**: `lib/google.ts`. If connected, scheduling a live class auto-creates a Meet link;
  otherwise the teacher pastes a link (fallback always works).

## Seeding
`prisma/seed.ts` is **idempotent** (create-if-missing, never overwrite) so redeploys never clobber the
teacher's inline edits. It seeds the teacher (from `TEACHER_*` env), 8 courses, and ~34 site settings.

## Routes
- `app/(public)/*` — landing, courses, fees, register, login (shared header/footer via the group layout).
- `app/admin/*` — teacher panel (own layout, English UI, forced Latin font).
- `app/portal/*` — student portal (own layout, bilingual).

## Gotchas
- Prisma 7 dropped `url` in schema (needs driver adapters); this project pins **Prisma 6** on purpose.
- Use `proxy.ts` (not `middleware.ts`) — Next 16 renamed the convention.
- The project dir has spaces; `create-next-app .` rejects it — scaffold elsewhere and move if re-scaffolding.
