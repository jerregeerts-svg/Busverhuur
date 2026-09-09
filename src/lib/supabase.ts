import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True zolang er nog geen Supabase-gegevens in .env staan (site draait dan in demo-modus). */
export const SUPABASE_CONFIGURED = Boolean(url && key && !url.includes("xxxx"));

export const supabase = createClient(url ?? "https://placeholder.supabase.co", key ?? "placeholder", {
  auth: { persistSession: true, autoRefreshToken: true },
});

/* ---------- Types (spiegel van het databaseschema) ---------- */
export type BookingPhase = "planned" | "open" | "overdue" | "done" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  tag_number: string;
  organisation: string | null;
  is_admin: boolean;
  is_blocked: boolean;
}

export interface Booking {
  id: string;
  ref: string;
  user_id: string;
  vehicle_id: "doblo" | "talento";
  date: string; // YYYY-MM-DD
  time_from: string; // HH:MM:SS
  time_to: string;
  driver_name: string;
  destination: string;
  passengers: number | null;
  wheelchair: boolean;
  notes: string | null;
  status: "planned" | "done" | "cancelled";
  start_km: number | null;
  end_km: number | null;
  km: number | null;
  fine_applied: boolean;
  fine_waived: boolean;
  registered_at: string | null;
  reg_driver_name: string | null;
  reg_destination: string | null;
  reg_date: string | null;
  reg_notes?: string | null;
  expected_start_km: number | null;
  km_flagged: boolean;
  admin_note: string | null;
  created_at: string;
  // uit de view my_bookings
  ends_at: string;
  deadline_at: string;
  phase: BookingPhase;
}

export interface Settings {
  rate_per_km: number;
  fine: number;
  fine_enabled: boolean;
  horizon_days: number;
  deadline_hours: number;
  buffer_minutes: number;
}

export interface AdminBooking extends Booking {
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_tag: string;
  customer_org: string | null;
}

export interface ContactRequest {
  id: string; name: string; email: string; phone: string | null; subject: string; message: string;
  wanted_date: string | null; vehicle_id: string | null; time_from: string | null; time_to: string | null;
  destination: string | null; handled: boolean; created_at: string;
}

export interface VehicleBlock { id: string; vehicle_id: string; date: string; reason: string | null }
