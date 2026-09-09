/**
 * Centrale instellingen. Pas hier tarieven, regels en bedrijfsgegevens aan.
 * Let op: de database heeft dezelfde regels (zie supabase/migrations) —
 * pas RATE/HORIZON ook daar aan als je ze wijzigt.
 */
export const CONFIG = {
  company: {
    name: "Bedrijfsnaam", // <- later vervangen door de echte naam
    email: "info@bedrijfsnaam.nl",
    phone: "06 – 00 00 00 00",
    address: "Straatnaam 1, 0000 AA Plaats",
    kvk: "00000000",
    btw: "NL000000000B01",
  },
  /** Tarief per gereden kilometer in euro */
  ratePerKm: 0.53,
  /** Administratiekosten wanneer een rit niet op tijd wordt geregistreerd */
  fine: 20,
  /** Boetesysteem aan/uit. Wordt bij het laden overschreven door de tabel `settings` in Supabase
   *  (aan/uit te zetten in het beheerdersdashboard → Instellingen). */
  fineEnabled: false,
  /** Minimale tijd (minuten) tussen twee boekingen van dezelfde bus; komt ook uit `settings`. */
  bufferMinutes: 0,
  /** Hoeveel dagen vooruit klanten online mogen boeken */
  horizonDays: 14,
  /** Uren na de terugbrengtijd waarbinnen de rit geregistreerd moet zijn */
  deadlineHours: 24,
  /** Beschikbare ophaal-/terugbrengtijden */
  times: ["07:00", "08:00", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
  /** Kosteloos annuleren tot X uur voor ophaaltijd */
  cancelHours: 24,
};

export type VehicleId = "doblo" | "talento";

export interface VehicleInfo {
  id: VehicleId;
  name: string;
  short: string;
  seats: number;
  wheelchair: boolean;
  tagline: string;
  desc: string;
  specs: string[];
}

/** Presentatie-info per voertuig (de beschikbaarheid komt uit Supabase). */
export const VEHICLES: Record<VehicleId, VehicleInfo> = {
  doblo: {
    id: "doblo",
    name: "Fiat Doblò",
    short: "Doblo",
    seats: 5,
    wheelchair: true,
    tagline: "Compacte rolstoelbus",
    desc: "Ideaal voor kleine gezelschappen en vervoer van een rolstoelgebruiker. Uitgerust met oprijplaat, rolstoelvastzetsysteem en verlaagde vloer.",
    specs: ["5 personen incl. bestuurder", "1 rolstoelplaats", "Oprijplaat achter", "Airco & navigatie", "Automaat", "Rijbewijs B"],
  },
  talento: {
    id: "talento",
    name: "Fiat Talento",
    short: "Talento",
    seats: 9,
    wheelchair: false,
    tagline: "Ruime 9-persoonsbus",
    desc: "Voor teams, families en verenigingen. Negen volwaardige zitplaatsen met gordels, veel bagageruimte en comfortabel op lange afstanden.",
    specs: ["9 personen incl. bestuurder", "Geen rolstoelvervoer", "Grote bagageruimte", "Airco & cruise control", "Handgeschakeld", "Rijbewijs B"],
  },
};

/** Overschrijft de standaardwaarden met wat in Supabase (tabel settings) staat. */
export function applySettings(s: { rate_per_km: number; fine: number; fine_enabled: boolean; horizon_days: number; deadline_hours: number; buffer_minutes: number }) {
  CONFIG.ratePerKm = Number(s.rate_per_km);
  CONFIG.fine = Number(s.fine);
  CONFIG.fineEnabled = !!s.fine_enabled;
  CONFIG.horizonDays = Number(s.horizon_days);
  CONFIG.deadlineHours = Number(s.deadline_hours);
  CONFIG.bufferMinutes = Number(s.buffer_minutes ?? 0);
}
