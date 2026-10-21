-- =============================================
-- Nearby Outlet Finder — Skema Supabase (opsional)
-- Jalankan di SQL Editor Supabase untuk mengaktifkan database persisten multi-user.
-- Aplikasi berjalan penuh dengan localStorage TANPA tabel ini.
-- =============================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'sales' check (role in ('sales', 'supervisor', 'head')),
  created_at timestamptz not null default now()
);

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  outlet_code text,
  name text not null check (char_length(name) >= 2),
  address text default '',
  kelurahan text default '',
  kecamatan text default '',
  city text default '',
  salesman text default '',
  rayon text default '',
  category text default 'Umum',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indeks spasial untuk pencarian radius (butuh extension postgis)
create extension if not exists postgis;
create index if not exists outlets_geo_idx on public.outlets using gist (geography(st_makepoint(longitude, latitude)));
create index if not exists outlets_rayon_idx on public.outlets (rayon);
create index if not exists outlets_salesman_idx on public.outlets (salesman);
create unique index if not exists outlets_code_uidx on public.outlets (outlet_code) where outlet_code <> '';

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  sales_name text not null check (char_length(sales_name) >= 2),
  visit_time timestamptz not null default now(),
  visit_status text not null check (visit_status in ('sudah', 'followup')),
  notes text default '',
  follow_up_date date,
  created_at timestamptz not null default now()
);

create index if not exists visits_outlet_idx on public.visits (outlet_id);
create index if not exists visits_time_idx on public.visits (visit_time);

-- Contoh spatial query radius (PostgreSQL/PostGIS), menggantikan perhitungan Haversine di client:
-- select o.*, st_distance(geography(st_makepoint(o.longitude, o.latitude)),
--        geography(st_makepoint(:lng, :lat))) / 1000 as distance_km
-- from outlets o
-- where st_dwithin(geography(st_makepoint(o.longitude, o.latitude)),
--        geography(st_makepoint(:lng, :lat)), :radius_meters)
-- order by distance_km;

-- =============================================
-- Row Level Security
-- =============================================
alter table public.profiles enable row level security;
alter table public.outlets enable row level security;
alter table public.visits enable row level security;

create or replace function public.is_supervisor()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role in ('supervisor', 'head')) $$;

-- profiles: pengguna bisa membaca profil sendiri; supervisor membaca semua
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id or public.is_supervisor());
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- outlets: semua peran terautentikasi dapat membaca; hanya supervisor/head yang menulis
create policy "outlets_select_all" on public.outlets for select to authenticated using (true);
create policy "outlets_insert_sup" on public.outlets for insert to authenticated with check (public.is_supervisor());
create policy "outlets_update_sup" on public.outlets for update to authenticated using (public.is_supervisor());
create policy "outlets_delete_sup" on public.outlets for delete to authenticated using (public.is_supervisor());

-- visits: sales mencatat kunjungan sendiri; membaca semua kunjungan; supervisor mengelola semua
create policy "visits_select_all" on public.visits for select to authenticated using (true);
create policy "visits_insert_own" on public.visits for insert to authenticated with check (auth.uid() = user_id);
create policy "visits_update_own" on public.visits for update to authenticated using (auth.uid() = user_id or public.is_supervisor());
create policy "visits_delete_sup" on public.visits for delete to authenticated using (public.is_supervisor());

-- Trigger updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists outlets_touch on public.outlets;
create trigger outlets_touch before update on public.outlets for each row execute function public.touch_updated_at();
