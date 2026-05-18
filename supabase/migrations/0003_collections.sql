-- scan-me · collections (hierarchical taxonomy for invoices)
-- Run after 0001_init_invoices.sql.
-- Idempotent where possible.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_id   uuid references public.collections(id) on delete cascade,
  name        text not null,
  slug        text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint collections_name_nonblank   check (length(trim(name)) > 0),
  constraint collections_slug_format     check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'),
  constraint collections_parent_not_self check (parent_id is null or parent_id <> id)
);

-- uniqueness: a slug is unique among siblings of the same parent (per user)
create unique index if not exists collections_unique_sibling_slug
  on public.collections (user_id, parent_id, slug)
  where parent_id is not null;

create unique index if not exists collections_unique_root_slug
  on public.collections (user_id, slug)
  where parent_id is null;

create index if not exists collections_user_parent_idx
  on public.collections (user_id, parent_id, position, name);

-- Many-to-many between invoices and collections
create table if not exists public.invoice_collections (
  invoice_id    uuid not null references public.invoices(id)    on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (invoice_id, collection_id)
);

create index if not exists invoice_collections_collection_idx
  on public.invoice_collections (collection_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- prevent cycles in parent_id chains
create or replace function public.tg_collections_no_cycle()
returns trigger
language plpgsql
as $$
declare
  ancestor uuid := new.parent_id;
  steps    int  := 0;
begin
  while ancestor is not null loop
    if ancestor = new.id then
      raise exception 'Collection cycle detected (parent_id points to a descendant)';
    end if;
    steps := steps + 1;
    if steps > 50 then
      raise exception 'Collection hierarchy too deep (limit 50)';
    end if;
    select parent_id into ancestor from public.collections where id = ancestor;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_collections_no_cycle on public.collections;
create trigger trg_collections_no_cycle
  before insert or update of parent_id on public.collections
  for each row execute function public.tg_collections_no_cycle();

-- reuse public.tg_set_updated_at() defined in 0001
drop trigger if exists trg_collections_updated_at on public.collections;
create trigger trg_collections_updated_at
  before update on public.collections
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.collections         enable row level security;
alter table public.invoice_collections enable row level security;

drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own"
  on public.collections for select
  using (auth.uid() = user_id);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own"
  on public.collections for insert
  with check (auth.uid() = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own"
  on public.collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own"
  on public.collections for delete
  using (auth.uid() = user_id);

-- invoice_collections: principal must own both sides of the link
drop policy if exists "invoice_collections_select_own" on public.invoice_collections;
create policy "invoice_collections_select_own"
  on public.invoice_collections for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_collections.invoice_id
        and i.user_id = auth.uid()
    )
  );

drop policy if exists "invoice_collections_insert_own" on public.invoice_collections;
create policy "invoice_collections_insert_own"
  on public.invoice_collections for insert
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_collections.invoice_id
        and i.user_id = auth.uid()
    )
    and exists (
      select 1 from public.collections c
      where c.id = invoice_collections.collection_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "invoice_collections_delete_own" on public.invoice_collections;
create policy "invoice_collections_delete_own"
  on public.invoice_collections for delete
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_collections.invoice_id
        and i.user_id = auth.uid()
    )
  );

-- ============================================================
-- STATS VIEW — invoice count + total per collection
-- security_invoker enforces RLS via the querying user, not the view owner
-- ============================================================

drop view if exists public.v_collection_stats;
create view public.v_collection_stats
with (security_invoker = true)
as
select
  c.id                                as collection_id,
  c.user_id                           as user_id,
  count(ic.invoice_id)::int           as invoice_count,
  coalesce(sum(i.total), 0)::numeric  as total_amount
from public.collections c
left join public.invoice_collections ic on ic.collection_id = c.id
left join public.invoices i             on i.id = ic.invoice_id
group by c.id, c.user_id;

grant select on public.v_collection_stats to authenticated;
