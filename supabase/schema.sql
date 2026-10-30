begin;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  plan text not null,
  monthly_fee numeric(10, 2) not null check (monthly_fee >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'overdue')),
  due_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  billing_month date not null,
  amount numeric(10, 2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method text not null default 'cash' check (method in ('cash', 'gcash', 'bank', 'other')),
  reference text,
  notes text
);

alter table public.payments add column if not exists voided_at timestamptz;
alter table public.payments add column if not exists voided_reason text;

create index if not exists payments_client_month_idx
  on public.payments (client_id, billing_month);

alter table public.clients enable row level security;
alter table public.payments enable row level security;

-- All application reads and writes now run through the server.
drop policy if exists "owner can manage clients" on public.clients;
drop policy if exists "owner can manage payments" on public.payments;
revoke all on public.clients, public.payments from anon, authenticated;

alter table public.clients add column if not exists portal_token uuid not null default gen_random_uuid();
create unique index if not exists clients_portal_token_idx on public.clients(portal_token);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  billing_month date not null check (extract(day from billing_month) = 1),
  amount numeric(10,2) not null check (amount >= 0),
  plan text not null,
  due_date date,
  created_at timestamptz not null default now(),
  unique (client_id, billing_month)
);
alter table public.bills enable row level security;
revoke all on public.bills from anon, authenticated;
grant all on public.clients, public.payments, public.bills to service_role;

-- Snapshot on the first admin billing load each month. Repeated loads do not
-- change existing fees, plans, or due dates. No historical amounts are invented.
create or replace function public.ensure_current_bills() returns void
language plpgsql security invoker set search_path = public as $$
declare
  cycle date := date_trunc('month', now() at time zone 'Asia/Manila')::date;
begin
  insert into public.bills(client_id, billing_month, amount, plan, due_date)
  select id, cycle, monthly_fee, plan,
    case when due_date is null then null else
      cycle + (least(extract(day from due_date)::int,
        extract(day from (cycle + interval '1 month - 1 day'))::int) - 1)
    end
  from public.clients
  where status <> 'inactive'
    and created_at < (cycle + interval '1 month') at time zone 'Asia/Manila'
  on conflict (client_id, billing_month) do nothing;
end;
$$;
revoke all on function public.ensure_current_bills() from public, anon, authenticated;
grant execute on function public.ensure_current_bills() to service_role;

-- A retry token prevents duplicate submissions; a bill lock serializes payments
-- so simultaneous requests cannot both collect the same outstanding balance.
alter table public.payments add column if not exists request_id uuid;
create unique index if not exists payments_request_id_idx on public.payments(request_id);
create or replace function public.record_payment(
  p_bill_id uuid, p_amount numeric, p_method text, p_reference text, p_request_id uuid
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  bill public.bills%rowtype;
  collected numeric;
  payment_id uuid;
  existing public.payments%rowtype;
begin
  select * into bill from public.bills where id = p_bill_id for update;
  if not found then raise exception 'Bill not found.'; end if;
  select * into existing from public.payments where request_id = p_request_id;
  if found then
    if existing.client_id <> bill.client_id or existing.billing_month <> bill.billing_month
      or existing.amount <> p_amount or existing.method <> p_method
      or existing.reference is distinct from nullif(trim(p_reference), '') then
      raise exception 'This request has already been used for another payment.';
    end if;
    return existing.id;
  end if;
  if p_request_id is null or p_amount is null or p_amount <= 0
     or p_amount <> round(p_amount, 2) or p_method is null
     or p_method not in ('cash','gcash','bank','other') then
    raise exception 'Enter a valid amount and payment method.';
  end if;
  select coalesce(sum(amount),0) into collected from public.payments
    where client_id = bill.client_id and billing_month = bill.billing_month and voided_at is null;
  if p_amount > bill.amount - collected then raise exception 'Payment exceeds the current balance. Refresh and try again.'; end if;
  insert into public.payments(client_id,billing_month,amount,method,reference,request_id)
    values(bill.client_id,bill.billing_month,p_amount,p_method,nullif(trim(p_reference),''),p_request_id)
    returning id into payment_id;
  return payment_id;
end;
$$;
revoke all on function public.record_payment(uuid,numeric,text,text,uuid) from public, anon, authenticated;
grant execute on function public.record_payment(uuid,numeric,text,text,uuid) to service_role;

-- Durable single-operator MPIN throttle shared by all app instances.
create table if not exists public.admin_login_guard (
  id boolean primary key default true check (id),
  failures integer not null default 0,
  window_start timestamptz not null default now(),
  blocked_until timestamptz
);
alter table public.admin_login_guard enable row level security;
revoke all on public.admin_login_guard from anon, authenticated;
grant all on public.admin_login_guard to service_role;
insert into public.admin_login_guard(id) values(true) on conflict do nothing;
create or replace function public.check_login_attempt(p_success boolean) returns boolean
language plpgsql security invoker set search_path = public as $$
declare guard public.admin_login_guard%rowtype;
begin
  select * into guard from public.admin_login_guard where id = true for update;
  if guard.blocked_until > now() then return false; end if;
  if p_success then
    update public.admin_login_guard set failures=0,window_start=now(),blocked_until=null where id=true;
    return true;
  end if;
  if guard.window_start < now() - interval '15 minutes' then
    guard.failures := 0;
  end if;
  update public.admin_login_guard set
    failures=guard.failures+1,
    window_start=case when guard.failures=0 then now() else guard.window_start end,
    blocked_until=case when guard.failures+1 >= 10 then now()+interval '15 minutes' else null end
    where id=true;
  return false;
end;
$$;
revoke all on function public.check_login_attempt(boolean) from public, anon, authenticated;
grant execute on function public.check_login_attempt(boolean) to service_role;

-- Publish the initial current-cycle snapshots for the public bill board.
select public.ensure_current_bills();

commit;
