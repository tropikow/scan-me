-- scan-me · people directory
-- Stores the people the user wants to track alongside their invoices.
-- Idempotent.

create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name        text not null,
  role        text not null default 'Other',
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint people_name_nonblank check (length(trim(name)) > 0),
  constraint people_role_nonblank check (length(trim(role)) > 0),
  constraint people_name_length   check (length(name) <= 120),
  constraint people_role_length   check (length(role) <= 40)
);

create index if not exists people_user_created_idx
  on public.people (user_id, created_at desc);

-- reuse public.tg_set_updated_at() from 0001
drop trigger if exists trg_people_updated_at on public.people;
create trigger trg_people_updated_at
  before update on public.people
  for each row execute function public.tg_set_updated_at();

-- RLS
alter table public.people enable row level security;

drop policy if exists "people_select_own" on public.people;
create policy "people_select_own"
  on public.people for select
  using (auth.uid() = user_id);

drop policy if exists "people_insert_own" on public.people;
create policy "people_insert_own"
  on public.people for insert
  with check (auth.uid() = user_id);

drop policy if exists "people_update_own" on public.people;
create policy "people_update_own"
  on public.people for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "people_delete_own" on public.people;
create policy "people_delete_own"
  on public.people for delete
  using (auth.uid() = user_id);
