import { Link } from "react-router-dom";
import { CONFIG } from "@/config";
import { eur } from "@/lib/format";
import { Icon } from "@/components/ui";
import { CountUp, Reveal } from "@/components/Reveal";
import { RideCalculator } from "@/components/RideCalculator";

export function Pricing() {
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

        <RideCalculator />
      </div>

      <section className="mt-[72px]">
        <Reveal className="flex flex-col gap-2 mb-7 max-w-[640px]"><span className="eyebrow">Zo werkt het</span><h2>Altijd duidelijk wat u rijdt en betaalt.</h2><p className="text-ink2">Geen schattingen, geen naheffingen: u vult zelf de tellerstand in en ziet meteen het bedrag.</p></Reveal>
        <Reveal stagger className="grid md:grid-cols-3 gap-5">
          {[
            ["U vult zelf de kilometers in", <>Na de rit noteert u in uw account de <strong>chauffeur, bestemming, datum</strong> en de begin- en eindstand van de teller. Dat kost een halve minuut, gewoon op uw telefoon.</>],
            ...(CONFIG.fineEnabled ? [[`${eur(CONFIG.fine)} bij niet registreren`, <>Wordt de rit niet binnen {CONFIG.deadlineHours} uur na afloop geregistreerd, dan brengen wij {eur(CONFIG.fine)} administratiekosten per rit in rekening, bovenop de gereden kilometers.</>] as const] : [["Direct inzicht in de kosten", <>Zodra u de standen invult, ziet u meteen de gereden kilometers en het bedrag. Graag binnen {CONFIG.deadlineHours} uur na de rit, dan klopt het overzicht ook voor de volgende chauffeur.</>] as const]),
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
