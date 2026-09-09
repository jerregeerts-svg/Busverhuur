import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CONFIG } from "@/config";
import { eur } from "@/lib/format";
import { Icon } from "@/components/ui";
import { CountUp, Reveal } from "@/components/Reveal";

/** Getal dat soepel naar een nieuwe waarde toe beweegt. */
function useTween(target: number, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target); const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    const start = performance.now(), a = from.current;
    cancelAnimationFrame(raf.current);
    const tick = (t: number) => { const p = Math.min(1, (t - start) / ms); const e = 1 - Math.pow(1 - p, 3); const n = a + (target - a) * e; setV(n); from.current = n; if (p < 1) raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return v;
}

const MAX_KM = 600;
const EXAMPLES: [string, number][] = [["Ziekenhuis heen en terug", 40], ["Dagje Efteling", 120], ["Strand Scheveningen", 220], ["Weekend Ardennen", 520]];

export function Pricing() {
  const [km, setKm] = useState(120);
  const [moving, setMoving] = useState(false);
  const shown = useTween(km);
  const cost = useTween(km * CONFIG.ratePerKm);
  const t = useRef(0);
  const onKm = (n: number) => { setKm(n); setMoving(true); window.clearTimeout(t.current); t.current = window.setTimeout(() => setMoving(false), 700); };
  const pct = Math.min(100, Math.max(0, (km / MAX_KM) * 100));

  return (
    <div className="wrap">
      <div className="flex flex-col gap-2 mb-7 max-w-[640px]">
        <span className="eyebrow a-up">Tarieven</span>
        <h2 className="a-up a-d1">Eén tarief, geen verrassingen.</h2>
        <p className="text-ink2 a-up a-d2">U betaalt achteraf op basis van de gereden kilometers. De afrekening ontvangt u per e-mail nadat u de rit heeft geregistreerd.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="price-hero bg-brand text-brandInk rounded-lg p-7 relative overflow-hidden a-up a-d2">
          <span className="eyebrow text-brandInk opacity-80 relative">Kilometertarief</span>
          <div className="font-display text-[3.4rem] font-extrabold leading-none mt-2 relative"><CountUp to={CONFIG.ratePerKm} decimals={2} prefix="€ " duration={1600} /> <small className="font-body font-semibold text-base opacity-85">/ km</small></div>
          <ul className="mt-[18px] flex flex-col gap-2 text-[.92rem] list-none p-0 relative">
            {["Geldt voor beide bussen", "Geen dagtarief, geen borg, geen reserveringskosten", "Verzekering en pechhulp inbegrepen", "Achteraf betalen op factuur"].map((tx, i) => (
              <li key={tx} className="flex gap-2.5 items-start a-up" style={{ animationDelay: `${0.5 + i * 0.12}s` }}><span className="check-pop" style={{ animationDelay: `${0.6 + i * 0.12}s` }}><Icon.Check className="w-4 h-4 shrink-0 mt-[3px]" /></span>{tx}</li>
            ))}
          </ul>
        </div>

        <div className="card a-up a-d3">
          <h3>Reken uw rit uit</h3>
          <p className="text-[.86rem] text-ink2 mt-1">Schuif naar het aantal kilometers dat u verwacht te rijden (heen en terug), of kies een voorbeeld.</p>

          {/* Rijdende bus op een weg die meebeweegt met de slider */}
          <div className="relative h-[54px] mt-5 mb-1 select-none" aria-hidden="true">
            <div className="absolute left-0 right-0 bottom-[10px] h-[3px] bg-line rounded-full" />
            <div className="absolute left-0 bottom-[10px] h-[3px] bg-brand rounded-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
            <div className="absolute left-0 right-0 bottom-[7px] road-marks" />
            <div className="absolute bottom-[8px] transition-[left] duration-300 ease-out" style={{ left: `calc(${pct}% - 22px)` }}>
              <svg viewBox="0 0 44 24" width="44" height="24" className={`mini-bus ${moving ? "moving" : ""}`}>
                <rect x="1" y="2" width="42" height="15" rx="4" className="fill-brand" />
                <rect x="5" y="5" width="20" height="7" rx="2" className="fill-brandSoft" />
                <path d="M27 5h8l5 5v2H27z" className="fill-brandSoft" />
                <g className="wheel"><circle cx="11" cy="18" r="4.5" className="fill-ink" /><circle cx="11" cy="18" r="1.8" className="fill-surface2" /><path d="M11 13.5v2M11 20.5v2M6.5 18h2M13.5 18h2" className="stroke-surface2" strokeWidth=".9" /></g>
                <g className="wheel"><circle cx="34" cy="18" r="4.5" className="fill-ink" /><circle cx="34" cy="18" r="1.8" className="fill-surface2" /><path d="M34 13.5v2M34 20.5v2M29.5 18h2M36.5 18h2" className="stroke-surface2" strokeWidth=".9" /></g>
              </svg>
            </div>
          </div>

          <div className="flex justify-between font-bold"><span>Kilometers</span><span className="num text-brand">{Math.round(shown)} km</span></div>
          <input type="range" min={10} max={MAX_KM} step={10} value={km} onChange={(e) => onKm(+e.target.value)} className="w-full accent-brand" aria-label="Aantal kilometers" />
          <div className="flex gap-1.5 flex-wrap mt-2">
            {EXAMPLES.map(([l, n]) => <button key={l} type="button" onClick={() => onKm(n)} className={`tag border transition ${km === n ? "bg-brand text-brandInk border-brand" : "bg-surface border-line text-ink2 hover:border-brand hover:text-ink"}`}>{l} · {n} km</button>)}
          </div>
          <div className="flex justify-between items-baseline py-3.5 border-t border-line mt-4">
            <span className="text-ink2">Geschatte kosten</span>
            <span className={`font-display font-extrabold text-[1.9rem] num transition-transform duration-300 ${moving ? "scale-105 text-brand" : ""}`}>{eur(cost)}</span>
          </div>
          <p className="text-[.86rem] text-ink2">Oftewel {eur(CONFIG.ratePerKm * 100)} per 100 km, all-in verzekerd. Vergelijk dat eens met twee personenauto's, brandstof en parkeren.</p>
        </div>
      </div>

      <section className="mt-[72px]">
        <Reveal className="flex flex-col gap-2 mb-7"><span className="eyebrow">Huisregels</span><h2>Waar u op moet letten</h2></Reveal>
        <Reveal stagger className="grid md:grid-cols-3 gap-5">
          {[
            ["Ritregistratie verplicht", <>Na elke rit vult u in uw account de <strong>naam van de chauffeur, de bestemming, de datum</strong> en de begin- en eindstand van de kilometerteller in.</>],
            ...(CONFIG.fineEnabled ? [[`${eur(CONFIG.fine)} bij niet registreren`, <>Wordt de rit niet binnen {CONFIG.deadlineHours} uur na afloop geregistreerd, dan brengen wij {eur(CONFIG.fine)} administratiekosten per rit in rekening, bovenop de gereden kilometers.</>] as const] : [[`Binnen ${CONFIG.deadlineHours} uur invullen`, <>Registreer de rit binnen {CONFIG.deadlineHours} uur na de terugbrengtijd. Zo blijft de afrekening kloppend en kan de volgende klant direct op pad.</>] as const]),
            [`Maximaal ${CONFIG.horizonDays} dagen vooruit`, <>Online boekt u tot twee weken vooruit. Ritten verder in de toekomst vraagt u aan via het <Link to="/contact?reden=lange-termijn">contactformulier</Link>; wij bevestigen die persoonlijk.</>],
          ].map(([tt, d], i) => (
            <div key={i} className="rule relative py-1 pl-[18px]"><span className="rule-bar" /><h4 className="text-base font-bold mb-1.5">{tt}</h4><p className="text-[.9rem] text-ink2">{d}</p></div>
          ))}
        </Reveal>
      </section>

      <section className="mt-[72px]">
        <Reveal stagger className="grid md:grid-cols-3 gap-5">
          {[
            ["Annuleren", `Kosteloos annuleren tot ${CONFIG.cancelHours} uur voor de ophaaltijd, rechtstreeks vanuit uw account.`],
            ["Brandstof", "Vol ophalen, vol terugbrengen. Niet volgetankt? Dan rekenen wij de brandstof plus € 15 tankkosten."],
            ["Betalen", "Na de ritregistratie ontvangt u de afrekening per e-mail. Betalen kan via bankoverschrijving binnen 14 dagen."],
          ].map(([tt, d]) => <div key={tt} className="card lift"><h3>{tt}</h3><p className="text-ink2 mt-2">{d}</p></div>)}
        </Reveal>
      </section>
    </div>
  );
}
