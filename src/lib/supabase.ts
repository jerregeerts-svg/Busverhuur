import { createClient } from "@supabase/supabase-js";

/**
 * Vaste projectgegevens, zodat elke build (Lovable, Netlify, waar dan ook) zonder
 * instellen meteen met de echte database praat. De publishable key hoort in de
 * browser thuis; de beveiliging zit in de RLS-regels op de database zelf.
 * Met VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY wijs je desgewenst een ander
 * project aan, en met VITE_DEMO=1 bouw je bewust een demo (alles in de browser).
 */
const DEFAULT_URL = "https://bjaihfjkfypbkfrgdpmd.supabase.co";
const DEFAULT_KEY = "sb_publishable_P-G8K3wb5jElXl0pLT3dKw_exqpX790";

const DEMO = import.meta.env.VITE_DEMO === "1";
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const url = envUrl && !envUrl.includes("xxxx") ? envUrl : DEFAULT_URL;
const key = envKey && !envKey.includes("xxxx") ? envKey : DEFAULT_KEY;

/** False alleen bij een bewuste demo-build; dan draait alles in de browser. */
export const SUPABASE_CONFIGURED = !DEMO;

export const supabase = createClient(url, key, {
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
