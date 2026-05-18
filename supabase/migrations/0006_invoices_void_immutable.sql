-- scan-me · make voided_at immutable once set
-- A voided invoice can never be reactivated, even via a direct UPDATE.
-- If the user wants the amount back in their totals, they must re-upload.
-- Safe to re-run.

create or replace function public.tg_invoices_void_is_permanent()
returns trigger
language plpgsql
as $$
begin
  if old.voided_at is not null
     and new.voided_at is distinct from old.voided_at then
    raise exception 'voided_at is immutable: a voided invoice cannot be reactivated or re-voided'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoices_void_permanent on public.invoices;
create trigger trg_invoices_void_permanent
  before update of voided_at on public.invoices
  for each row execute function public.tg_invoices_void_is_permanent();
