import { useState } from "react";
import { Link } from "react-router-dom";
import { CONFIG } from "@/config";
import { eur } from "@/lib/format";
import { Icon } from "@/components/ui";

export function Pricing() {
  const [km, setKm] = useState(120);
  return (
    <div className="wrap">
      <div className="flex flex-col gap-2 mb-7 max-w-[640px]"><span className="eyebrow">Tarieven</span><h2>Eén tarief, geen verrassingen.</h2><p className="text-ink2">U betaalt achteraf op basis van de gereden kilometers. De afrekening ontvangt u per e-mail nadat u de rit heeft geregistreerd.</p></div>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="bg-brand text-brandInk rounded-lg p-7">
          <span className="eyebrow text-brandInk opacity-80">Kilometertarief</span>
          <div className="font-display text-[3.4rem] font-extrabold leading-none mt-2 num">{eur(CONFIG.ratePerKm)} <small className="font-body font-semibold text-base opacity-85">/ km</small></div>
          <ul className="mt-[18px] flex flex-col gap-2 text-[.92rem] list-none p-0">
            {["Geldt voor beide bussen", "Geen dagtarief, geen borg, geen reserveringskosten", "Verzekering en pechhulp inbegrepen", "Achteraf betalen op factuur"].map((t) => (
              <li key={t} className="flex gap-2.5 items-start"><Icon.Check className="w-4 h-4 shrink-0 mt-[3px]" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Reken uw rit uit</h3>
          <p className="text-[.86rem] text-ink2 mt-1">Schuif naar het aantal kilometers dat u verwacht te rijden (heen en terug).</p>
          <div className="mt-5 flex justify-between font-bold"><span>Kilometers</span><span className="num">{km} km</span></div>
          <input type="range" min={10} max={600} step={10} value={km} onChange={(e) => setKm(+e.target.value)} className="w-full accent-brand" aria-label="Aantal kilometers" />
          <div className="flex justify-between items-baseline py-3.5 border-t border-line mt-3.5"><span className="text-ink2">Geschatte kosten</span><span className="font-display font-extrabold text-[1.4rem] num">{eur(km * CONFIG.ratePerKm)}</span></div>
          <p className="text-[.86rem] text-ink2">Voorbeeld: een dagje uit van 120 km kost {eur(120 * CONFIG.ratePerKm)}. Vergelijk dat eens met twee personenauto's.</p>
        </div>
      </div>

      <section className="mt-[72px]">
        <div className="flex flex-col gap-2 mb-7"><span className="eyebrow">Huisregels</span><h2>Waar u op moet letten</h2></div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ["Ritregistratie verplicht", <>Na elke rit vult u in uw account de <strong>naam van de chauffeur, de bestemming, de datum</strong> en de begin- en eindstand van de kilometerteller in.</>],
            ...(CONFIG.fineEnabled ? [[`${eur(CONFIG.fine)} bij niet registreren`, <>Wordt de rit niet binnen {CONFIG.deadlineHours} uur na afloop geregistreerd, dan brengen wij {eur(CONFIG.fine)} administratiekosten per rit in rekening, bovenop de gereden kilometers.</>] as const] : [[`Binnen ${CONFIG.deadlineHours} uur invullen`, <>Registreer de rit binnen {CONFIG.deadlineHours} uur na de terugbrengtijd. Zo blijft de afrekening kloppend en kan de volgende klant direct op pad.</>] as const]),
            [`Maximaal ${CONFIG.horizonDays} dagen vooruit`, <>Online boekt u tot twee weken vooruit. Ritten verder in de toekomst vraagt u aan via het <Link to="/contact?reden=lange-termijn">contactformulier</Link>; wij bevestigen die persoonlijk.</>],
          ].map(([t, d], i) => (
            <div key={i} className="border-l-[3px] border-accent py-1 pl-[18px]"><h4 className="text-base font-bold mb-1.5">{t}</h4><p className="text-[.9rem] text-ink2">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mt-[72px]">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ["Annuleren", `Kosteloos annuleren tot ${CONFIG.cancelHours} uur voor de ophaaltijd, rechtstreeks vanuit uw account.`],
            ["Brandstof", "Vol ophalen, vol terugbrengen. Niet volgetankt? Dan rekenen wij de brandstof plus € 15 tankkosten."],
            ["Betalen", "Na de ritregistratie ontvangt u de afrekening per e-mail. Betalen kan via bankoverschrijving binnen 14 dagen."],
          ].map(([t, d]) => <div key={t} className="card"><h3>{t}</h3><p className="text-ink2 mt-2">{d}</p></div>)}
        </div>
      </section>
    </div>
  );
}
