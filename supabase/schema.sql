-- accountplug schema (Supabase / Postgres). The demo app stores this shape in localStorage.
-- Run in the Supabase SQL editor when you are ready to move off localStorage.

create table if not exists public.listings (
  id           text primary key,
  slug         text unique not null,
  category     text not null check (category in ('gaming', 'social', 'giftcards')),
  title        text not null,
  brand        text,
  price_ngn    integer not null check (price_ngn >= 0),
  stock        integer not null default 1 check (stock >= 0),
  status       text not null default 'active' check (status in ('active', 'sold', 'hidden')),
  featured     boolean not null default false,
  cover        text default '🛒',
  description  text,
  specs        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.orders (
  id           text primary key,              -- order reference, e.g. APO-ABC12XYZ
  customer_name  text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_note  text,
  payment_method text not null default 'transfer',
  total_ngn    integer not null check (total_ngn >= 0),
  status       text not null default 'awaiting_transfer'
               check (status in ('awaiting_transfer', 'paid', 'delivered', 'cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.order_items (
  id           bigint generated always as identity primary key,
  order_id     text not null references public.orders(id) on delete cascade,
  listing_id   text not null references public.listings(id),
  title        text not null,
  category     text not null,
  qty          integer not null check (qty > 0),
  unit_ngn     integer not null check (unit_ngn >= 0)
);

-- Owner-only writes. Public can read active listings only.
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "public read active listings" on public.listings
  for select using (status <> 'hidden');

-- Orders: the anon key may insert a new order (checkout) but may not read or edit others.
create policy "anon can place orders" on public.orders
  for insert with check (true);
create policy "anon can add order items" on public.order_items
  for insert with check (true);

-- Owner (authenticated via Supabase Auth, email in owner list) manages everything.
-- Replace 'owner@yourdomain.com' with your admin login email.
create policy "owner manages listings" on public.listings
  for all using (auth.jwt() ->> 'email' = 'owner@yourdomain.com')
  with check (auth.jwt() ->> 'email' = 'owner@yourdomain.com');

create policy "owner reads orders" on public.orders
  for select using (auth.jwt() ->> 'email' = 'owner@yourdomain.com');
create policy "owner updates orders" on public.orders
  for update using (auth.jwt() ->> 'email' = 'owner@yourdomain.com');
create policy "owner reads order items" on public.order_items
  for select using (auth.jwt() ->> 'email' = 'owner@yourdomain.com');
