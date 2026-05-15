-- scan-me · initial schema for invoices + line items + receipt storage
-- Run this in Supabase SQL editor (or via supabase CLI: `supabase db push`).
-- Idempotent where possible: safe to re-run.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  vendor          text,
  vendor_address  text,
  invoice_number  text,
  invoice_date    date,
  currency        text,
  subtotal        numeric(12,2),
  tax             numeric(12,2),
  tax_rate        numeric(5,4),
  total           numeric(12,2),
  confidence      numeric(3,2),
  image_path      text,
  notes           text,
  tags            text[] default '{}'::text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists invoices_user_created_idx
  on public.invoices (user_id, created_at desc);

create table if not exists public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  position     smallint not null,
  description  text not null,
  quantity     numeric(12,3),
  unit_price   numeric(12,2),
  amount       numeric(12,2) not null
);

create index if not exists invoice_items_invoice_idx
  on public.invoice_items (invoice_id, position);

-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
  on public.invoices for select
  using (auth.uid() = user_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own"
  on public.invoices for insert
  with check (auth.uid() = user_id);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own"
  on public.invoices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own"
  on public.invoices for delete
  using (auth.uid() = user_id);

drop policy if exists "invoice_items_select_own" on public.invoice_items;
create policy "invoice_items_select_own"
  on public.invoice_items for select
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
  ));

drop policy if exists "invoice_items_insert_own" on public.invoice_items;
create policy "invoice_items_insert_own"
  on public.invoice_items for insert
  with check (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
  ));

drop policy if exists "invoice_items_update_own" on public.invoice_items;
create policy "invoice_items_update_own"
  on public.invoice_items for update
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
  ));

drop policy if exists "invoice_items_delete_own" on public.invoice_items;
create policy "invoice_items_delete_own"
  on public.invoice_items for delete
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
  ));

-- ============================================================
-- STORAGE: private bucket for receipt images
-- Object path convention: {user_id}/{invoice_id}.{ext}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
