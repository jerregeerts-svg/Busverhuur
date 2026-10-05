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
  /** Uitgebreide informatie achter de knop "Meer informatie" */
  details: {
    /** Korte inleiding bovenaan het informatievenster */
    intro: string;
    /** Waar deze bus bij uitstek geschikt voor is */
    good: string[];
    /** Praktische punten vooraf */
    notes: string[];
  };
  /** Echte foto (uitgesneden) met losse wielen; zonder foto wordt de illustratie gebruikt */
  photo?: { body: string; ratio: number; wheels: { src: string; x: number; y: number; r: number }[] };
  /** Getekende (cartoon) versie voor de voertuigenpagina */
  toon?: { body: string; ratio: number; wheels: { src: string; x: number; y: number; r: number }[] };
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
    specs: ["5 personen incl. bestuurder", "1 rolstoelplaats", "Oprijplaat achter", "Gehandicaptenparkeerkaart aanwezig", "Airco & navigatie", "Automaat", "Rijbewijs B"],
    details: {
      intro: "De Doblò is onze compacte rolstoelbus: een gewone personenauto om te rijden, maar met een verlaagde vloer, een oprijplaat achterin en een vastzetsysteem voor de rolstoel. Hij rijdt automaat, dus u hoeft niet te schakelen.",
      good: [
        "Een dagje uit of familiebezoek met een rolstoelgebruiker erbij",
        "Ritten naar ziekenhuis, revalidatie of dagbesteding",
        "Kleine gezelschappen tot vier passagiers",
        "Plekken waar parkeren krap is: hij rijdt en parkeert als een gewone auto",
      ],
      notes: [
        "Rijdt op rijbewijs B, automaat — geen extra rijbewijs nodig.",
        "Geeft u bij het boeken aan dat er een rolstoelgebruiker meerijdt? Dan leggen wij de oprijplaat en het vastzetsysteem voor u klaar.",
        "Met de rolstoel aan boord blijven er vier zitplaatsen over, inclusief de bestuurder.",
        "Er ligt een gehandicaptenparkeerkaart in de bus.",
      ],
    },
    photo: {
      body: "/img/doblo-body.webp", ratio: 1400 / 632,
      wheels: [
        { src: "/img/doblo-wheel-rear.webp", x: 15.47, y: 82.69, r: 6.9 },
        { src: "/img/doblo-wheel-front.webp", x: 86.44, y: 78.13, r: 6.9 },
      ],
    },
    toon: {
      body: "/img/doblo-toon-body.webp", ratio: 976 / 420,
      wheels: [
        { src: "/img/doblo-toon-wheel-rear.webp", x: 16.29, y: 84.23, r: 6.6 },
        { src: "/img/doblo-toon-wheel-front.webp", x: 85.39, y: 79.86, r: 6.6 },
      ],
    },
  },
  talento: {
    id: "talento",
    name: "Fiat Talento",
    short: "Talento",
    seats: 9,
    wheelchair: false,
    tagline: "Ruime 9-persoonsbus",
    desc: "Voor teams, families en verenigingen. Negen volwaardige zitplaatsen met gordels, veel bagageruimte en comfortabel op lange afstanden.",
    specs: ["9 personen incl. bestuurder", "Geen rolstoelvervoer", "Gehandicaptenparkeerkaart aanwezig", "Grote bagageruimte", "Airco & cruise control", "Handgeschakeld", "Rijbewijs B"],
    details: {
      intro: "De Talento is onze grote bus: negen volwaardige zitplaatsen met gordels en daarachter nog flink wat bagageruimte. Met airco en cruise control rijdt hij ook op langere afstanden comfortabel.",
      good: [
        "Teams, verenigingen en groepen tot acht passagiers",
        "Familie-uitjes en weekendtrips met bagage",
        "Vervoer van en naar een evenement, toernooi of festival",
        "Langere ritten: cruise control en airco aan boord",
      ],
      notes: [
        "Rijdt op rijbewijs B, maar is handgeschakeld en een stuk langer dan een personenauto — houd daar rekening mee bij parkeren.",
        "Deze bus is niet geschikt voor rolstoelvervoer; daarvoor is de Doblò bedoeld.",
        "Negen zitplaatsen inclusief bestuurder, allemaal met gordel.",
        "Er ligt een gehandicaptenparkeerkaart in de bus.",
      ],
    },
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
