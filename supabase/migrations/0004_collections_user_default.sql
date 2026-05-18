-- scan-me · let Postgres set collections.user_id from the JWT
-- so the RLS WITH CHECK (auth.uid() = user_id) can never fail
-- due to a mismatched client-supplied value.
-- Safe to re-run: ALTER COLUMN ... SET DEFAULT is idempotent.

alter table public.collections
  alter column user_id set default auth.uid();
