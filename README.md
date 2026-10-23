# VerifyIT: A Digital Literacy Campaign Against Online Misinformation

An STS class project website built with React, Vite, Tailwind CSS v4, React Router, and Lucide icons, backed by a
Node.js + Express API and Supabase (Auth + PostgreSQL).

- **Guests** can use every lesson, quiz, Investigation Lab case, and the Verification Toolkit without an account.
  Guest progress is kept in the browser's localStorage and does not sync between devices.
- **Signed-in users** have their progress saved to their account, see it on any device, and can claim a
  verifiable **Certificate of Completion** (Media Literacy and Online Misinformation Awareness).

```
React (Vite)  ──HTTPS + Supabase access token──▶  Express API (/api/v1)  ──user JWT──▶  Supabase PostgreSQL (RLS)
      └──────────── sign up / sign in / password reset ────────────▶  Supabase Auth
```

The API verifies every token with Supabase Auth. Quiz scores, investigation correctness, certificate eligibility,
and certificate issuance are decided on the server (in SQL functions), never by the browser.

---

## 1. Requirements

- **Node.js 20.19 or newer** (tested with Node 24) and npm.
- A free **Supabase** project (only needed for accounts, saved progress, and certificates).

## 2. Install dependencies

```bash
npm install                 # frontend
npm run server:install      # backend (installs server/ dependencies)
```

## 3. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → API** and copy the **Project URL** and the **anon / publishable key**.
   Do **not** use the `service_role` / secret key anywhere in this project. The API refuses to start if it is given one.

## 4. Configure authentication

In the Supabase dashboard, open **Authentication**:

- **Sign In / Providers → Email**: keep Email enabled. "Confirm email" can stay on (users confirm by email before
  signing in) or be turned off for classroom testing.
- **URL Configuration**:
  - **Site URL**: your frontend URL (`http://localhost:5173` in development).
  - **Redirect URLs**: add `http://localhost:5173/account` and `http://localhost:5173/reset-password`,
    plus the same two paths on your production domain.
- Recommended: set the minimum password length to 8 to match the sign-up form.

Passwords are handled only by Supabase Auth. VerifyIT never stores passwords in its tables, localStorage, or logs.

## 5. Environment variables

Copy the templates and fill them in. Real `.env` files are ignored by Git.

**Frontend:** `.env.local` (from `.env.example`). Everything here ends up in the public website.

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL. Keep `/api/v1` in development (Vite forwards it to `http://localhost:4000`). In production use the full URL, e.g. `https://api.example.org/api/v1`. |
| `VITE_SUPABASE_URL` | Supabase Project URL. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key (public by design). |

**Backend:** `server/.env` (from `server/.env.example`)

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `4000`). |
| `NODE_ENV` | `development`, `test`, or `production`. |
| `FRONTEND_URL` | Origins allowed by CORS, comma-separated (e.g. `http://localhost:5173`). |
| `PUBLIC_APP_URL` | Public site URL printed on certificates and in their QR codes. Must be `https` (not localhost) in production. |
| `SUPABASE_URL` | Supabase Project URL. |
| `SUPABASE_ANON_KEY` | Supabase anon / publishable key. |
| `CERTIFICATE_TIMEZONE` | Optional. Time zone for the printed issue date (default `UTC`; the template uses `Asia/Manila`). |
| `TRUST_PROXY` | Optional. Number of reverse proxies in front of the API (usually `1` when hosted) so rate limits use real client IPs. |
| `LOG_LEVEL` | Optional. `debug`, `info`, `warn`, `error`, or `silent`. |

The API validates this configuration at startup and exits with a list of problems if anything is missing or unsafe.

## 6. Run the SQL migrations

The schema lives in `supabase/migrations/` and is meant for a **fresh** Supabase project:

| File | Purpose |
| --- | --- |
| `20261023000001_core_schema.sql` | Tables, constraints, indexes, triggers, Row Level Security, privileges, and the scoring / certificate functions. |
| `20261023000002_catalog_sync.sql` | Generated. Loads the trusted catalog: lesson and case ids, quiz answer keys, and expected investigation verdicts. |

Apply them **in order** using either option:

- **SQL Editor:** paste each file into Supabase → SQL Editor and run it, oldest first.
- **Supabase CLI:** `npx supabase link --project-ref <your-ref>` then `npx supabase db push`.

Do not run them against a production database that already holds data without a backup. They have only been
tested against a local Postgres (see Tests), not against your project.

**When lessons, cases, or quiz questions change:** edit the data files, then run `npm run catalog:seed`. It
writes a new `*_catalog_sync.sql` migration. Apply it the same way. Removed items are deactivated, never deleted.

## 7. Row Level Security (what the migrations set up)

- RLS is enabled on every user table: `profiles`, `lesson_progress`, `quiz_attempts`, `quiz_answer_results`,
  `investigation_attempts`, `toolkit_progress`, `certificates`. Each policy only allows the owner (`auth.uid()`).
