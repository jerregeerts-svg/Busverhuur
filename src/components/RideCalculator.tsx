import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CONFIG, VEHICLES, type VehicleId } from "@/config";
import { eur } from "@/lib/format";
import { Icon } from "./ui";

/** Getal dat soepel naar een nieuwe waarde toe beweegt. */
function useTween(target: number, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    const start = performance.now(), a = from.current;
    cancelAnimationFrame(raf.current);
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms); const e = 1 - Math.pow(1 - p, 3);
      const n = a + (target - a) * e; setV(n); from.current = n;
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return v;
}

const SLIDER_MAX = 600;   // bereik van de schuif
const TYPED_MAX = 2000;   // wat u maximaal mag intypen

const clamp = (n: number) => Math.min(TYPED_MAX, Math.max(1, Math.round(n)));

/**
 * Rekenhulp: kilometers intypen of schuiven, voorbeeldritten, bus kiezen,
 * en direct de totaal- en per-persoonprijs zien.
 */
export function RideCalculator() {
  const [km, setKm] = useState(120);
  const [typed, setTyped] = useState("120");      // ruwe tekst in het invoerveld
  const [vehicle, setVehicle] = useState<VehicleId>("doblo");
  const [moving, setMoving] = useState(false);
  const timer = useRef(0);

  const v = VEHICLES[vehicle];
  const total = km * CONFIG.ratePerKm;
  const shownKm = useTween(km);
  const shownTotal = useTween(total);
  const shownPp = useTween(total / v.seats);
  const pct = Math.min(100, (km / SLIDER_MAX) * 100);

  function apply(n: number) {
    const c = clamp(n);
    setKm(c); setTyped(String(c));
    setMoving(true); window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMoving(false), 700);
  }
  function onType(raw: string) {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 4);
    setTyped(digits);
    if (digits) apply(Number(digits));
  }
  function onBlur() { if (!typed) { setTyped(String(km)); } }

  return (
    <div className="card a-up a-d3">
      {/* Bus / aantal personen */}
      <div>
        <span className="text-[.78rem] font-semibold uppercase tracking-[.08em] text-ink3">Met welke bus rijdt u?</span>
        <div className="grid grid-cols-2 gap-2 mt-2" role="radiogroup" aria-label="Bus">
          {Object.values(VEHICLES).map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={vehicle === x.id} onClick={() => setVehicle(x.id)}
              className={`calc-veh ${vehicle === x.id ? "is-on" : ""}`}>
              <span className="font-bold">{x.short}</span>
              <span className="text-[.8rem] opacity-80">{x.seats} personen{x.wheelchair ? " · rolstoelbus" : ""}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 mt-5">
        <div>
          <h3>Reken uw rit uit</h3>
          <p className="text-[.86rem] text-ink2 mt-1">Kies uw bus en vul in hoeveel kilometer u verwacht te rijden (heen en terug).</p>
        </div>
        <span className="tag bg-brandSoft text-brand shrink-0 hidden sm:inline-flex">{eur(CONFIG.ratePerKm)} / km</span>
      </div>

      {/* Afstand: intypen én schuiven */}
      <div className="mt-5">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <label htmlFor="calc-km" className="text-[.84rem] font-semibold text-ink2">Afstand</label>
          <div className="calc-km-input">
            <input id="calc-km" type="text" inputMode="numeric" pattern="[0-9]*" value={typed}
              onChange={(e) => onType(e.target.value)} onBlur={onBlur}
              onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); apply(km + 10); } if (e.key === "ArrowDown") { e.preventDefault(); apply(km - 10); } }}
              aria-describedby="calc-km-hint" />
            <span>km</span>
          </div>
        </div>

        {/* Weg met meerijdend busje, gekoppeld aan de schuif */}
        <div className="relative h-[46px] mt-2 select-none" aria-hidden="true">
          <div className="absolute left-0 right-0 bottom-[9px] h-[3px] bg-line rounded-full" />
          <div className="absolute left-0 bottom-[9px] h-[3px] bg-brand rounded-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
          <div className="absolute left-0 right-0 bottom-[6px] road-marks" />
          <div className="absolute bottom-[7px] transition-[left] duration-300 ease-out" style={{ left: `calc(${pct}% - 20px)` }}>
            <svg viewBox="0 0 44 24" width="40" height="22" className={`mini-bus ${moving ? "moving" : ""}`}>
              <rect x="1" y="2" width="42" height="15" rx="4" className="fill-brand" />
              <rect x="5" y="5" width="20" height="7" rx="2" className="fill-brandSoft" />
              <path d="M27 5h8l5 5v2H27z" className="fill-brandSoft" />
              <g className="wheel"><circle cx="11" cy="18" r="4.5" className="fill-ink" /><circle cx="11" cy="18" r="1.8" className="fill-surface2" /></g>
              <g className="wheel"><circle cx="34" cy="18" r="4.5" className="fill-ink" /><circle cx="34" cy="18" r="1.8" className="fill-surface2" /></g>
            </svg>
          </div>
        </div>
        <input type="range" min={10} max={SLIDER_MAX} step={10} value={Math.min(km, SLIDER_MAX)} onChange={(e) => apply(+e.target.value)} className="w-full accent-brand" aria-label="Aantal kilometers" />
        <div className="flex justify-between text-[.74rem] text-ink3 num -mt-1"><span>10 km</span><span>{SLIDER_MAX} km{km > SLIDER_MAX ? " +" : ""}</span></div>
        <p id="calc-km-hint" className="sr-only">Typ een afstand in kilometers of gebruik de schuif. Pijltje omhoog of omlaag past met 10 kilometer aan.</p>
      </div>

      {/* Afrekening */}
      <dl className="calc-sum mt-5">
        <dt>{Math.round(shownKm)} km × {eur(CONFIG.ratePerKm)}</dt><dd className="num">{eur(shownTotal)}</dd>
        <dt>Per persoon bij {v.seats} inzittenden</dt><dd className="num">{eur(shownPp)}</dd>
        <dt className="calc-total">Geschatte kosten</dt>
        <dd className={`calc-total num ${moving ? "is-moving" : ""}`}>{eur(shownTotal)}</dd>
      </dl>
      <p className="text-[.82rem] text-ink2 mt-1 flex gap-1.5 items-start"><Icon.Shield className="w-4 h-4 shrink-0 mt-[2px] text-brand" />Inclusief verzekering en pechhulp. U betaalt alleen de werkelijk gereden kilometers, achteraf op factuur.</p>

      <Link to={`/boeken?v=${vehicle}`} className="btn btn-primary w-full mt-4">Rit boeken</Link>
      <p className="text-[.8rem] text-ink3 text-center mt-2">Vrijblijvend reserveren — kosteloos annuleren tot {CONFIG.cancelHours} uur van tevoren.</p>
    </div>
  );
}
