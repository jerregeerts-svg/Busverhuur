import { VEHICLES } from "@/config";
import { VehicleCard } from "@/components/VehicleCard";

export function Vehicles() {
  return (
    <div className="wrap">
      <div className="flex flex-col gap-2 mb-7 max-w-[640px]"><span className="eyebrow">Voertuigen</span><h2>Onze bussen</h2><p className="text-ink2">Beide bussen zijn schoon, goed onderhouden en all-risk verzekerd. Rijden mag met een gewoon rijbewijs B.</p></div>
      <div className="grid md:grid-cols-2 gap-6">{Object.values(VEHICLES).map((v) => <VehicleCard key={v.id} v={v} />)}</div>
      <section className="mt-[72px]">
        <div className="mb-7"><h2>Inbegrepen bij elke huur</h2></div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ["Verzekering & pechhulp", "All-risk verzekerd met eigen risico. Pechhulp in Nederland is inbegrepen, 24 uur per dag."],
            ["Volle tank bij vertrek", "U ontvangt de bus met een volle tank en levert hem vol weer in. Brandstof is dus niet inbegrepen in de kilometerprijs."],
            ["Schoon & gecontroleerd", "Voor elke rit wordt de bus gecontroleerd en schoongemaakt. Eventuele schade wordt vooraf vastgelegd."],
          ].map(([t, d]) => <div key={t} className="card"><h3>{t}</h3><p className="text-ink2 mt-2">{d}</p></div>)}
        </div>
      </section>
    </div>
  );
}
