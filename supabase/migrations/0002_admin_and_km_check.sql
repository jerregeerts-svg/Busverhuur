-- ============================================================
-- 0002: Beheerder + kilometercontrole (toegepast 2026-09-09)
-- ============================================================
alter table public.settings add column if not exists fine_enabled boolean not null default false;
alter table public.settings add column if not exists buffer_minutes int not null default 0;

alter table public.bookings add column if not exists expected_start_km int;
alter table public.bookings add column if not exists km_flagged boolean not null default false;
alter table public.bookings add column if not exists admin_note text;

create or replace function public.last_end_km(p_vehicle text, p_before timestamptz default now())
returns int language sql stable security definer set search_path = public as $$
  select end_km from public.bookings
  where vehicle_id = p_vehicle and status = 'done' and end_km is not null
    and (date + time_to) < p_before
  order by (date + time_to) desc limit 1
$$;
revoke execute on function public.last_end_km(text, timestamptz) from public, anon;
grant execute on function public.last_end_km(text, timestamptz) to authenticated;

create or replace function public.register_ride(
  p_booking uuid, p_driver text, p_destination text, p_date date,
  p_start_km int, p_end_km int, p_notes text default null
) returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings; s public.settings; late boolean; expected int;
begin
  select * into s from public.settings where id = 1;
  select * into b from public.bookings where id = p_booking and user_id = auth.uid() for update;
  if b.id is null then raise exception 'Boeking niet gevonden.'; end if;
  if b.status <> 'planned' then raise exception 'Deze rit is al geregistreerd of geannuleerd.'; end if;
  if now() < (b.date + b.time_to) then raise exception 'De rit is nog niet afgelopen.'; end if;
  if p_end_km <= p_start_km then raise exception 'De eindstand moet hoger zijn dan de beginstand.'; end if;
  if p_end_km - p_start_km > 1500 then raise exception 'Meer dan 1500 km op één rit; controleer de standen.'; end if;
  late := s.fine_enabled and now() > (b.date + b.time_to) + make_interval(hours => s.deadline_hours);
  expected := public.last_end_km(b.vehicle_id, (b.date + b.time_to));
  update public.bookings set
    status = 'done', start_km = p_start_km, end_km = p_end_km,
    reg_driver_name = p_driver, reg_destination = p_destination, reg_date = p_date, reg_notes = p_notes,
    fine_applied = late, registered_at = now(),
    expected_start_km = expected,
    km_flagged = (expected is not null and expected <> p_start_km)
  where id = b.id returning * into b;
  return b;
end $$;

create or replace view public.admin_bookings as
select m.*, p.full_name as customer_name, p.email as customer_email, p.phone as customer_phone,
       p.tag_number as customer_tag, p.organisation as customer_org
from public.my_bookings m join public.profiles p on p.id = m.user_id;
alter view public.admin_bookings set (security_invoker = on);
grant select on public.admin_bookings to authenticated;

create or replace function public.admin_cancel_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Alleen voor beheerders.'; end if;
  update public.bookings set status = 'cancelled', cancelled_at = now() where id = p_booking and status = 'planned';
end $$;
revoke execute on function public.admin_cancel_booking(uuid) from public, anon;
grant execute on function public.admin_cancel_booking(uuid) to authenticated;
