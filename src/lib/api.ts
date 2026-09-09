/**
 * Data-laag. Alle schermen praten alleen met deze functies.
 * - Met Supabase-gegevens in .env: echte database.
 * - Zonder: demo-modus in de browser (localStorage), zodat de site
 *   al volledig te bekijken en te testen is vóór het Supabase-account er is.
 */
import { supabase, SUPABASE_CONFIGURED, type AdminBooking, type Booking, type ContactRequest, type Profile, type Settings, type VehicleBlock } from "./supabase";
import { CONFIG, type VehicleId } from "@/config";

export interface RegisterInput {
  bookingId: string;
  driver: string;
  destination: string;
  date: string;
  startKm: number;
  endKm: number;
  notes?: string;
}
export interface NewBooking {
  vehicle_id: VehicleId;
  date: string;
  time_from: string;
  time_to: string;
  driver_name: string;
  destination: string;
  passengers: number | null;
  wheelchair: boolean;
  notes: string | null;
}
export interface ContactInput {
  name: string; email: string; phone?: string; subject: string; message: string;
  wanted_date?: string; vehicle_id?: string; time_from?: string; time_to?: string; destination?: string;
}
export interface SignUpInput { email: string; password: string; full_name: string; phone: string; tag_number: string; organisation?: string }

export interface Api {
  demo: boolean;
  getSession(): Promise<Profile | null>;
  onAuthChange(cb: (p: Profile | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getSettings(): Promise<Settings>;
  getAvailability(vehicle: VehicleId): Promise<string[]>; // bezette datums
  myBookings(): Promise<Booking[]>;
  createBooking(b: NewBooking): Promise<Booking>;
  cancelBooking(id: string): Promise<void>;
  registerRide(input: RegisterInput): Promise<Booking>;
  sendContact(input: ContactInput): Promise<void>;
  lastEndKm(vehicle: VehicleId, before: string): Promise<number | null>;
  loginDemo?(): Promise<void>;
  // ---- beheer ----
  adminBookings(): Promise<AdminBooking[]>;
  adminProfiles(): Promise<Profile[]>;
  adminContacts(): Promise<ContactRequest[]>;
  adminBlocks(): Promise<VehicleBlock[]>;
  adminAddBlock(vehicle: VehicleId, date: string, reason: string): Promise<void>;
  adminRemoveBlock(id: string): Promise<void>;
  adminSetProfile(id: string, patch: Partial<Pick<Profile, "is_blocked" | "is_admin">>): Promise<void>;
  adminSetBooking(id: string, patch: Partial<Pick<Booking, "fine_waived" | "admin_note" | "km_flagged">>): Promise<void>;
  adminCancelBooking(id: string): Promise<void>;
  adminSetContactHandled(id: string, handled: boolean): Promise<void>;
  adminSaveSettings(s: Settings): Promise<void>;
}

/* ============================ Supabase ============================ */
const supabaseApi: Api = {
  demo: false,
  async getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return fetchProfile(data.session.user.id);
  },
  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange(async (_e, session) => {
      cb(session ? await fetchProfile(session.user.id) : null);
    });
    return () => data.subscription.unsubscribe();
  },
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(vertaal(error.message));
  },
  async signUp(i) {
    const { data, error } = await supabase.auth.signUp({
      email: i.email, password: i.password,
      options: { data: { full_name: i.full_name, phone: i.phone, tag_number: i.tag_number.toUpperCase(), organisation: i.organisation ?? null } },
    });
    if (error) throw new Error(vertaal(error.message));
    return { needsConfirmation: !data.session };
  },
  async signOut() { await supabase.auth.signOut(); },
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/account" });
    if (error) throw new Error(vertaal(error.message));
  },
  async getSettings() {
    const { data } = await supabase.from("settings").select("rate_per_km,fine,fine_enabled,horizon_days,deadline_hours,buffer_minutes").eq("id", 1).single();
    return (data as Settings) ?? defaultSettings();
  },
  async getAvailability(vehicle) {
    const { data, error } = await supabase.from("availability").select("date").eq("vehicle_id", vehicle).gte("date", todayIso());
    if (error) throw new Error(vertaal(error.message));
    return (data ?? []).map((r) => r.date as string);
  },
  async myBookings() {
    const { data, error } = await supabase.from("my_bookings").select("*").order("date", { ascending: false });
    if (error) throw new Error(vertaal(error.message));
    return (data ?? []) as Booking[];
  },
  async createBooking(b) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("U bent niet ingelogd.");
    const { data, error } = await supabase.from("bookings").insert({ ...b, user_id: u.user.id }).select("id").single();
    if (error) throw new Error(vertaal(error.message));
    const { data: full } = await supabase.from("my_bookings").select("*").eq("id", data.id).single();
    return full as Booking;
  },
  async cancelBooking(id) {
    const { error } = await supabase.rpc("cancel_booking", { p_booking: id });
    if (error) throw new Error(vertaal(error.message));
  },
  async registerRide(i) {
    const { data, error } = await supabase.rpc("register_ride", {
      p_booking: i.bookingId, p_driver: i.driver, p_destination: i.destination, p_date: i.date,
      p_start_km: i.startKm, p_end_km: i.endKm, p_notes: i.notes ?? null,
    });
    if (error) throw new Error(vertaal(error.message));
    const { data: full } = await supabase.from("my_bookings").select("*").eq("id", (data as Booking).id).single();
    return full as Booking;
  },
  async sendContact(i) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("contact_requests").insert({ ...i, user_id: u.user?.id ?? null });
    if (error) throw new Error(vertaal(error.message));
  },
  async lastEndKm(vehicle, before) {
    const { data } = await supabase.rpc("last_end_km", { p_vehicle: vehicle, p_before: before });
    return (data as number | null) ?? null;
  },
  async adminBookings() { const { data, error } = await supabase.from("admin_bookings").select("*").order("date", { ascending: false }); if (error) throw new Error(vertaal(error.message)); return data as AdminBooking[]; },
  async adminProfiles() { const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); if (error) throw new Error(vertaal(error.message)); return data as Profile[]; },
  async adminContacts() { const { data, error } = await supabase.from("contact_requests").select("*").order("created_at", { ascending: false }); if (error) throw new Error(vertaal(error.message)); return data as ContactRequest[]; },
  async adminBlocks() { const { data, error } = await supabase.from("vehicle_blocks").select("*").gte("date", todayIso()).order("date"); if (error) throw new Error(vertaal(error.message)); return data as VehicleBlock[]; },
  async adminAddBlock(vehicle, date, reason) { const { error } = await supabase.from("vehicle_blocks").insert({ vehicle_id: vehicle, date, reason }); if (error) throw new Error(vertaal(error.message)); },
  async adminRemoveBlock(id) { const { error } = await supabase.from("vehicle_blocks").delete().eq("id", id); if (error) throw new Error(vertaal(error.message)); },
  async adminSetProfile(id, patch) { const { error } = await supabase.from("profiles").update(patch).eq("id", id); if (error) throw new Error(vertaal(error.message)); },
  async adminSetBooking(id, patch) { const { error } = await supabase.from("bookings").update(patch).eq("id", id); if (error) throw new Error(vertaal(error.message)); },
  async adminCancelBooking(id) { const { error } = await supabase.rpc("admin_cancel_booking", { p_booking: id }); if (error) throw new Error(vertaal(error.message)); },
  async adminSetContactHandled(id, handled) { const { error } = await supabase.from("contact_requests").update({ handled }).eq("id", id); if (error) throw new Error(vertaal(error.message)); },
  async adminSaveSettings(st) { const { error } = await supabase.from("settings").update({ ...st, updated_at: new Date().toISOString() }).eq("id", 1); if (error) throw new Error(vertaal(error.message)); },
};

