-- scan-me · per-person public share token
-- Adds a rotatable secret that maps a public /p/<token> URL to a single person.
-- Server-side endpoints (with service_role) resolve the token to person + owner
-- and then write an invoice as if the owner had scanned it manually.
-- Idempotent.

alter table public.people
  add column if not exists share_token uuid not null default gen_random_uuid();

-- Backfill any pre-existing rows that may have ended up with NULL/duplicate
-- defaults from a prior partial migration. ADD COLUMN ... DEFAULT
-- gen_random_uuid() fills per-row in modern Postgres, but be explicit.
update public.people
   set share_token = gen_random_uuid()
 where share_token is null;

-- Unique index so a token resolves to exactly one person.
create unique index if not exists people_share_token_unique
  on public.people (share_token);

-- NOTE on RLS: we intentionally do NOT add a public/anon select policy here.
-- Unauthenticated visitors never read `people` directly from the client.
-- The /server/api/public/share/** routes use the service-role key to look up
-- the token, then perform a bounded set of writes on behalf of the owner.
