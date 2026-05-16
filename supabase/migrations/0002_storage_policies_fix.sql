-- Re-create storage policies with explicit role and modern syntax.
-- Safe to run multiple times (drops then recreates).
-- If you ran 0001 already, run this to upgrade the storage policies.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_insert_own" on storage.objects;
drop policy if exists "receipts_select_own" on storage.objects;
drop policy if exists "receipts_delete_own" on storage.objects;

create policy "receipts_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "receipts_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "receipts_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Sanity check (uncomment to inspect):
-- select policyname, cmd, roles from pg_policies
-- where schemaname = 'storage' and tablename = 'objects' and policyname like 'receipts%';
