-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- USERS / PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null check (role in ('admin','planner1','inventory','logistics','sales')),
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
create table public.orders (
  id                        uuid primary key default uuid_generate_v4(),
  -- Identity
  bu                        text,
  site                      text,
  uai_air                   text,
  customer                  text,
  po_date_received          date,
  cpo                       text,
  alliance_po               text,
  po_item                   text,
  prs                       text,
  qty                       numeric,
  order_status              text,
  type                      text,
  part_number               text,
  description               text,
  dn                        text,
  rev                       text,
  consumption_status        text,
  part_set_a                text,
  crdd                      text,
  po_rdd                    date,
  cpo_rdd                   date,
  rdd                       date,
  -- Pricing
  alliance_unit_price       numeric,
  total_alliance_price      numeric,
  customer_unit_price       numeric,
  total_customer_price      numeric,
  -- Assembly
  assy_po_revision          text,
  assembly_po               text,
  po_month_year             text,
  quotation_no              text,
  pin_count                 numeric,
  unit_price                numeric,
  total_cost                numeric,
  total_pins                numeric,
  assembly_invoice_no       text,
  pin_type                  text,
  etd_month                 text,
  etd                       date,
  eta                       date,
  ng_ok                     text,
  assembly_invoice          text,
  so_no                     text,
  sap_etd                   date,
  -- Status
  general_status            text,
  remarks1                  text,
  tracking_no               text,
  invoice_no                text,
  temporary_part_no         text,
  temporary_drawing_no      text,
  -- Delay flags
  drawing_delay             boolean default false,
  sales_flag                boolean default false,
  process_flag              boolean default false,
  logistics_flag            boolean default false,
  design_flag               boolean default false,
  pin_delay                 boolean default false,
  ng_part                   boolean default false,
  machining_capacity        boolean default false,
  customer_delay            boolean default false,
  holiday                   boolean default false,
  supplier_internal_ng      boolean default false,
  internal_ng               boolean default false,
  ng_summary_remarks        text,
  remarks                   text,
  action_item               text,
  ng_nature                 text,
  ng_affecting_delivery     boolean default false,
  -- Drawing / delivery timelines
  drawing_release           date,
  customer_approval         date,
  delay_from_crdd           numeric,
  drawing_lt                numeric,
  delivery_lt               numeric,
  assembly_lt               numeric,
  -- Assembly details
  socket_lid                text,
  screw_count               numeric,
  module_count              numeric,
  assy_type                 text,
  pin_orientation           text,
  pin_insertion_sec         numeric,
  screwing_sec              numeric,
  module_assy_sec           numeric,
  assy_sec                  numeric,
  parts_fai_sec             numeric,
  assy_fai_sec              numeric,
  consumption_sec           numeric,
  total_cost_per_unit       numeric,
  total_cost_calc           numeric,
  espp_profit               numeric,
  gross_margin_jpy110       numeric,
  po_date                   date,
  ti_customer               text,
  fy                        text,
  assy_drawing              text,
  parts_fai                 text,
  pin_insertion_status      text,
  fully_assembly            text,
  assembly_fai              text,
  coc_shipping_docs         text,
  for_packing               text,
  assy_remarks              text,
  assy_status               text,
  fai_status                text,
  eta_not_adjusted          date,
  internal_ng_ok            text,
  customer_po_for_sales     text,
  unit_cost_jpy120          numeric,
  gross_margin_jpy120       numeric,
  unit_cost_jpy150          numeric,
  gross_margin_jpy150       numeric,
  modules                   numeric,
  us_tariff                 numeric,
  date_of_assy              date,
  date_of_qc_test           date,
  esps                      text,
  -- Metadata
  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),
  created_by                uuid references public.profiles(id),
  updated_by                uuid references public.profiles(id)
);

-- ─────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid references public.orders(id) on delete set null,
  user_id     uuid references public.profiles(id),
  action      text not null,
  field_name  text,
  old_value   text,
  new_value   text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id),
  order_id    uuid references public.orders(id) on delete cascade,
  message     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- UPDATED_AT trigger
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger orders_updated_at before update on public.orders
  for each row execute procedure public.handle_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────────
-- NOTIFY SALES on delay trigger
-- ─────────────────────────────────────────────
create or replace function public.notify_sales_on_delay()
returns trigger as $$
declare
  sales_user record;
begin
  if new.general_status ilike '%delay%' and (old.general_status is null or old.general_status not ilike '%delay%') then
    for sales_user in select id from public.profiles where role = 'sales' and is_active = true loop
      insert into public.notifications (user_id, order_id, message)
      values (sales_user.id, new.id,
        'Order ' || coalesce(new.alliance_po, new.id::text) || ' status changed to DELAY');
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger orders_delay_notify after update on public.orders
  for each row execute procedure public.notify_sales_on_delay();

-- ─────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGN UP
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'sales'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.orders        enable row level security;
alter table public.audit_log     enable row level security;
alter table public.notifications enable row level security;

-- Helper: get current user role
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES policies
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Admin can view all profiles" on public.profiles
  for select using (public.current_user_role() = 'admin');
create policy "Admin can manage profiles" on public.profiles
  for all using (public.current_user_role() = 'admin');

-- ORDERS policies
create policy "All authenticated users can view orders" on public.orders
  for select using (auth.uid() is not null);

create policy "Admin and Planner1 can insert orders" on public.orders
  for insert with check (public.current_user_role() in ('admin','planner1'));

create policy "Admin can update any field" on public.orders
  for update using (public.current_user_role() = 'admin');

create policy "Planner1 can update any field" on public.orders
  for update using (public.current_user_role() = 'planner1');

create policy "Inventory can update consumption_status" on public.orders
  for update using (public.current_user_role() = 'inventory');

create policy "Logistics can update tracking/invoice fields" on public.orders
  for update using (public.current_user_role() = 'logistics');

create policy "Admin can delete orders" on public.orders
  for delete using (public.current_user_role() = 'admin');

-- AUDIT LOG
create policy "Authenticated users can view audit log" on public.audit_log
  for select using (auth.uid() is not null);
create policy "Authenticated users can insert audit log" on public.audit_log
  for insert with check (auth.uid() is not null);

-- NOTIFICATIONS
create policy "Users see own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "System can insert notifications" on public.notifications
  for insert with check (true);
create policy "Users can update own notifications" on public.notifications
  for update using (user_id = auth.uid());
