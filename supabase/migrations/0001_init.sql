-- ============================================================
-- Busverhuur – databaseschema v1
-- Uitvoeren in Supabase: SQL Editor → New query → plakken → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Instellingen (één rij) ----------
create table if not exists public.settings (
  id            int primary key default 1 check (id = 1),
  rate_per_km   numeric(6,2) not null default 0.53,
  fine          numeric(6,2) not null default 20.00,
  horizon_days  int not null default 14,
  deadline_hours int not null default 24,
  updated_at    timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ---------- Voertuigen ----------
create table if not exists public.vehicles (
  id          text primary key,           -- 'doblo', 'talento'
  name        text not null,
  seats       int  not null,
  wheelchair  boolean not null default false,
  active      boolean not null default true,
  sort_order  int not null default 0
);
insert into public.vehicles (id, name, seats, wheelchair, sort_order) values
  ('doblo',   'Fiat Doblò',   5, true,  1),
  ('talento', 'Fiat Talento', 9, false, 2)
on conflict (id) do nothing;

-- Dagen waarop een bus niet beschikbaar is (onderhoud, eigen gebruik)
create table if not exists public.vehicle_blocks (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  text not null references public.vehicles(id) on delete cascade,
  date        date not null,
  reason      text,
  unique (vehicle_id, date)
);

-- ---------- Profielen (1 op 1 met auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text,
  tag_number  text not null,
  organisation text,
  is_admin    boolean not null default false,
  is_blocked  boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_tag_number_key on public.profiles (upper(tag_number));

-- Profiel automatisch aanmaken bij registratie (gegevens uit signUp metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, tag_number, organisation)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    upper(coalesce(new.raw_user_meta_data->>'tag_number', 'ONBEKEND')),
    new.raw_user_meta_data->>'organisation'
  );
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- Boekingen ----------
do $$ begin
  create type public.booking_status as enum ('planned', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique default ('BV-' || upper(substr(md5(random()::text), 1, 4)) || '-' || (100 + floor(random() * 900))::int),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  vehicle_id    text not null references public.vehicles(id),
  date          date not null,
  time_from     time not null,
  time_to       time not null,
  driver_name   text not null,
  destination   text not null,
  passengers    int,
  wheelchair    boolean not null default false,
  notes         text,
  status        public.booking_status not null default 'planned',
  -- ritregistratie
  start_km      int,
  end_km        int,
  km            int generated always as (end_km - start_km) stored,
  fine_applied  boolean not null default false,
  fine_waived   boolean not null default false,
  registered_at timestamptz,
  reg_driver_name text,
  reg_destination text,
  reg_date      date,
  reg_notes     text,
  created_at    timestamptz not null default now(),
  cancelled_at  timestamptz,
  constraint time_order check (time_to > time_from),
  constraint km_order check (end_km is null or start_km is null or end_km > start_km)
);
create index if not exists bookings_user_idx on public.bookings (user_id, date desc);
-- Eén actieve boeking per bus per dag
create unique index if not exists bookings_vehicle_day_unique
  on public.bookings (vehicle_id, date) where status <> 'cancelled';

-- Deadline en boete-status als berekende kolommen in een view
create or replace view public.my_bookings as
select b.*,
       (b.date + b.time_to) as ends_at,
       (b.date + b.time_to) + make_interval(hours => s.deadline_hours) as deadline_at,
       case
         when b.status = 'cancelled' then 'cancelled'
         when b.status = 'done' then 'done'
         when now() < (b.date + b.time_to) then 'planned'
         when now() <= (b.date + b.time_to) + make_interval(hours => s.deadline_hours) then 'open'
         else 'overdue'
       end as phase
from public.bookings b cross join public.settings s;

-- Beschikbaarheid: alleen bus + datum, geen persoonsgegevens
create or replace view public.availability as
  select vehicle_id, date from public.bookings where status <> 'cancelled'
  union
  select vehicle_id, date from public.vehicle_blocks;

-- Serverside validatie van nieuwe boekingen
create or replace function public.validate_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.settings; p public.profiles; v public.vehicles;
begin
  select * into s from public.settings where id = 1;
  select * into p from public.profiles where id = new.user_id;
  select * into v from public.vehicles where id = new.vehicle_id;
  if p.is_blocked then raise exception 'Dit account is geblokkeerd. Neem contact met ons op.'; end if;
  if not v.active then raise exception 'Dit voertuig is momenteel niet beschikbaar.'; end if;
  if new.date < current_date then raise exception 'De datum ligt in het verleden.'; end if;
  if new.date > current_date + s.horizon_days then
    raise exception 'Online boeken kan tot % dagen vooruit. Gebruik het contactformulier.', s.horizon_days;
  end if;
  if new.passengers is not null and new.passengers > v.seats then
    raise exception 'Maximaal % personen in dit voertuig.', v.seats;
  end if;
  if new.wheelchair and not v.wheelchair then
    raise exception 'Dit voertuig is niet geschikt voor rolstoelvervoer.';
  end if;
  if exists (select 1 from public.vehicle_blocks where vehicle_id = new.vehicle_id and date = new.date) then
    raise exception 'Deze bus is op die dag niet beschikbaar.';
  end if;
  return new;
end $$;
drop trigger if exists bookings_validate on public.bookings;
create trigger bookings_validate before insert on public.bookings
  for each row execute function public.validate_booking();

-- Ritregistratie via functie (bepaalt zelf of de boete van toepassing is)
create or replace function public.register_ride(
  p_booking uuid, p_driver text, p_destination text, p_date date,
  p_start_km int, p_end_km int, p_notes text default null
) returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings; s public.settings; late boolean;
begin
  select * into s from public.settings where id = 1;
  select * into b from public.bookings where id = p_booking and user_id = auth.uid() for update;
  if b.id is null then raise exception 'Boeking niet gevonden.'; end if;
  if b.status <> 'planned' then raise exception 'Deze rit is al geregistreerd of geannuleerd.'; end if;
  if now() < (b.date + b.time_to) then raise exception 'De rit is nog niet afgelopen.'; end if;
  if p_end_km <= p_start_km then raise exception 'De eindstand moet hoger zijn dan de beginstand.'; end if;
  if p_end_km - p_start_km > 1500 then raise exception 'Meer dan 1500 km op één rit; controleer de standen.'; end if;
  late := now() > (b.date + b.time_to) + make_interval(hours => s.deadline_hours);
  update public.bookings set
    status = 'done', start_km = p_start_km, end_km = p_end_km,
    reg_driver_name = p_driver, reg_destination = p_destination, reg_date = p_date, reg_notes = p_notes,
    fine_applied = late, registered_at = now()
  where id = b.id returning * into b;
  return b;
end $$;

-- Annuleren via functie (respecteert de annuleringstermijn)
create or replace function public.cancel_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking and user_id = auth.uid();
  if b.id is null then raise exception 'Boeking niet gevonden.'; end if;
  if b.status <> 'planned' then raise exception 'Deze boeking kan niet meer geannuleerd worden.'; end if;
  if (b.date + b.time_from) - now() < interval '24 hours' then
    raise exception 'Annuleren kan tot 24 uur voor de ophaaltijd. Neem telefonisch contact op.';
  end if;
  update public.bookings set status = 'cancelled', cancelled_at = now() where id = b.id;
end $$;

-- ---------- Contactformulier ----------
create table if not exists public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text not null,
  message     text not null,
  wanted_date date,
  vehicle_id  text,
  time_from   time,
  time_to     time,
  destination text,
  user_id     uuid references public.profiles(id),
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.settings         enable row level security;
alter table public.vehicles         enable row level security;
alter table public.vehicle_blocks   enable row level security;
alter table public.profiles         enable row level security;
alter table public.bookings         enable row level security;
alter table public.contact_requests enable row level security;

-- Iedereen mag instellingen en voertuigen lezen
create policy "settings read"  on public.settings  for select using (true);
create policy "vehicles read"  on public.vehicles  for select using (true);
create policy "blocks read"    on public.vehicle_blocks for select to authenticated using (true);

-- Profiel: eigen rij lezen/bijwerken, admin alles
create policy "profile self read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Gebruikers mogen zichzelf geen admin maken of deblokkeren
create or replace function public.protect_profile_flags()
returns trigger language plpgsql set search_path = public as $$
begin
  -- auth.uid() is null bij beheer via SQL/Table Editor; die mag altijd
  if auth.uid() is not null and not public.is_admin() and (new.is_admin <> old.is_admin or new.is_blocked <> old.is_blocked or new.tag_number <> old.tag_number) then
    raise exception 'Deze velden kunnen alleen door de beheerder worden gewijzigd.';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_flags();

-- Boekingen: eigen rijen; aanmaken alleen voor jezelf; wijzigen via functies
create policy "bookings own read"   on public.bookings for select using (user_id = auth.uid() or public.is_admin());
create policy "bookings own insert" on public.bookings for insert to authenticated with check (user_id = auth.uid());

-- Contact: iedereen mag insturen (ook zonder account), alleen admin leest
create policy "contact insert" on public.contact_requests for insert with check (true);
create policy "contact admin read" on public.contact_requests for select using (public.is_admin());

-- Admin mag alles beheren
create policy "admin settings" on public.settings for all using (public.is_admin());
create policy "admin vehicles" on public.vehicles for all using (public.is_admin());
create policy "admin blocks"   on public.vehicle_blocks for all using (public.is_admin());
create policy "admin bookings" on public.bookings for all using (public.is_admin());
create policy "admin profiles" on public.profiles for all using (public.is_admin());
create policy "admin contact"  on public.contact_requests for all using (public.is_admin());

-- Views draaien met rechten van de aanroeper (respecteren RLS)
alter view public.my_bookings set (security_invoker = on);
-- availability moet juist wél alle boekingen zien (zonder persoonsgegevens)
alter view public.availability set (security_invoker = off);
grant select on public.availability to anon, authenticated;
grant select on public.my_bookings to authenticated;
grant execute on function public.register_ride to authenticated;
grant execute on function public.cancel_booking to authenticated;

-- ============================================================
-- Beheerder aanwijzen: vervang het e-mailadres en voer uit
-- update public.profiles set is_admin = true where email = 'jij@bedrijf.nl';
-- ============================================================

-- ---------- Aanscherping rechten (toegepast 2026-09-09) ----------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.validate_booking() from public, anon, authenticated;
revoke execute on function public.protect_profile_flags() from public, anon, authenticated;
revoke execute on function public.register_ride(uuid, text, text, date, int, int, text) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.register_ride(uuid, text, text, date, int, int, text) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
alter function public.protect_profile_flags() set search_path = public;