function defaultSettings(): Settings {
  return { rate_per_km: CONFIG.ratePerKm, fine: CONFIG.fine, fine_enabled: CONFIG.fineEnabled, horizon_days: CONFIG.horizonDays, deadline_hours: CONFIG.deadlineHours, buffer_minutes: CONFIG.bufferMinutes };
}

async function fetchProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return (data as Profile) ?? null;
}

/** Vertaalt de meest voorkomende Supabase-foutmeldingen naar het Nederlands. */
function vertaal(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mailadres of wachtwoord klopt niet.";
  if (m.includes("email not confirmed")) return "Bevestig eerst uw e-mailadres via de link in uw mailbox.";
  if (m.includes("user already registered")) return "Er bestaat al een account met dit e-mailadres.";
  if (m.includes("profiles_tag_number_key")) return "Dit tagnummer is al gekoppeld aan een ander account.";
  if (m.includes("bookings_vehicle_day_unique")) return "Deze bus is op die dag net geboekt door iemand anders. Kies een andere dag.";
  if (m.includes("password should be")) return "Het wachtwoord moet minimaal 8 tekens lang zijn.";
  return msg;
}

/* ============================ Demo-modus ============================ */
const KEY = "busverhuur-demo";
interface DemoState { user: Profile | null; bookings: Booking[]; blocks: Record<VehicleId, number[]> }
function loadDemo(): DemoState {
  try { const s = JSON.parse(localStorage.getItem(KEY) ?? ""); if (s && s.bookings) return s; } catch { /* leeg */ }
  return { user: null, bookings: [], blocks: { doblo: [2, 3, 9], talento: [1, 5, 6, 12] } };
}
function saveDemo(s: DemoState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privémodus */ } }
const listeners = new Set<(p: Profile | null) => void>();
const rnd = () => "BV-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
const addDays = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return toIso(d); };
function toIso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function todayIso() { return toIso(new Date()); }
function withPhase(b: Booking): Booking {
  const ends = new Date(`${b.date}T${b.time_to}`);
  const deadline = new Date(ends.getTime() + CONFIG.deadlineHours * 3600e3);
  const now = new Date();
  const phase = b.status === "cancelled" ? "cancelled" : b.status === "done" ? "done" : now < ends ? "planned" : now <= deadline ? "open" : "overdue";
  return { ...b, ends_at: ends.toISOString(), deadline_at: deadline.toISOString(), phase };
}
function mk(p: Partial<Booking>): Booking {
  return withPhase({
    id: crypto.randomUUID(), ref: rnd(), user_id: "demo", vehicle_id: "doblo", date: todayIso(), time_from: "09:00:00", time_to: "17:00:00",
    driver_name: "", destination: "", passengers: null, wheelchair: false, notes: null, status: "planned", start_km: null, end_km: null, km: null,
    fine_applied: false, fine_waived: false, registered_at: null, reg_driver_name: null, reg_destination: null, reg_date: null, expected_start_km: null, km_flagged: false, admin_note: null,
    created_at: new Date().toISOString(), ends_at: "", deadline_at: "", phase: "planned", ...p,
  });
}
function seed(): Booking[] {
  return [
    mk({ ref: "BV-7K2Q-418", vehicle_id: "doblo", date: addDays(-1), time_from: "09:00:00", time_to: (String(new Date().getHours()).padStart(2, "0")) + ":00:00", driver_name: "Sanne de Vries", destination: "Dagbesteding Oosterhout" }),
    mk({ ref: "BV-3MZP-902", vehicle_id: "talento", date: addDays(-6), time_from: "08:00:00", time_to: "20:00:00", driver_name: "Mark Jansen", destination: "Efteling, Kaatsheuvel" }),
    mk({ ref: "BV-9AQL-233", vehicle_id: "doblo", date: addDays(-13), time_from: "10:00:00", time_to: "14:00:00", driver_name: "Sanne de Vries", destination: "Ziekenhuis Breda", status: "done", start_km: 48210, end_km: 48262, km: 52, registered_at: new Date(Date.now() - 12.6 * 86400e3).toISOString() }),
    mk({ ref: "BV-5RRT-771", vehicle_id: "talento", date: addDays(-21), time_from: "09:00:00", time_to: "18:00:00", driver_name: "Peter Bakker", destination: "Strand Scheveningen", status: "done", start_km: 91530, end_km: 91744, km: 214, registered_at: new Date(Date.now() - 20.8 * 86400e3).toISOString() }),
    mk({ ref: "BV-2HHD-660", vehicle_id: "doblo", date: addDays(4), time_from: "09:00:00", time_to: "16:00:00", driver_name: "Sanne de Vries", destination: "Dierentuin Blijdorp" }),
  ];
}
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const demoApi: Api = {
  demo: true,
  async getSession() { return loadDemo().user; },
  onAuthChange(cb) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  async signIn(email) {
    await delay();
    const s = loadDemo();
    s.user = { id: "demo", full_name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), email, phone: "", tag_number: "TAG-00000", organisation: null, is_admin: false, is_blocked: false };
    s.bookings = [];
    saveDemo(s); listeners.forEach((l) => l(s.user));
  },
  async signUp(i) {
    await delay();
    const s = loadDemo();
    s.user = { id: "demo", full_name: i.full_name, email: i.email, phone: i.phone, tag_number: i.tag_number.toUpperCase(), organisation: i.organisation ?? null, is_admin: false, is_blocked: false };
    s.bookings = [];
    saveDemo(s); listeners.forEach((l) => l(s.user));
    return { needsConfirmation: false };
  },
  async loginDemo() {
    await delay();
    const s = loadDemo();
    s.user = { id: "demo", full_name: "Sanne de Vries", email: "sanne@voorbeeld.nl", phone: "06 12345678", tag_number: "TAG-04821", organisation: "Zorgboerderij De Linde", is_admin: false, is_blocked: false };
    s.bookings = seed();
    saveDemo(s); listeners.forEach((l) => l(s.user));
  },
  async signOut() { const s = loadDemo(); s.user = null; s.bookings = []; saveDemo(s); listeners.forEach((l) => l(null)); },
  async resetPassword() { await delay(); },
  async getSettings() { return defaultSettings(); },
  async getAvailability(vehicle) {
    const s = loadDemo();
    return [...s.blocks[vehicle].map(addDays), ...s.bookings.filter((b) => b.vehicle_id === vehicle && b.status !== "cancelled").map((b) => b.date)];
  },
  async myBookings() { return loadDemo().bookings.map(withPhase).sort((a, b) => (a.date < b.date ? 1 : -1)); },
  async createBooking(b) {
    await delay();
    const s = loadDemo();
    if (!s.user) throw new Error("U bent niet ingelogd.");
    if (s.bookings.some((x) => x.vehicle_id === b.vehicle_id && x.date === b.date && x.status !== "cancelled")) throw new Error("Deze bus is op die dag al geboekt.");
    const nb = mk({ ...b, time_from: b.time_from + ":00", time_to: b.time_to + ":00" });
    s.bookings.unshift(nb); saveDemo(s); return nb;
  },
  async cancelBooking(id) {
    await delay();
    const s = loadDemo(); const b = s.bookings.find((x) => x.id === id);
    if (!b) throw new Error("Boeking niet gevonden.");
    if (new Date(`${b.date}T${b.time_from}`).getTime() - Date.now() < CONFIG.cancelHours * 3600e3) throw new Error(`Annuleren kan tot ${CONFIG.cancelHours} uur voor de ophaaltijd. Neem telefonisch contact op.`);
    b.status = "cancelled"; saveDemo(s);
  },
  async registerRide(i) {
    await delay();
    const s = loadDemo(); const b = s.bookings.find((x) => x.id === i.bookingId);
    if (!b) throw new Error("Boeking niet gevonden.");
    const ph = withPhase(b).phase;
    if (ph === "planned") throw new Error("De rit is nog niet afgelopen.");
    if (i.endKm <= i.startKm) throw new Error("De eindstand moet hoger zijn dan de beginstand.");
    const expected = await demoApi.lastEndKm(b.vehicle_id, `${b.date}T${b.time_to}`);
    Object.assign(b, { status: "done", start_km: i.startKm, end_km: i.endKm, km: i.endKm - i.startKm, reg_driver_name: i.driver, reg_destination: i.destination, reg_date: i.date, fine_applied: CONFIG.fineEnabled && ph === "overdue", registered_at: new Date().toISOString(), expected_start_km: expected, km_flagged: expected !== null && expected !== i.startKm });
    saveDemo(s); return withPhase(b);
  },
  async sendContact() { await delay(400); },
  async lastEndKm(vehicle, before) {
    const done = loadDemo().bookings.filter((b) => b.vehicle_id === vehicle && b.status === "done" && b.end_km && `${b.date}T${b.time_to}` < before).sort((a, b) => (`${a.date}T${a.time_to}` < `${b.date}T${b.time_to}` ? 1 : -1));
    return done[0]?.end_km ?? null;
  },
  async adminBookings() { const s = loadDemo(); const u = s.user!; return s.bookings.map(withPhase).map((b) => ({ ...b, customer_name: u.full_name, customer_email: u.email, customer_phone: u.phone, customer_tag: u.tag_number, customer_org: u.organisation })); },
  async adminProfiles() { const u = loadDemo().user; return u ? [u] : []; },
  async adminContacts() { return []; },
  async adminBlocks() { const s = loadDemo(); return Object.entries(s.blocks).flatMap(([v, days]) => days.map((d) => ({ id: `${v}-${d}`, vehicle_id: v, date: addDays(d), reason: "Onderhoud (demo)" }))); },
  async adminAddBlock(vehicle, date) { const s = loadDemo(); const off = Math.round((new Date(date + "T00:00").getTime() - new Date(todayIso() + "T00:00").getTime()) / 86400e3); s.blocks[vehicle].push(off); saveDemo(s); },
  async adminRemoveBlock(id) { const s = loadDemo(); const [v, d] = id.split("-"); s.blocks[v as VehicleId] = s.blocks[v as VehicleId].filter((x) => String(x) !== d); saveDemo(s); },
  async adminSetProfile(_id, patch) { const s = loadDemo(); if (s.user) Object.assign(s.user, patch); saveDemo(s); },
  async adminSetBooking(id, patch) { const s = loadDemo(); const b = s.bookings.find((x) => x.id === id); if (b) Object.assign(b, patch); saveDemo(s); },
  async adminCancelBooking(id) { const s = loadDemo(); const b = s.bookings.find((x) => x.id === id); if (b) b.status = "cancelled"; saveDemo(s); },
  async adminSetContactHandled() { /* demo */ },
  async adminSaveSettings(st) { Object.assign(CONFIG, { ratePerKm: st.rate_per_km, fine: st.fine, fineEnabled: st.fine_enabled, horizonDays: st.horizon_days, deadlineHours: st.deadline_hours, bufferMinutes: st.buffer_minutes }); },
};

export const api: Api = SUPABASE_CONFIGURED ? supabaseApi : demoApi;
