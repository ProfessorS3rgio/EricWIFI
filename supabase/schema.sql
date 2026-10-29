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

create index if not exists payments_client_month_idx
  on public.payments (client_id, billing_month);

alter table public.clients enable row level security;
alter table public.payments enable row level security;

-- This first version is private and intended for one operator.
-- Replace this policy with authenticated-user policies before exposing the app publicly.
drop policy if exists "owner can manage clients" on public.clients;
create policy "owner can manage clients"
  on public.clients
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "owner can manage payments" on public.payments;
create policy "owner can manage payments"
  on public.payments
  for all
  to anon
  using (true)
  with check (true);
