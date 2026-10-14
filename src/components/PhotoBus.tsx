import { useRef, type MouseEvent } from "react";

/** Zet een absoluut pad ("/img/x.webp") om naar het juiste pad onder de huidige basis-URL. */
const withBase = (p: string) => (p.startsWith("/") ? import.meta.env.BASE_URL.replace(/\/$/, "") + p : p);

export interface BusPhoto {
  /** Uitgesneden bus (transparante achtergrond) */
  body: string;
  /** Beeldverhouding breedte/hoogte van de body-afbeelding */
  ratio: number;
  /** Losse wielen, positie in % van de body-breedte/-hoogte, straal in % van de breedte */
  wheels: { src: string; x: number; y: number; r: number }[];
}

/** Voorbijtrekkend landschap (twee helften voor een naadloze lus). */
function Scenery({ moving, toon = false }: { moving: boolean; toon?: boolean }) {
  if (toon) {
    const half = (
      <g>
        <g fill="#ffffff" opacity=".95"><ellipse cx="80" cy="42" rx="30" ry="11" /><ellipse cx="100" cy="34" rx="20" ry="12" /><ellipse cx="62" cy="40" rx="16" ry="9" /><ellipse cx="330" cy="30" rx="34" ry="12" /><ellipse cx="352" cy="22" rx="22" ry="13" /><ellipse cx="308" cy="28" rx="18" ry="10" /></g>
        <path d="M0 132 C70 112 130 118 200 130 S330 106 420 128 S480 124 500 132 V200 H0 Z" fill="#7cc36b" />
        <path d="M0 150 C80 138 160 146 240 152 S380 136 500 150 V200 H0 Z" fill="#5ea94f" />
        <path d="M0 168 C100 160 200 168 300 166 S430 158 500 168 V200 H0 Z" fill="#4c9a3f" />
      </g>
    );
    return (
      <svg viewBox="0 0 500 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs><linearGradient id="toonSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4aa6e8" /><stop offset="1" stopColor="#bfe3fb" /></linearGradient></defs>
        <rect width="500" height="200" fill="url(#toonSky)" />
        <g className={`pb-scenery ${moving ? "moving" : ""}`}>{half}<g transform="translate(500 0)">{half}</g></g>
        <rect y="176" width="500" height="24" fill="#5b5f66" />
        <g className={`pb-toon-road ${moving ? "moving" : ""}`} stroke="#f4f4f4" strokeWidth="3" strokeDasharray="26 26"><line x1="-52" y1="188" x2="1000" y2="188" /></g>
      </svg>
    );
  }
  const half = (
    <g>
      <path d="M0 150 C60 112 110 118 160 142 S260 96 330 140 S420 118 500 150 V200 H0 Z" className="fill-brand" opacity=".10" />
      <path d="M0 165 C50 140 120 150 180 160 S300 135 380 158 S450 150 500 165 V200 H0 Z" className="fill-brandSoft" opacity=".9" />
      <g className="fill-brand" opacity=".22">
        <path d="M60 158 l9 -26 l9 26 z M74 158 l6 -15 l6 15 z" /><path d="M240 158 l8 -20 l8 20 z" /><path d="M400 158 l10 -30 l10 30 z M416 158 l7 -16 l7 16 z" />
      </g>
      <g className="fill-surface" opacity=".95"><ellipse cx="110" cy="40" rx="22" ry="8" /><ellipse cx="126" cy="36" rx="14" ry="7" /><ellipse cx="360" cy="26" rx="20" ry="7" /><ellipse cx="376" cy="22" rx="12" ry="6" /></g>
    </g>
  );
  return (
    <svg viewBox="0 0 500 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <g className={`pb-scenery ${moving ? "moving" : ""}`}>{half}<g transform="translate(500 0)">{half}</g></g>
    </svg>
  );
}

/**
 * Echte foto van de bus in een 3D-scène: kantelt mee met de muis, wielen draaien,
 * landschap trekt voorbij. `driving` = voortdurend rijden; anders eenmalig binnenrijden.
 */
export function PhotoBus({ photo, driving = false, alt, toon = false }: { photo: BusPhoto; driving?: boolean; alt: string; toon?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = stage.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * 16}deg`);
    el.style.setProperty("--rx", `${-py * 8}deg`);
  }
  function onLeave() { const el = stage.current; if (!el) return; el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); }

  return (
    <div className={`pb ${driving ? "driving" : ""} ${toon ? "toon" : ""} absolute inset-0 overflow-hidden`} onMouseMove={onMove} onMouseLeave={onLeave}>
      <Scenery moving={driving} toon={toon} />
      {!toon && <div className="absolute left-0 right-0 bottom-[14%] h-px pb-road" />}
      <div ref={stage} className="pb-stage absolute inset-0">
        <div className="pb-bus absolute left-1/2 bottom-[9%] w-[78%]" style={{ aspectRatio: String(photo.ratio) }}>
          <div className="pb-shadow" />
          <img src={withBase(photo.body)} alt={alt} className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" draggable={false} />
          {photo.wheels.map((w, i) => (
            <div key={i} aria-hidden="true" className="pb-wheel-wrap absolute select-none pointer-events-none"
              style={{ left: `${w.x - w.r}%`, top: `calc(${w.y}% - ${w.r}% * ${photo.ratio})`, width: `${w.r * 2}%`, aspectRatio: "1" }}>
              <img src={withBase(w.src)} alt="" draggable={false} className="pb-wheel pb-wheel-ghost absolute inset-0 w-full h-full" />
              <img src={withBase(w.src)} alt="" draggable={false} className="pb-wheel absolute inset-0 w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
