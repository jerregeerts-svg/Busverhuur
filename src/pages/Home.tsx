import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CONFIG, VEHICLES } from "@/config";
import { addDays, eur, toIso, today } from "@/lib/format";
import { Icon, Notice } from "@/components/ui";
import { VehicleCard } from "@/components/VehicleCard";
import { CountUp, Reveal } from "@/components/Reveal";

export function Home() {
  const nav = useNavigate();
  const [veh, setVeh] = useState("doblo");
  const [date, setDate] = useState(toIso(addDays(today(), 2)));
  const [time, setTime] = useState("10:00");
  const max = toIso(addDays(today(), CONFIG.horizonDays));
  const selectedVehicle = Object.values(VEHICLES).find((v) => v.id === veh);
  const dateLabel = date ? new Date(date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" }) : "";

  function go() {
    if (date > max || date < toIso(today())) { nav("/contact?reden=lange-termijn"); return; }
    nav(`/boeken?v=${veh}&d=${date}&t=${encodeURIComponent(time)}`);
  }

  const usps = [
    { I: Icon.Calendar, t: "Online boeken, 24/7", d: "Kies uw bus, datum en tijd. U ziet direct wat beschikbaar is en ontvangt meteen een bevestiging." },
    { I: Icon.Clock, t: "Eerlijke kilometerprijs", d: "Geen dagtarief of borg. U betaalt achteraf alleen de kilometers die op de teller staan." },
    { I: Icon.User, t: "Toegankelijk vervoer", d: "De Doblo is een volwaardige rolstoelbus met oprijplaat en vastzetsysteem." },
    { I: Icon.Shield, t: "Eigen account", d: "U ziet altijd precies wat u rijdt en betaalt: al uw ritten, kilometers en afrekeningen in uw eigen overzicht." },
  ];

  return (
    <div className="wrap">
      <section className="grid md:grid-cols-[1.15fr_.85fr] gap-12 items-center">
        <div>
          <span className="eyebrow a-up">Busverhuur · personenvervoer · rolstoelvervoer</span>
          <h1 className="mt-3 a-up a-d1">Een bus huren, zo geregeld als een rit plannen.</h1>
          <p className="text-[1.12rem] max-w-[34em] text-ink2 mt-[18px] a-up a-d2">Boek online een 5-persoons rolstoelbus of een 9-persoonsbus. U betaalt alleen de kilometers die u rijdt: <strong>{eur(CONFIG.ratePerKm)} per kilometer</strong>, geen dagtarief, geen borg.</p>
          <div className="flex gap-3 mt-7 flex-wrap a-up a-d3">
            <Link to="/boeken" className="btn btn-primary btn-pulse">Rit boeken</Link>
            <Link to="/voertuigen" className="btn btn-ghost">Bekijk de bussen</Link>
          </div>
          <div className="flex gap-7 mt-9 pt-6 border-t border-line flex-wrap a-up a-d4">
            <div><b className="block font-display text-[1.5rem] font-extrabold"><CountUp to={CONFIG.ratePerKm} decimals={2} prefix="€ " /></b><span className="text-[.84rem] text-ink2">per gereden kilometer</span></div>
            <div><b className="block font-display text-[1.5rem] font-extrabold num">5 – 9</b><span className="text-[.84rem] text-ink2">personen incl. bestuurder</span></div>
            <div><b className="block font-display text-[1.5rem] font-extrabold"><CountUp to={CONFIG.horizonDays} suffix=" dagen" /></b><span className="text-[.84rem] text-ink2">online vooruit te boeken</span></div>
          </div>
        </div>
        <div className="bg-surface border border-line rounded-lg shadow-card overflow-hidden a-up a-d3 a-float">
          <div className="flex items-center gap-3 px-[22px] py-4 bg-brand text-brandInk">
            <span className="grid place-items-center w-10 h-10 rounded-md bg-white/15 shrink-0"><Icon.Bus className="w-5 h-5" /></span>
            <div className="min-w-0">
              <span className="block text-[.7rem] font-bold tracking-[.14em] uppercase opacity-80">Snel boeken</span>
              <h3 className="leading-tight">Beschikbaarheid bekijken</h3>
            </div>
            <span className="ml-auto hidden sm:inline-flex items-center whitespace-nowrap text-[.74rem] font-bold bg-white/15 px-2.5 py-1 rounded-full">{selectedVehicle?.seats} personen</span>
          </div>

          <div className="p-[22px]">
            <p className="text-[.86rem] text-ink2">Kies een bus en een datum, wij tonen direct wat vrij is.</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <label className="field col-span-2"><span>Voertuig</span>
                <select value={veh} onChange={(e) => setVeh(e.target.value)}>
                  {Object.values(VEHICLES).map((v) => <option key={v.id} value={v.id}>{v.short} · {v.seats} personen{v.wheelchair ? " · rolstoelbus" : ""}</option>)}
                </select></label>
              <label className="field"><span>Datum</span><input type="date" value={date} min={toIso(today())} max={max} onChange={(e) => setDate(e.target.value)} /></label>
              <label className="field"><span>Ophalen om</span><select value={time} onChange={(e) => setTime(e.target.value)}>{CONFIG.times.map((t) => <option key={t}>{t}</option>)}</select></label>
            </div>

            <div className="flex items-center gap-2.5 mt-4 px-3 py-2.5 rounded-md bg-brandSoft text-[.87rem] font-semibold text-ink">
              <Icon.Check className="w-4 h-4 text-brand shrink-0" />
              <span className="truncate">{selectedVehicle?.short} · {dateLabel} · {time} uur</span>
            </div>

            <button className="btn btn-brand w-full mt-3 py-[13px] text-[1rem]" onClick={go}>Beschikbaarheid bekijken →</button>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[.78rem] font-semibold text-ink2">
              <span className="inline-flex items-center gap-1.5"><Icon.Check className="w-3.5 h-3.5 text-ok" />Direct bevestiging</span>
              <span className="inline-flex items-center gap-1.5"><Icon.Check className="w-3.5 h-3.5 text-ok" />Geen borg</span>
              <span className="inline-flex items-center gap-1.5"><Icon.Check className="w-3.5 h-3.5 text-ok" />Betalen achteraf</span>
            </div>

            <p className="text-[.8rem] text-ink3 mt-3">Verder dan {CONFIG.horizonDays} dagen vooruit? <Link to="/contact?reden=lange-termijn">Vraag het aan via het contactformulier.</Link></p>
          </div>
        </div>
      </section>

      <section className="mt-[72px]">
        <Reveal stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {usps.map(({ I, t, d }) => (
            <div key={t} className="bg-surface p-[22px] usp-tile">
              <div className="w-[38px] h-[38px] rounded-[9px] bg-brandSoft text-brand grid place-items-center usp-icon"><I className="w-5 h-5" /></div>
              <h4 className="text-base mt-2.5 mb-1 font-bold">{t}</h4><p className="text-[.88rem] text-ink2">{d}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mt-[72px]">
        <Reveal className="flex flex-col gap-2 mb-7 max-w-[640px]"><span className="eyebrow">Onze bussen</span><h2>Twee bussen, voor elk gezelschap de juiste.</h2></Reveal>
        <Reveal stagger className="grid md:grid-cols-2 gap-6">{Object.values(VEHICLES).map((v) => <VehicleCard key={v.id} v={v} driving />)}</Reveal>
      </section>

      <section className="mt-[72px]">
        <Reveal className="flex flex-col gap-2 mb-8 max-w-[640px]"><span className="eyebrow">Zo werkt het</span><h2>Van boeking tot afrekening in vier stappen.</h2></Reveal>
        <Reveal stagger className="steps grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { I: Icon.User, t: "Account aanmaken", d: "Registreer eenmalig met uw gegevens en tagnummer. Daarna boekt u in een minuut." },
            { I: Icon.Calendar, t: "Rit boeken", d: `Kies bus, datum en tijd tot ${CONFIG.horizonDays} dagen vooruit. U krijgt direct een bevestiging per e-mail.` },
            { I: Icon.Bus, t: "Rijden", d: "Haal de bus op, noteer de beginstand en geniet van de rit." },
            { I: Icon.Check, t: "Kilometers invullen, kosten zien", d: "Na de rit vult u chauffeur, bestemming en kilometerstand in en ziet u meteen wat de rit kost. Geen verrassingen achteraf." },
          ].map(({ I, t, d }, i) => (
            <div key={t} className="step-card">
              <span className="step-sheen" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3">
                <span className="step-badge num">{String(i + 1).padStart(2, "0")}</span>
                <span className="step-icon"><I className="w-[18px] h-[18px]" /></span>
              </div>
              <h4 className="step-title">{t}</h4>
              <p className="step-desc">{d}</p>
            </div>
          ))}
        </Reveal>
        <Notice kind="info" className="mt-7 max-w-[720px] reveal is-in"><strong>Altijd inzicht:</strong> vul na elke rit binnen {CONFIG.deadlineHours} uur chauffeur, bestemming, datum en kilometerstand in — u ziet altijd precies wat u rijdt en betaalt, geen verrassingen achteraf.{CONFIG.fineEnabled && <> Niet geregistreerd? Dan rekenen wij <strong>{eur(CONFIG.fine)} administratiekosten per rit</strong>.</>}</Notice>
      </section>

      <Reveal as="section" className="mt-[72px]">
        <div className="rounded-lg p-6 flex justify-between items-center gap-5 flex-wrap bg-brand text-brandInk">
          <div><h3 className="text-[1.4rem]">Rit verder dan twee weken vooruit?</h3><p className="opacity-85 mt-1">Voor uitjes, evenementen of vaste ritten later in het jaar plannen wij graag persoonlijk met u mee.</p></div>
          <Link to="/contact?reden=lange-termijn" className="btn btn-primary">Aanvraag versturen</Link>
        </div>
      </Reveal>
    </div>
  );
}
