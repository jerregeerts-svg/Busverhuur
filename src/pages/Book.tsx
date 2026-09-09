import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CONFIG, VEHICLES, type VehicleId } from "@/config";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Booking } from "@/lib/supabase";
import { DOW, MON, addDays, eur, fmtDate, toIso, today } from "@/lib/format";
import { Icon, Notice, useToast } from "@/components/ui";

interface Wiz { step: 1 | 2 | 3 | 4; vehicle: VehicleId; date: string | null; from: string; to: string; driver: string; dest: string; estKm: string; pers: string; wheelchair: boolean; notes: string; agree: boolean }

export function Book() {
  const { user, loading, openAuth } = useAuth();
  const [sp] = useSearchParams();
  const toast = useToast();
  const v0 = (sp.get("v") as VehicleId) in VEHICLES ? (sp.get("v") as VehicleId) : "doblo";
  const [w, setW] = useState<Wiz>({ step: 1, vehicle: v0, date: sp.get("d"), from: sp.get("t") ?? "10:00", to: "18:00", driver: "", dest: "", estKm: "", pers: "", wheelchair: false, notes: "", agree: false });
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  const v = VEHICLES[w.vehicle];
  const up = (p: Partial<Wiz>) => setW((x) => ({ ...x, ...p }));

  useEffect(() => { api.getAvailability(w.vehicle).then(setBusyDates).catch(() => setBusyDates([])); }, [w.vehicle, user]);
  useEffect(() => { if (w.date && busyDates.includes(w.date)) up({ date: null }); }, [busyDates]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => Array.from({ length: CONFIG.horizonDays + 1 }, (_, i) => addDays(today(), i)), []);
  const firstPad = (today().getDay() + 6) % 7;
  const est = w.estKm ? Number(w.estKm) * CONFIG.ratePerKm : null;

  if (loading) return <div className="wrap text-ink2">Laden…</div>;

  if (!user) {
    return (
      <div className="wrap">
        <div className="flex flex-col gap-2 mb-7"><span className="eyebrow">Rit boeken</span><h2>Plan uw rit</h2></div>
        <div className="panel max-w-[620px]">
          <h3>Log in om te boeken</h3>
          <p className="text-ink2 text-[.92rem] mb-5">Ritten worden gekoppeld aan uw account, zodat u achteraf eenvoudig uw kilometers kunt invullen en uw afrekeningen terugvindt.</p>
          <div className="flex gap-3 flex-wrap"><button className="btn btn-primary" onClick={() => openAuth("login")}>Inloggen</button><button className="btn btn-ghost" onClick={() => openAuth("register")}>Account aanmaken</button></div>
          <p className="text-[.86rem] text-ink2 mt-4">Nog geen account? Registreren duurt een minuut. Houd uw tagnummer bij de hand.</p>
        </div>
      </div>
    );
  }

  async function confirm() {
    if (!w.agree) { setErr("Ga akkoord met de huisregels om te boeken."); return; }
    setErr(""); setSaving(true);
    try {
      const b = await api.createBooking({ vehicle_id: w.vehicle, date: w.date!, time_from: w.from, time_to: w.to, driver_name: w.driver.trim(), destination: w.dest.trim(), passengers: w.pers ? Number(w.pers) : null, wheelchair: w.wheelchair, notes: w.notes.trim() || null });
      setDone(b); up({ step: 4 }); toast("Rit geboekt: " + b.ref);
    } catch (ex) { setErr((ex as Error).message); api.getAvailability(w.vehicle).then(setBusyDates); } finally { setSaving(false); }
  }

  const stepClass = (i: number) => `flex-1 h-1 rounded-sm ${i < w.step ? "bg-brand" : i === w.step ? "bg-accent" : "bg-line"}`;

  return (
    <div className="wrap">
      <div className="flex flex-col gap-2 mb-7"><span className="eyebrow">Rit boeken</span><h2>Plan uw rit</h2></div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-7 items-start">
        <div>
          <div className="flex gap-1.5 mb-6"><span className={stepClass(1)} /><span className={stepClass(2)} /><span className={stepClass(3)} /></div>
          <div className="panel">
            {w.step === 1 && (
              <>
                <h3 className="mb-1">Bus en datum</h3><p className="text-ink2 text-[.92rem] mb-5">Kies een bus en een dag. Online boekt u tot {CONFIG.horizonDays} dagen vooruit.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.values(VEHICLES).map((x) => (
                    <button key={x.id} type="button" onClick={() => up({ vehicle: x.id, wheelchair: false })} className={`border-[1.5px] rounded-md p-3.5 text-left flex flex-col gap-1.5 ${x.id === w.vehicle ? "border-brand bg-brandSoft" : "border-lineStrong bg-surface hover:border-brand"}`}>
                      <b className="font-display text-[1.05rem]">{x.name}</b><span className="text-[.84rem] text-ink2">{x.seats} personen incl. bestuurder{x.wheelchair ? " · rolstoelbus" : " · geen rolstoelvervoer"}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-[22px] flex justify-between items-baseline flex-wrap gap-2"><strong>Datum</strong><span className="text-[.84rem] text-ink2">{fmtDate(toIso(today()), true)} – {fmtDate(toIso(addDays(today(), CONFIG.horizonDays)), true)}</span></div>
                <div className="grid grid-cols-7 gap-1.5 mt-2">
                  {[...DOW.slice(1), DOW[0]].map((d) => <div key={d} className="text-[.7rem] font-bold tracking-[.08em] uppercase text-ink3 text-center py-1">{d}</div>)}
                  {Array.from({ length: firstPad }).map((_, i) => <div key={"p" + i} />)}
                  {days.map((d, i) => {
                    const s = toIso(d), busy = busyDates.includes(s), sel = s === w.date;
                    return (
                      <button key={s} type="button" disabled={busy} onClick={() => up({ date: s })} aria-label={`${fmtDate(s, true)}${busy ? ", bezet" : ""}`}
                        className={`aspect-square border rounded-lg flex flex-col items-center justify-center gap-0.5 font-semibold text-[.92rem] relative ${sel ? "bg-brand text-brandInk border-brand" : "bg-surface border-line text-ink hover:border-brand"} ${busy ? "opacity-40 cursor-not-allowed bg-surface2" : ""} ${i === 0 ? "ring-2 ring-inset ring-accentSoft" : ""}`}>
                        <span>{d.getDate()}</span><small className={`text-[.62rem] font-semibold ${sel ? "opacity-80" : "text-ink3"}`}>{i === 0 ? "vandaag" : MON[d.getMonth()]}</small>
                        {busy && <span className="absolute bottom-1.5 w-[5px] h-[5px] rounded-full bg-bad" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-[.78rem] text-ink2 mt-2.5 flex-wrap"><span><i className="inline-block w-2 h-2 rounded-full bg-bad mr-1.5 align-middle" />Bezet voor deze bus</span><span><i className="inline-block w-2 h-2 rounded-full bg-brand mr-1.5 align-middle" />Geselecteerd</span></div>
                <div className="grid grid-cols-2 gap-3 mt-[18px]">
                  <label className="field"><span>Ophalen om</span><select value={w.from} onChange={(e) => { const from = e.target.value; const to = w.to <= from ? CONFIG.times[Math.min(CONFIG.times.indexOf(from) + 2, CONFIG.times.length - 1)] : w.to; up({ from, to }); }}>{CONFIG.times.map((t) => <option key={t}>{t}</option>)}</select></label>
                  <label className="field"><span>Terugbrengen om</span><select value={w.to} onChange={(e) => up({ to: e.target.value })}>{CONFIG.times.filter((t) => t > w.from).map((t) => <option key={t}>{t}</option>)}</select></label>
                </div>
                <Notice className="mt-[18px]">Later dan {fmtDate(toIso(addDays(today(), CONFIG.horizonDays)))}? Stuur dan een <Link to="/contact?reden=lange-termijn">aanvraag via het contactformulier</Link>; wij bevestigen die persoonlijk.</Notice>
                <div className="flex justify-end mt-6 pt-5 border-t border-line"><button className="btn btn-primary" disabled={!w.date} onClick={() => up({ step: 2 })}>Verder: ritgegevens →</button></div>
              </>
            )}

            {w.step === 2 && (
              <>
                <h3 className="mb-1">Ritgegevens</h3><p className="text-ink2 text-[.92rem] mb-5">Deze gegevens staan straks al klaar bij de ritregistratie na afloop.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="field req"><span>Naam chauffeur</span><input value={w.driver || user.full_name} onChange={(e) => up({ driver: e.target.value })} /><span className="hint">Degene die daadwerkelijk rijdt (rijbewijs B).</span></label>
                  <label className="field req"><span>Bestemming</span><input value={w.dest} onChange={(e) => up({ dest: e.target.value })} placeholder="Plaats of adres" /></label>
                  <label className="field"><span>Verwachte kilometers <span className="hint">(optioneel)</span></span><input type="number" min={1} inputMode="numeric" value={w.estKm} onChange={(e) => up({ estKm: e.target.value })} placeholder="Bijv. 120" /><span className="hint">Alleen voor een prijsindicatie; u betaalt de werkelijk gereden km.</span></label>
                  <label className="field"><span>Aantal personen</span><input type="number" min={1} max={v.seats} value={w.pers || v.seats} onChange={(e) => up({ pers: e.target.value })} /><span className="hint">Max. {v.seats} incl. bestuurder in de {v.short}.</span></label>
                  {v.wheelchair && <label className="flex gap-2.5 items-start text-[.9rem] text-ink2 sm:col-span-2"><input type="checkbox" checked={w.wheelchair} onChange={(e) => up({ wheelchair: e.target.checked })} className="mt-1" /><span>Er reist een rolstoelgebruiker mee (wij leggen de oprijplaat en het vastzetsysteem klaar).</span></label>}
                  <label className="field sm:col-span-2"><span>Opmerkingen <span className="hint">(optioneel)</span></span><textarea rows={2} value={w.notes} onChange={(e) => up({ notes: e.target.value })} placeholder="Bijv. kinderzitje nodig, later ophalen…" /></label>
                </div>
                {err && <p className="err mt-3">{err}</p>}
                <div className="flex justify-between mt-6 pt-5 border-t border-line gap-3">
                  <button className="btn btn-ghost" onClick={() => up({ step: 1 })}>← Terug</button>
                  <button className="btn btn-primary" onClick={() => { const driver = w.driver || user.full_name; if (!driver.trim() || !w.dest.trim()) { setErr("Naam chauffeur en bestemming zijn verplicht."); return; } setErr(""); up({ step: 3, driver, pers: w.pers || String(v.seats) }); }}>Verder: controleren →</button>
                </div>
              </>
            )}

            {w.step === 3 && (
              <>
                <h3 className="mb-1">Controleren en bevestigen</h3><p className="text-ink2 text-[.92rem] mb-5">Controleer de gegevens. Na bevestiging staat de rit direct in uw account.</p>
                <dl className="kv">
                  <dt>Voertuig</dt><dd>{v.name} · {w.pers} pers.{w.wheelchair ? " · rolstoelgebruiker mee" : ""}</dd>
                  <dt>Datum</dt><dd>{fmtDate(w.date!, true)}</dd>
                  <dt>Tijd</dt><dd>{w.from} – {w.to}</dd>
                  <dt>Chauffeur</dt><dd>{w.driver}</dd>
                  <dt>Bestemming</dt><dd>{w.dest}</dd>
                  <dt>Tagnummer</dt><dd className="num">{user.tag_number}</dd>
                  {w.notes && <><dt>Opmerking</dt><dd>{w.notes}</dd></>}
                </dl>
                <Notice kind="info" className="mt-[22px]">Na de rit vult u in uw account de kilometerstand in (graag <strong>binnen {CONFIG.deadlineHours} uur na {w.to}</strong>). U ziet dan meteen wat de rit heeft gekost.{CONFIG.fineEnabled && <> Wordt de rit niet ingevuld, dan rekenen wij {eur(CONFIG.fine)} administratiekosten.</>}</Notice>
                <label className="flex gap-2.5 items-start text-[.9rem] text-ink2 mt-[18px]"><input type="checkbox" checked={w.agree} onChange={(e) => up({ agree: e.target.checked })} className="mt-1" /><span>Ik ga akkoord met de <Link to="/tarieven">tarieven en afspraken</Link>, en vul na de rit zelf de kilometerstand in.</span></label>
                {err && <p className="err mt-3">{err}</p>}
                <div className="flex justify-between mt-6 pt-5 border-t border-line gap-3">
                  <button className="btn btn-ghost" onClick={() => up({ step: 2 })}>← Terug</button>
                  <button className="btn btn-primary" disabled={saving} onClick={confirm}>{saving ? "Bezig…" : "Rit definitief boeken"}</button>
                </div>
              </>
            )}

            {w.step === 4 && done && (
              <div className="text-center py-7 px-2">
                <div className="w-16 h-16 mx-auto mb-[18px] rounded-full bg-okSoft text-ok grid place-items-center"><Icon.Check className="w-8 h-8" /></div>
                <h3 className="text-[1.6rem]">Uw rit is geboekt</h3>
                <p className="text-ink2 mt-2">Boekingsnummer</p><div className="font-display font-extrabold text-[1.3rem] tracking-[.04em] num">{done.ref}</div>
                <p className="text-ink2 mt-4 max-w-[38em] mx-auto">De boeking staat in uw account onder <strong>Mijn ritten</strong>. Vul na de rit uw kilometerstand in en zie meteen wat de rit heeft gekost.</p>
                <div className="flex gap-3 justify-center mt-6 flex-wrap"><Link to="/account" className="btn btn-brand">Naar mijn ritten</Link><button className="btn btn-ghost" onClick={() => { setDone(null); setW({ step: 1, vehicle: "doblo", date: null, from: "10:00", to: "18:00", driver: "", dest: "", estKm: "", pers: "", wheelchair: false, notes: "", agree: false }); }}>Nog een rit boeken</button></div>
              </div>
            )}
          </div>
        </div>

        <aside className="bg-surface border border-line rounded-lg p-[22px] lg:sticky lg:top-[86px]">
          <span className="eyebrow">Uw boeking</span><h3 className="mt-1">{v.name}</h3>
          <p className="text-[.86rem] text-ink2">{v.seats} personen incl. bestuurder{v.wheelchair ? " · rolstoelbus" : ""}</p>
          <dl className="mt-3.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[.9rem]">
            <dt className="text-ink2">Datum</dt><dd className="font-semibold text-right">{w.date ? fmtDate(w.date, true) : "—"}</dd>
            <dt className="text-ink2">Tijd</dt><dd className="font-semibold text-right">{w.from} – {w.to}</dd>
            {w.driver && <><dt className="text-ink2">Chauffeur</dt><dd className="font-semibold text-right">{w.driver}</dd></>}
            {w.dest && <><dt className="text-ink2">Bestemming</dt><dd className="font-semibold text-right">{w.dest}</dd></>}
            <dt className="text-ink2">Tarief</dt><dd className="font-semibold text-right num">{eur(CONFIG.ratePerKm)} / km</dd>
          </dl>
          <div className="border-t border-line mt-3.5 pt-3.5 flex justify-between items-baseline"><span className="text-ink2 text-[.86rem]">{est ? `Indicatie bij ${w.estKm} km` : "Te betalen"}</span><span className="font-display font-extrabold text-[1.4rem] num">{est ? eur(est) : "achteraf"}</span></div>
          <p className="text-[.86rem] text-ink2 mt-2">Geen borg of reserveringskosten. Afrekening volgt na uw ritregistratie.</p>
        </aside>
      </div>
    </div>
  );
}
