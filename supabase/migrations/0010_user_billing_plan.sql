-- scan-me · user billing plan (beta-phase scaffolding)
-- Minimal per-user profile recording the current plan, when it was
-- assigned, and (optionally) when it expires.
--
-- Payment history, subscription state, billing cycles and processor IDs
-- are intentionally NOT modeled here: the payment processor
-- (Stripe / PayPal / etc.) will be the source of truth once we charge.
-- This migration only carves out the slot where a user's plan lives so
-- the rest of the app can already branch on it.
--
-- Idempotent.

create table if not exists public.profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  plan             text not null default 'beta',
  plan_since       timestamptz not null default now(),
  plan_expires_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profiles_plan_allowed check (plan in ('beta','free','pro'))
);

-- reuse public.tg_set_updated_at() from 0001
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Auto-create a profile for every new auth.users signup. Defaults to
-- the beta plan with no expiry so early adopters land on the free seat
-- promised on the landing page.
create or replace function public.tg_create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, plan, plan_since, plan_expires_at)
  values (new.id, 'beta', now(), null)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_create_profile on auth.users;
create trigger trg_auth_user_create_profile
  after insert on auth.users
  for each row execute function public.tg_create_profile_for_new_user();

-- Backfill existing users so everyone already signed up lands on beta.
insert into public.profiles (user_id, plan, plan_since, plan_expires_at)
select id, 'beta', now(), null
  from auth.users
on conflict (user_id) do nothing;

-- RLS
alter table public.profiles enable row level security;

-- Users can read their own profile (to render plan in UI).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

-- NOTE: no insert/update/delete policies for authenticated users on
-- purpose. Plan transitions must go through server routes using the
-- service role, so a client cannot self-promote to a paid plan.