- Users may write their own **lesson** and **toolkit** progress directly (validated by foreign keys to the catalog).
- **Quiz attempts, investigation attempts, and certificates are read-only for users.** They are written only by
  `SECURITY DEFINER` functions (`submit_quiz_attempt`, `submit_investigation_attempt`, `issue_certificate`) that
  score answers and check eligibility themselves, so nobody can insert a score or certificate with the public key.
- Answer keys and expected verdicts live in a `private` schema that the Data API does not expose.
- `verify_certificate` is the only function available to anonymous users. It returns printed fields only.

To **revoke** a certificate, run in the SQL Editor:
`update public.certificates set status = 'revoked', revoked_at = now() where certificate_number = 'VIT-XXXX-XXXX-XXXX-XXXX';`

## 8. Start the frontend

```bash
npm run dev          # http://localhost:5173
```

Without the Supabase variables the site still works in guest-only mode. The API must be running for quiz and
Investigation Lab feedback, because correct answers are kept on the server.

## 9. Start the backend

```bash
npm run server:dev   # API with auto-restart on http://localhost:4000
# or: npm run server:start
```

## 10. Check the API health

```bash
curl http://localhost:4000/api/v1/health      # {"data":{"status":"ok"}}
```

## 11. Test registration and login

1. Open `http://localhost:5173/register`, create an account, and confirm the email if confirmation is enabled.
2. Sign in at `/login`. The navigation shows your initial and a link to `/account`.
3. Change your display name on `/account`. Use `/forgot-password` to test the reset email.

## 12. Test database persistence

1. While signed in, finish a lesson's knowledge check, a quiz, an investigation, and tick a checklist item.
2. In Supabase → Table Editor, the rows appear in `lesson_progress`, `quiz_attempts`, `quiz_answer_results`,
   `investigation_attempts`, and `toolkit_progress`.
3. Sign in on another browser: `/results` shows the same progress.
4. Progress made as a guest can be saved to an account from the banner or the Account page. The server
   re-checks every item, and repeated imports never create duplicates.

## 13. Certificate eligibility and issuance

A user is eligible when **every learning module** is complete and **every Investigation Lab case** has at least one
saved submission (right or wrong). Quiz scores are not required. The required lists come from the catalog
(`src/data/lessons.js`, `src/data/investigations.js`), so new lessons or cases are included automatically after
the catalog migration is applied.

On `/certificate`, eligible users enter or confirm the name to print and click **Claim Certificate**. Issuing again
returns the same certificate; the database allows only one active certificate per user.

## 14. PDF download and public verification

- **Download PDF** on `/certificate` generates an A4 landscape certificate on the server (PDFKit) with the name,
  issue date, unique certificate number, verification URL, and a QR code.
- Anyone can check a certificate at `/verify-certificate/<number>` (or enter a number at `/verify-certificate`).
  Only the title, name, date, number, and status are shown.

## 15. Troubleshooting

| Problem | Fix |
| --- | --- |
| API exits with "Invalid server configuration" | Fill in `server/.env`; the message lists each missing or unsafe variable. |
| Browser console shows a CORS error | Add the exact frontend origin (scheme + host + port) to `FRONTEND_URL` and restart the API. |
| Quiz says "Your answer could not be checked" | The API is not reachable. Start it (`npm run server:dev`) or fix `VITE_API_URL`. |
| "Accounts are not available on this site yet" | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing. Restart `npm run dev` after editing `.env.local`. |
| Every account request returns 401 | Frontend and API point to different Supabase projects, or the session expired (sign in again). |
| `DATABASE_NOT_READY` (503), `UNKNOWN_REFERENCE`, or 403 errors | The migrations are not applied (or not in order). Run both migration files. |
| Log warning "certificate catalog mismatch" | Run `npm run catalog:seed` and apply the newest `*_catalog_sync.sql`. |
| Email links open the wrong site | Fix **Site URL** and **Redirect URLs** in Supabase Authentication settings. |
| Requests fail with `RATE_LIMITED` | Wait a moment. Behind a proxy, set `TRUST_PROXY` so students are not counted as one IP. |

---

## Tests

```bash
npm test             # backend: unit, API, and database tests (no Supabase project needed)
npm run test:e2e     # browser end-to-end tests (needs Microsoft Edge or Chrome installed)
npm run build        # frontend production build
```

- **Database tests** run the real migrations in an in-memory PostgreSQL (PGlite): RLS, privileges, scoring,
  eligibility, idempotent issuance, and public verification.
- **API tests** run the real Express app against that database, with token verification simulated.
- **Browser tests** drive the real frontend in Edge/Chrome against the API, with a test stand-in for Supabase Auth
  (`E2E_BROWSER_CHANNEL=chrome` to use Chrome).
