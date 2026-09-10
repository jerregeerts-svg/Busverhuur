import { Link } from "react-router-dom";
import { CONFIG, type VehicleInfo } from "@/config";
import { eur } from "@/lib/format";
import { BusArt, Icon, Tag } from "./ui";
import { PhotoBus } from "./PhotoBus";

export function VehicleCard({ v, driving = false, toon = false }: { v: VehicleInfo; driving?: boolean; toon?: boolean }) {
  /** Op de voertuigenpagina de getekende stijl, elders de echte foto. */
  const art = toon && v.toon ? { p: v.toon, toon: true } : v.photo ? { p: v.photo, toon: false } : v.toon ? { p: v.toon, toon: true } : null;
  return (
    <article className="vcard bg-surface border border-line rounded-lg overflow-hidden flex flex-col">
      <div className={`aspect-[2/1] grid place-items-center relative overflow-hidden ${driving || v.photo ? "bg-gradient-to-b from-surface2 to-brandSoft" : "bg-gradient-to-br from-brandSoft to-surface2"}`}>
        {art ? <PhotoBus photo={art.p} driving={driving} toon={art.toon} alt={v.name} /> : <BusArt wide={v.seats > 5} wheelchair={v.wheelchair} driving={driving} />}
        <span className="absolute top-3.5 left-3.5"><Tag kind="brand">{v.wheelchair ? "Rolstoelbus" : `${v.seats} personen`}</Tag></span>
      </div>
      <div className="p-[22px] flex flex-col gap-3.5 flex-1">
        <div><span className="eyebrow">{v.tagline}</span><h3 className="text-[1.4rem] mt-1">{v.name}</h3></div>
        <p className="text-ink2 text-[.88rem]">{v.desc}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[.9rem]">
          {v.specs.map((s, i) => {
            const neg = i === 1 && !v.wheelchair;
            const I = neg ? Icon.X : Icon.Check;
            return <div key={s} className="flex gap-2 items-center text-ink2"><I className={`w-4 h-4 shrink-0 ${neg ? "text-bad" : "text-brand"}`} /><span>{s}</span></div>;
          })}
        </div>
        <div className="mt-auto flex justify-between items-center pt-3.5 border-t border-line">
          <div className="font-display font-extrabold text-[1.4rem] num">{eur(CONFIG.ratePerKm)} <small className="font-body font-semibold text-[.8rem] text-ink2">/ km</small></div>
          <Link to={`/boeken?v=${v.id}`} className="btn btn-brand btn-sm">Boek de {v.short}</Link>
        </div>
      </div>
    </article>
  );
}
