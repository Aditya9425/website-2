-- Shagun Saree - Order Management Supabase Setup
-- Run this script in Supabase SQL Editor (once). It creates the RPC, schema, RLS, and realtime config.

-- 1) Ensure required columns on products
alter table if exists public.products
  add column if not exists stock integer default 0,
  add column if not exists status text default 'active';

-- 2) Atomic stock deduction RPC (preferred path used by frontend)
create or replace function public.deduct_stock(product_id int, quantity_to_deduct int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock int;
begin
  -- Lock the row to prevent race conditions
  select stock into current_stock
  from products
  where id = product_id
  for update;

  if current_stock is null then
    return false;
  end if;

  if current_stock < quantity_to_deduct then
    return false;
  end if;

  update products
  set stock = stock - quantity_to_deduct,
      status = case when (stock - quantity_to_deduct) = 0 then 'out-of-stock' else status end
  where id = product_id;

  return true;
end;
$$;

grant execute on function public.deduct_stock(int, int) to anon, authenticated;

-- 3) Products RLS: readable by everyone; block direct updates from anon/auth (updates come via RPC)
alter table public.products enable row level security;

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "No direct product updates from anon" on public.products;
create policy "No direct product updates from anon"
on public.products for update
to anon, authenticated
using (false)
with check (false);

-- 4) Orders table (schema used by frontend)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  items jsonb not null,
  total_amount numeric not null,
  shipping_addr jsonb not null,
  status text not null default 'pending',
  payment_method text,
  payment_id text,
  created_at timestamp with time zone default now()
);

-- 5) Orders RLS: allow inserts/selects for site (tighten later if needed)
alter table public.orders enable row level security;

drop policy if exists "Orders insert allowed for site" on public.orders;
create policy "Orders insert allowed for site"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Orders readable for site" on public.orders;
create policy "Orders readable for site"
on public.orders for select
to anon, authenticated
using (true);

-- 6) Realtime: ensure products and orders are in realtime publication
-- If your project manages publications automatically, you can skip these.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.products';
  exception when others then null; -- ignore if already added
  end;
  begin
    execute 'alter publication supabase_realtime add table public.orders';
  exception when others then null;
  end;
end $$;

-- Done.
-- After running: test placing an order; stock should decrement and status switch to out-of-stock at zero.

