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
        <div className="bg-surface border border-line rounded-lg p-[22px] shadow-card a-up a-d3 a-float">
          <span className="eyebrow">Snel boeken</span>
          <h3 className="mb-1">Beschikbaarheid bekijken</h3>
          <p className="text-[.86rem] text-ink2">Kies een bus en een datum, wij tonen direct wat vrij is.</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <label className="field col-span-2"><span>Voertuig</span>
              <select value={veh} onChange={(e) => setVeh(e.target.value)}>
                {Object.values(VEHICLES).map((v) => <option key={v.id} value={v.id}>{v.short} · {v.seats} personen{v.wheelchair ? " · rolstoelbus" : ""}</option>)}
              </select></label>
            <label className="field"><span>Datum</span><input type="date" value={date} min={toIso(today())} max={max} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="field"><span>Ophalen om</span><select value={time} onChange={(e) => setTime(e.target.value)}>{CONFIG.times.map((t) => <option key={t}>{t}</option>)}</select></label>
            <button className="btn btn-brand col-span-2" onClick={go}>Beschikbaarheid bekijken →</button>
          </div>
          <p className="text-[.86rem] text-ink2 mt-3">Verder dan {CONFIG.horizonDays} dagen vooruit? <Link to="/contact?reden=lange-termijn">Vraag het aan via het contactformulier.</Link></p>
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
        <Reveal className="flex flex-col gap-2 mb-7 max-w-[640px]"><span className="eyebrow">Zo werkt het</span><h2>Van boeking tot afrekening in vier stappen.</h2></Reveal>
        <Reveal stagger className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            ["Account aanmaken", "Registreer eenmalig met uw gegevens en tagnummer. Daarna boekt u in een minuut."],
            ["Rit boeken", `Kies bus, datum en tijd tot ${CONFIG.horizonDays} dagen vooruit. U krijgt direct een bevestiging per e-mail.`],
            ["Rijden", "Haal de bus op, noteer de beginstand en geniet van de rit."],
            ["Kilometers invullen, kosten zien", "Na de rit vult u chauffeur, bestemming en kilometerstand in en ziet u meteen wat de rit kost. Geen verrassingen achteraf."],
          ].map(([t, d], i) => (
            <div key={t} className="pt-3.5">
              <span className="block font-display font-extrabold text-[2rem] text-accent mb-1.5 step-num">{String(i + 1).padStart(2, "0")}</span>
              <h4 className="text-[1.02rem] font-bold mb-1.5">{t}</h4><p className="text-[.9rem] text-ink2">{d}</p>
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
