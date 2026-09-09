# Busverhuur – website & boekingsportaal

Complete website met online boeken, klantaccounts en verplichte ritregistratie (kilometers)
met € 20 administratiekosten bij te late registratie.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase (auth & database).
Dit is exact de stack die Lovable gebruikt, dus het project kan later 1-op-1 naar Lovable.

---

## Wat zit erin

| Onderdeel | Waar |
|---|---|
| Publieke site (home, voertuigen, tarieven, contact) | `src/pages/Home.tsx`, `Vehicles.tsx`, `Pricing.tsx`, `Contact.tsx` |
| Boekingsflow (bus → datum ≤ 14 dagen → ritgegevens → bevestigen) | `src/pages/Book.tsx` |
| Klantportaal (mijn ritten, km-registratie, boete, annuleren) | `src/pages/Account.tsx` |
| Inloggen / registreren (met verplicht tagnummer) | `src/components/AuthModal.tsx` |
| Alle instellingen (tarief, boete, termijnen, bedrijfsgegevens) | `src/config.ts` |
| Data-laag (Supabase óf demo-modus) | `src/lib/api.ts` |
| Databaseschema + beveiliging | `supabase/migrations/0001_init.sql` |

Zolang er geen Supabase-gegevens in `.env` staan draait de site automatisch in **demo-modus**
(gegevens in de browser, met een demo-account). Zo kun je alles al bekijken en laten zien.

---

## Stap 1 – Lokaal draaien (optioneel)

Vereist: [Node.js](https://nodejs.org) 18 of hoger.

```bash
npm install
npm run dev        # → http://localhost:5173
```

## Stap 2 – Supabase koppelen (de echte database)

1. Maak een account op https://supabase.com (gratis) en klik **New project**.
   Kies een naam, een sterk databasewachtwoord en regio **West EU (Ireland)** of **Central EU (Frankfurt)**.
2. Open in het project **SQL Editor → New query**, plak de volledige inhoud van
   `supabase/migrations/0001_init.sql` en klik **Run**. Dit maakt alle tabellen,
   regels en beveiliging aan.
3. Ga naar **Project Settings → API** en kopieer de **Project URL** en de **anon public key**.
4. Maak een bestand `.env` (kopie van `.env.example`) en vul die twee waarden in.
5. **Authentication → Providers → Email**: laat "Confirm email" aan (klanten bevestigen hun
   e-mailadres) of zet het uit als je dat niet wilt.
   **Authentication → URL Configuration**: zet *Site URL* op het adres van je website.
6. Jezelf beheerder maken: registreer eerst een account via de site, en voer daarna in de
   SQL Editor uit:
   ```sql
   update public.profiles set is_admin = true where email = 'jouw@adres.nl';
   ```

Herstart daarna `npm run dev` – de demo-balk verdwijnt en alles loopt via Supabase.

## Stap 3 – Online zetten (gratis)

**Via GitHub + Vercel (aanbevolen, ook nodig voor Lovable later):**

1. Maak een account op https://github.com en een nieuwe (private) repository, upload deze map
   (zonder `node_modules` en `.env`).
2. Maak een account op https://vercel.com, kies **Add New → Project**, importeer de repository.
3. Bij **Environment Variables** voeg je `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` toe.
4. Klik **Deploy**. Je krijgt een adres als `busverhuur.vercel.app`; een eigen domein koppel je
   onder **Settings → Domains**.

Elke wijziging die je daarna naar GitHub pusht staat automatisch live.

## Stap 4 – Later naar Lovable? (optioneel)

Lovable → **Create new project → Import from GitHub** en kies de repository.
Verbind daarna hetzelfde Supabase-project via de Supabase-integratie. Niets hoeft omgebouwd te worden.

---

## Instellingen aanpassen

- **Tarief, boete, boekingshorizon, registratietermijn:** `src/config.ts` **én** de tabel
  `settings` in Supabase (Table Editor → settings → rij 1). De database is leidend voor de
  regels; de frontend gebruikt `config.ts` voor teksten en berekeningen.
- **Bedrijfsnaam, adres, telefoon, KvK:** `src/config.ts` → `company`.
- **Logo:** vervang het busicoon in `src/components/Layout.tsx` (de `<Icon.Bus />` in de header)
  door een `<img src="/logo.svg" />` en zet het bestand in `public/`.
- **Bus onbeschikbaar maken (onderhoud):** Table Editor → `vehicle_blocks` → rij toevoegen met
  `vehicle_id` en `date`.
- **Boete kwijtschelden:** Table Editor → `bookings` → zet `fine_waived` op `true`.

## Hoe de regels technisch worden afgedwongen

- Max. 14 dagen vooruit, geen dubbele boeking per bus per dag, max. aantal personen,
  rolstoel alleen in de Doblo: gecontroleerd **in de database** (trigger `validate_booking`
  en unieke index), dus ook niet te omzeilen buiten de site om.
- Boete: de functie `register_ride` vergelijkt het registratiemoment met
  `terugbrengtijd + 24 uur` en zet `fine_applied`. Klanten kunnen dit veld niet zelf wijzigen.
- Klanten zien uitsluitend hun eigen boekingen (Row Level Security); de beschikbaarheids-view
  toont anderen alleen "bus X is bezet op datum Y", zonder persoonsgegevens.
- Registratie vereist een tagnummer; dubbele tagnummers worden geweigerd.

## Nog te bouwen (volgende fase)

- E-mails (bevestiging, herinnering, km-reminder, afrekening) – via Resend + Supabase Edge Functions
- Beheerdersdashboard (agenda per bus, openstaande registraties, afrekeningen, klanten beheren)
- Kilometerstand-controle (beginstand moet aansluiten op vorige eindstand) + tellerfoto
- Online betalen (Mollie/iDEAL) in de afrekeningsmail
