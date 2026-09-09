import { useRef, type MouseEvent } from "react";

export interface BusPhoto {
  /** Uitgesneden bus (transparante achtergrond) */
  body: string;
  /** Beeldverhouding breedte/hoogte van de body-afbeelding */
  ratio: number;
  /** Losse wielen, positie in % van de body-breedte/-hoogte, straal in % van de breedte */
  wheels: { src: string; x: number; y: number; r: number }[];
}

/** Voorbijtrekkend landschap (twee helften voor een naadloze lus). */
function Scenery({ moving }: { moving: boolean }) {
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
export function PhotoBus({ photo, driving = false, alt }: { photo: BusPhoto; driving?: boolean; alt: string }) {
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
    <div className={`pb ${driving ? "driving" : ""} absolute inset-0 overflow-hidden`} onMouseMove={onMove} onMouseLeave={onLeave}>
      <Scenery moving={driving} />
      <div className="absolute left-0 right-0 bottom-[14%] h-px pb-road" />
      <div ref={stage} className="pb-stage absolute inset-0">
        <div className="pb-bus absolute left-1/2 bottom-[9%] w-[78%]" style={{ aspectRatio: String(photo.ratio) }}>
          <div className="pb-shadow" />
          <img src={photo.body} alt={alt} className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" draggable={false} />
          {photo.wheels.map((w, i) => (
            <img key={i} src={w.src} alt="" aria-hidden="true" draggable={false} className="pb-wheel absolute select-none pointer-events-none"
              style={{ left: `${w.x - w.r}%`, top: `calc(${w.y}% - ${w.r}% * ${photo.ratio})`, width: `${w.r * 2}%`, aspectRatio: "1" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
