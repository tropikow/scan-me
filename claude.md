# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@.claude/security.md
@.claude/design.md

## Commands

Package manager: **pnpm** (lockfile committed). Node scripts via Nuxt 4.

- `pnpm dev` — start the Nuxt dev server (Nitro + Vite).
- `pnpm build` — production build (`.output/`).
- `pnpm preview` — serve the production build locally.
- `pnpm generate` — static prerender (not the primary deploy target; SSR routes use Nitro).
- `pnpm install` runs `nuxt prepare` (postinstall) to regenerate `.nuxt/` types — re-run after changing `nuxt.config.ts` or adding modules so TS types resolve.

There is no test runner, linter, or formatter wired up in `package.json`. Don't invent commands for them; if quality gates are needed, add them deliberately.

## Required env (`.env`, see `.env.example`)

- `SUPABASE_URL`, `SUPABASE_KEY` — anon key, public, used by `@nuxtjs/supabase`.
- `GROQ_API_KEY` — server-side only (`runtimeConfig.groqApiKey`), used for OCR.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only (`runtimeConfig.supabaseServiceRoleKey`). **Only** consumed by `server/api/public/share/**` routes to write on behalf of the share-link owner when the visitor is anonymous. Never expose to the client and never use it from any other handler without an equivalent justification.

## Architecture

Nuxt 4 app (file-based routing under `app/`) backed by Supabase (Postgres + Auth + Storage) with Groq vision models doing the OCR. Two distinct entry surfaces share the database:

1. **Authenticated app** — `/app/**` routes, guarded by `@nuxtjs/supabase` (`redirectOptions.include: ['/app/**']`, login at `/signin`, callback `/confirm`). Uses the user's JWT and is fully constrained by RLS.
2. **Public share** — `/p/[token]` page + `/api/public/share/[token]/**` server endpoints. An unauthenticated visitor scans a receipt that gets persisted **as the share-link owner**. Server routes resolve the UUID `share_token` to a `person` via the service-role key (RLS would block them otherwise).

### Routing & layouts

- `app/layouts/default.vue` — marketing/auth chrome.
- `app/layouts/landing.vue` — landing page.
- `app/layouts/app.vue` — the authenticated shell (sidebar + topbar + mobile drawer). Pages under `app/pages/app/**` consume it.
- Auth pages (`signin.vue`, `signup.vue`, `confirm.vue`) are thin wrappers over `app/components/AuthView.vue`.

### Server API (`server/api/`)

- `POST /api/scan` — authenticated. Multipart `file` → Groq vision (`meta-llama/llama-4-scout-17b-16e-instruct`) → returns the parsed JSON. Pure OCR, does not write.
- `POST /api/invoices` — authenticated. Multipart `file` + JSON `payload`. Uploads the image to the `receipts` Storage bucket at `{user_id}/{invoice_id}.{ext}`, then inserts the invoice row + line items. Rolls back the storage object on insert failure.
- `GET  /api/public/share/[token]` — public. Resolves token → `{ person, collections }` for the owner.
- `POST /api/public/share/[token]/scan` — public. Token-gated OCR.
- `POST /api/public/share/[token]/invoice` — public. Token-gated invoice write on the owner's behalf.

### Database (`supabase/migrations/`, ordered)

Apply via `supabase db push` or paste into the SQL editor. Migrations are idempotent — `if not exists`, `drop policy if exists`, etc. Add new ones as `NNNN_short_name.sql`, never edit a shipped one.

Core tables (all RLS-enabled, owner-only policies via `auth.uid() = user_id`):
- `invoices` + `invoice_items` (0001) — the scan output. `image_path` references the `receipts` private storage bucket.
- `collections` + `invoice_collections` (0003/0004) — user-defined hierarchical taxonomy with cycle-prevention trigger. View `v_collection_stats` is `security_invoker = true`.
- `invoices.voided_at` (0005/0006) — soft-delete with an immutability trigger; once voided, the row can't be mutated.
- `people` (0007) + `invoices.person_id` (0008) — track who a receipt belongs to. `user_id` defaults to `auth.uid()` so clients can omit it.
- `people.share_token` UUID (0009) — drives the `/p/[token]` flow. No public select policy; only service-role endpoints read it.
- `profiles` (0010) — `plan` (`beta` | `free` | `pro`) auto-created via `auth.users` insert trigger. **No client write policy** — plan transitions go through service-role server routes.

### Storage

- Bucket `receipts` is private. Object path convention: `{user_id}/{invoice_id}.{ext}`. RLS policies on `storage.objects` enforce that the first folder segment equals `auth.uid()`.
- The SSR Supabase client does **not** reliably forward the user's JWT to Storage calls. When uploading from a server route, build a dedicated `createClient(url, anon, { global: { headers: { Authorization: 'Bearer ' + access_token } } })` — see `server/api/invoices/index.post.ts:138`.

### Supabase server quirks (Nuxt module v2.0.x)

- `serverSupabaseUser(event)` returns JWT **claims**, not a `User` object. The user ID is `claims.sub`, not `claims.id`. Example: `server/api/invoices/index.post.ts:92`.
- For inserts owned by the current user, prefer letting Postgres fill `user_id` via a column `default auth.uid()` (see `people`) — this avoids `42501` permission errors caused by mismatched client-side IDs under RLS.

### Design tokens

`app/assets/css/main.css` exposes two layers of CSS variables on `:root`:
- **App tokens** (`--bg-base`, `--fg-primary`, `--accent-action`, the responsive `--font-*` clamps, `--radius-sm|md|lg`, `--transition`) — these are the ones enforced by `.claude/design.md`. Use them in the authenticated app.
- **Hi-fi landing tokens** (`--ink`, `--surface-2`, `--line`, `--accent`, `--pad`, `--max`, `--radius`, `--hairline`) — scoped to the marketing/landing surface only. Do not mix the two systems inside a single component.

Shared atom classes (e.g. `.btn-hifi`) live alongside the tokens — extend rather than re-defining.
