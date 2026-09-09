import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CONFIG, VEHICLES } from "@/config";
import { api } from "@/lib/api";
import { addDays, toIso, today } from "@/lib/format";
import { Icon, Notice } from "@/components/ui";

export function Contact() {
  const [sp] = useSearchParams();
  const [reden, setReden] = useState(sp.get("reden") ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const lt = reden === "lange-termijn";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) { setErr("Vul alle verplichte velden (*) in."); f.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    if (lt && !d.datum) { setErr("Vul de gewenste datum in."); return; }
    setErr(""); setBusy(true);
    try {
      await api.sendContact({
        name: d.naam, email: d.email, phone: d.tel || undefined, subject: d.reden, message: d.bericht,
        wanted_date: lt ? d.datum : undefined, vehicle_id: lt ? d.voertuig : undefined,
        time_from: lt ? d.van : undefined, time_to: lt ? d.tot : undefined, destination: lt ? d.bestemming : undefined,
      });
      setSent(true);
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="wrap">
      <div className="flex flex-col gap-2 mb-7 max-w-[640px]"><span className="eyebrow">Contact</span><h2>Vraag of aanvraag? Wij reageren binnen één werkdag.</h2></div>
      <div className="grid md:grid-cols-[1fr_360px] gap-7 items-start">
        {sent ? (
          <div className="panel text-center py-10">
            <div className="w-16 h-16 mx-auto mb-[18px] rounded-full bg-okSoft text-ok grid place-items-center"><Icon.Check className="w-8 h-8" /></div>
            <h3 className="text-[1.5rem]">Bedankt, uw bericht is verstuurd</h3>
            <p className="text-ink2 mt-2.5 max-w-[36em] mx-auto">{lt ? `Wij hebben uw aanvraag voor een rit later dan ${CONFIG.horizonDays} dagen vooruit ontvangen en bevestigen binnen één werkdag per e-mail of de bus beschikbaar is.` : "Wij reageren binnen één werkdag."}</p>
            <Link to="/" className="btn btn-ghost mt-[22px]">Terug naar home</Link>
          </div>
        ) : (
          <form className="panel" onSubmit={submit} noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="field req"><span>Naam</span><input required name="naam" autoComplete="name" /></label>
              <label className="field req"><span>E-mailadres</span><input required type="email" name="email" autoComplete="email" /></label>
              <label className="field"><span>Telefoon</span><input type="tel" name="tel" autoComplete="tel" /></label>
              <label className="field req"><span>Onderwerp</span>
                <select name="reden" required value={reden} onChange={(e) => setReden(e.target.value)}>
                  <option value="">Kies een onderwerp</option>
                  <option value="lange-termijn">Boeking verder dan {CONFIG.horizonDays} dagen vooruit</option>
                  <option value="vraag">Algemene vraag</option>
                  <option value="factuur">Vraag over een afrekening of rit</option>
                  <option value="schade">Schade of storing melden</option>
                  <option value="anders">Anders</option>
                </select></label>
              {lt && (
                <div className="sm:col-span-2">
                  <Notice className="mb-4">Voor ritten verder dan {CONFIG.horizonDays} dagen vooruit nemen wij uw aanvraag in behandeling en bevestigen wij per e-mail. Uw aanvraag is pas definitief na onze bevestiging.</Notice>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="field req"><span>Gewenste datum</span><input type="date" name="datum" min={toIso(addDays(today(), CONFIG.horizonDays + 1))} /></label>
                    <label className="field req"><span>Voertuig</span><select name="voertuig">{Object.values(VEHICLES).map((v) => <option key={v.id} value={v.id}>{v.short} · {v.seats} personen{v.wheelchair ? " · rolstoelbus" : ""}</option>)}<option value="geen-voorkeur">Geen voorkeur</option></select></label>
                    <label className="field"><span>Ophalen om</span><input type="time" name="van" defaultValue="09:00" /></label>
                    <label className="field"><span>Terug om</span><input type="time" name="tot" defaultValue="18:00" /></label>
                    <label className="field sm:col-span-2"><span>Bestemming</span><input name="bestemming" placeholder="Bijv. Efteling, Kaatsheuvel" /></label>
                  </div>
                </div>
              )}
              <label className="field req sm:col-span-2"><span>Bericht</span><textarea required name="bericht" rows={5} placeholder="Waarmee kunnen wij u helpen?" /></label>
              <label className="flex gap-2.5 items-start text-[.9rem] text-ink2 sm:col-span-2"><input type="checkbox" required name="privacy" className="mt-1" /><span>Ik ga akkoord met de verwerking van mijn gegevens om deze aanvraag af te handelen.</span></label>
            </div>
            {err && <p className="err mt-3">{err}</p>}
            <div className="mt-[22px] flex gap-3 items-center flex-wrap"><button className="btn btn-primary" disabled={busy}>{busy ? "Versturen…" : "Versturen"}</button></div>
          </form>
        )}
        <div className="flex flex-col gap-[18px]">
          <div className="card">
            <h3>Contactgegevens</h3>
            <div className="flex flex-col gap-[18px] mt-4">
              {[[Icon.Phone, "Telefoon", `${CONFIG.company.phone} · ma t/m za 8:00–20:00`], [Icon.Mail, "E-mail", CONFIG.company.email], [Icon.Pin, "Ophaallocatie", `${CONFIG.company.address} · parkeren op eigen terrein`]].map(([I, t, d], i) => {
                const Ic = I as typeof Icon.Phone;
                return <div key={i} className="flex gap-3 items-start"><div className="w-[38px] h-[38px] shrink-0 rounded-[9px] bg-brandSoft text-brand grid place-items-center"><Ic className="w-5 h-5" /></div><div><b className="block text-[.9rem]">{t as string}</b><span className="text-[.88rem] text-ink2">{d as string}</span></div></div>;
              })}
            </div>
          </div>
          <Notice>Rit binnen {CONFIG.horizonDays} dagen? Die boekt u sneller <Link to="/boeken">direct online</Link>.</Notice>
        </div>
      </div>
    </div>
  );
}
