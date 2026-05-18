-- scan-me · link invoices to a tracked person
-- Optional one-to-many relationship: an invoice may belong to a single person.
-- ON DELETE SET NULL so removing a person does not destroy their invoices.
-- Safe to re-run.

alter table public.invoices
  add column if not exists person_id uuid
  references public.people(id) on delete set null;

create index if not exists invoices_person_idx
  on public.invoices (person_id)
  where person_id is not null;
