-- scan-me · soft-cancel ("void") invoices
-- A voided invoice is preserved in the table but excluded from spend totals.
-- It still counts toward "how many invoices does the user have?".
-- Safe to re-run.

alter table public.invoices
  add column if not exists voided_at timestamptz;

-- Speed up the common "active (non-voided) for this user, newest first" query
-- used by dashboard spend aggregations.
create index if not exists invoices_active_user_created_idx
  on public.invoices (user_id, created_at desc)
  where voided_at is null;