- **Live tests** against a real Supabase project are optional and skipped unless configured:
  set `LIVE_SUPABASE_URL`, `LIVE_SUPABASE_ANON_KEY`, `LIVE_USER_A_EMAIL`, `LIVE_USER_A_PASSWORD`,
  `LIVE_USER_B_EMAIL`, `LIVE_USER_B_PASSWORD` (two test accounts), then run `npm run test:live --prefix server`.

## Where to edit content

| What | File |
| --- | --- |
| Lessons (content, examples, takeaways, knowledge checks) | `src/data/lessons.js` |
| Quiz categories (titles, difficulty, resources) | `src/data/quizCategories.js` |
| Quiz questions and options, one file per category | `src/data/quizzes/` |
| Quiz correct answers and explanations (server only) | `server/src/data/quizAnswerKeys.js` |
| Quiz illustrations (SVGs drawn for VerifyIT, labeled, not real photos) | `public/quiz-images/*.svg` |
| AI-Generated Image Detection quiz images (`hedgehog-*.jpg`, `identify-*.jpg`): real images from Wikimedia Commons, public domain / CC0. Which are AI-made, and each file's source, are listed in the credits in `server/src/data/quizAnswerKeys.js`. | `public/quiz-images/` |
| Investigation Lab case illustrations (SVGs drawn for VerifyIT) | `public/case-images/` |
| Investigation Lab cases (fictional) | `src/data/investigations.js` |
| Investigation expected verdicts and explanations (server only) | `server/src/data/investigationVerdicts.js` |
| Before You Share checklist | `src/data/checklist.js` |
| Team members and course details | `src/data/team.js` |
| References and verification tools | `src/data/references.js` |
| Colors and fonts (design tokens) | `@theme` block in `src/index.css` |

After changing ids, answers, or verdicts, run `npm run catalog:seed` and apply the new migration.

## Project structure

```
src/                 React frontend
  components/        Reusable UI (Navbar, Footer, Button, QuizEngine, CertificatePreview, SyncBanner, ...)
  context/           AuthContext (Supabase session) and ProgressContext (guest vs. account progress)
  lib/               api.js (API client), supabase.js, outbox.js (retry queue), guestSync.js (guest import)
  pages/             One file per page, including Login, Register, Account, Certificate, VerifyCertificate
  data/              Educational content shared with the server (no answer keys)
  hooks/ utils/      useLocalStorage, useProgress, useAuth; progress, quiz, and form helpers
server/              Express API
  src/config/        Environment validation, Supabase wiring
  src/middleware/    Authentication, validation, rate limits, error handling, request logging
  src/routes/        /api/v1 endpoints (controllers)
  src/services/      Business logic, dashboard aggregation, certificate PDF
  src/repositories/  Supabase data access (RLS-scoped queries and SQL function calls)
  src/data/          Server catalog and the server-only answer keys
  tests/             db/, api/, unit/, e2e/, live/
supabase/migrations/ SQL schema, RLS policies, functions, and catalog sync
```

## API overview (`/api/v1`)

Public: `GET /health`, `GET /lessons`, `GET /quizzes/categories`, `GET /quizzes/:category/questions`,
`POST /quizzes/:category/check`, `GET /investigations/cases`, `POST /investigations/:caseId/check`,
`GET /certificates/verify/:certificateNumber`.

Signed in (`Authorization: Bearer <Supabase access token>`): `GET|PATCH /me`, `GET /lessons/progress`,
`PUT /lessons/progress/:lessonId`, `POST /quizzes/:category/attempts`, `GET /quizzes/attempts`,
`GET /quizzes/attempts/:attemptId`, `GET /investigations/progress`, `POST /investigations/:caseId/attempts`,
`GET /investigations/attempts`, `GET|PUT /toolkit/progress`, `GET /dashboard`, `GET /certificates/eligibility`,
`POST /certificates/issue`, `GET /certificates/my`, `GET /certificates/:id/pdf`.

Responses use `{ "data": ... }` on success and `{ "error": { "code", "message", "requestId", "details?" } }` on failure.

## Before presenting

- Replace the placeholder team members and course details in `src/data/team.js`.
- Check every entry in `src/data/references.js`, then set `verified: true`.
- Fill in the placeholder paragraphs on the About page (`src/pages/About.jsx`).
- Do not add statistics unless you cite a verified source.

## Deployment notes

- **Frontend:** the site uses browser routing (`/learn`, `/certificate`, `/verify-certificate/...`). On a static
  host, serve `index.html` for all routes (for example, a Netlify `_redirects` file containing
  `/* /index.html 200`, or the equivalent rewrite on Vercel). Set the `VITE_` variables at build time.
- **API:** deploy the repository (the server reads the shared content in `src/data/`), run
  `npm run server:install`, and start it with `npm run server:start`. Set `NODE_ENV=production`, an https
  `PUBLIC_APP_URL`, your production origin in `FRONTEND_URL`, and `TRUST_PROXY=1` behind a proxy.
- Nothing is deployed automatically, and the migrations must be applied to your Supabase project by you.
