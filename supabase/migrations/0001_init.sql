create extension if not exists "pgcrypto";

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operator', 'viewer')),
  full_name text,
  created_at timestamptz default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  awb text unique not null,
  customer_name text not null,
  phone text,
  address text,
  pincode text,
  courier text,
  shipment_date date,
  expected_delivery date,
  cod_amount numeric,
  current_status text,
  remarks text,
  last_updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists shipment_updates (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete cascade not null,
  status text not null,
  remark text,
  location text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists shipments_awb_idx on shipments(awb);
create index if not exists shipment_updates_shipment_id_created_at_idx on shipment_updates(shipment_id, created_at desc);

alter table profiles enable row level security;
alter table shipments enable row level security;
alter table shipment_updates enable row level security;

create policy "Profiles are viewable by owners" on profiles
  for select
  using (auth.uid() = user_id);

create policy "Admins can view all profiles" on profiles
  for select
  using (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Profiles can be inserted by owner" on profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Admins can update profiles" on profiles
  for update
  using (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Shipments are readable by authenticated users" on shipments
  for select
  using (auth.role() = 'authenticated');

create policy "Operators and admins can insert shipments" on shipments
  for insert
  with check (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role in ('admin', 'operator'))
  );

create policy "Operators and admins can update shipments" on shipments
  for update
  using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role in ('admin', 'operator'))
  );

create policy "Admins can delete shipments" on shipments
  for delete
  using (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Shipment updates are readable by authenticated users" on shipment_updates
  for select
  using (auth.role() = 'authenticated');

create policy "Operators and admins can insert shipment updates" on shipment_updates
  for insert
  with check (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role in ('admin', 'operator'))
  );

create policy "Admins can delete shipment updates" on shipment_updates
  for delete
  using (exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create or replace function update_shipment_on_timeline()
returns trigger as $$
begin
  update shipments
  set current_status = new.status,
      last_updated_at = now()
  where id = new.shipment_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger shipment_updates_after_insert
after insert on shipment_updates
for each row execute function update_shipment_on_timeline();
