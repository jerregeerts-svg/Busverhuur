import { Link } from "react-router-dom";
import { CONFIG, type VehicleInfo } from "@/config";
import { eur } from "@/lib/format";
import { BusArt, Icon, Modal, Tag } from "./ui";
import { PhotoBus } from "./PhotoBus";

/** Informatievenster per bus: specificaties, waar hij geschikt voor is en praktische punten. */
export function VehicleDetails({ v, open, onClose, toon = false }: { v: VehicleInfo; open: boolean; onClose: () => void; toon?: boolean }) {
  const art = toon && v.toon ? { p: v.toon, toon: true } : v.photo ? { p: v.photo, toon: false } : v.toon ? { p: v.toon, toon: true } : null;
  return (
    <Modal open={open} onClose={onClose} title={v.name} sub={v.tagline} labelledBy={`veh-${v.id}-title`} wide>
      <div className="aspect-[2/1] relative overflow-hidden rounded-md bg-gradient-to-b from-surface2 to-brandSoft mb-5">
        {art ? <PhotoBus photo={art.p} toon={art.toon} alt={v.name} /> : <BusArt wide={v.seats > 5} wheelchair={v.wheelchair} />}
        <span className="absolute top-3 left-3"><Tag kind="brand">{v.wheelchair ? "Rolstoelbus" : `${v.seats} personen`}</Tag></span>
      </div>

      <p className="text-ink2 text-[.95rem]">{v.details.intro}</p>

      <div className="grid sm:grid-cols-2 gap-x-7 gap-y-5 mt-6">
        <section>
          <h4 className="eyebrow mb-2.5">Specificaties</h4>
          <ul className="flex flex-col gap-2 text-[.9rem]">
            {v.specs.map((s, i) => {
              const neg = i === 1 && !v.wheelchair;
              const I = neg ? Icon.X : Icon.Check;
              return <li key={s} className="flex gap-2 items-start text-ink2"><I className={`w-4 h-4 shrink-0 mt-0.5 ${neg ? "text-bad" : "text-brand"}`} /><span>{s}</span></li>;
            })}
          </ul>
        </section>
        <section>
          <h4 className="eyebrow mb-2.5">Ideaal voor</h4>
          <ul className="flex flex-col gap-2 text-[.9rem]">
            {v.details.good.map((s) => <li key={s} className="flex gap-2 items-start text-ink2"><Icon.Check className="w-4 h-4 shrink-0 mt-0.5 text-brand" /><span>{s}</span></li>)}
          </ul>
        </section>
      </div>

      <section className="mt-6">
        <h4 className="eyebrow mb-2.5">Goed om te weten</h4>
        <ul className="flex flex-col gap-2 text-[.9rem]">
          {v.details.notes.map((s) => <li key={s} className="flex gap-2 items-start text-ink2"><Icon.Info className="w-4 h-4 shrink-0 mt-0.5 text-brand" /><span>{s}</span></li>)}
        </ul>
      </section>

      <section className="mt-6 bg-surface2 border border-line rounded-md p-4">
        <h4 className="eyebrow mb-2.5">Wat kost het?</h4>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-display font-extrabold text-[1.5rem] num">{eur(CONFIG.ratePerKm)}</span>
          <span className="text-ink2 text-[.9rem]">per gereden kilometer — geen dagtarief, geen borg.</span>
        </div>
        <p className="text-[.88rem] text-ink2 mt-2">U vult na de rit de kilometerstand in en ziet meteen wat de rit heeft gekost. De afrekening volgt daarna per factuur. Online boekt u tot {CONFIG.horizonDays} dagen vooruit; kosteloos annuleren tot {CONFIG.cancelHours} uur voor vertrek.</p>
      </section>

      <div className="flex gap-3 flex-wrap justify-end mt-6 pt-5 border-t border-line">
        <Link to="/tarieven" className="btn btn-ghost" onClick={onClose}>Tarieven en afspraken</Link>
        <Link to={`/boeken?v=${v.id}`} className="btn btn-brand" onClick={onClose}>Boek de {v.short}</Link>
      </div>
    </Modal>
  );
}
