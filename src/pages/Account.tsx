import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CONFIG, VEHICLES } from "@/config";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Booking } from "@/lib/supabase";
import { eur, fmtDate, hhmm, hoursLeft, toIso, today } from "@/lib/format";
import { Modal, Notice, Tag, useToast } from "@/components/ui";

type TabKey = "open" | "planned" | "done";

export function Account() {
  const { user, loading, openAuth } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<Booking[]>([]);
  const [tab, setTab] = useState<TabKey>("open");
  const [reg, setReg] = useState<Booking | null>(null);
  const [err, setErr] = useState("");

  const reload = useCallback(() => { if (user) api.myBookings().then(setRows).catch((e) => setErr(e.message)); }, [user]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (!loading && !user) openAuth("login"); }, [loading, user, openAuth]);

  if (loading) return <div className="wrap text-ink2">Laden…</div>;
  if (!user) return <div className="wrap"><div className="panel max-w-[560px]"><h3>Mijn ritten</h3><p className="text-ink2 text-[.92rem] mb-5">Log in om uw ritten te bekijken en kilometers in te vullen.</p><button className="btn btn-primary" onClick={() => openAuth("login")}>Inloggen</button></div></div>;

  const open = rows.filter((b) => b.phase === "open" || b.phase === "overdue");
  const planned = rows.filter((b) => b.phase === "planned").sort((a, b) => (a.date < b.date ? -1 : 1));
  const done = rows.filter((b) => b.phase === "done");
  const hasFine = (b: Booking) => CONFIG.fineEnabled && b.fine_applied && !b.fine_waived;
  const kmYear = done.filter((b) => b.date.startsWith(String(new Date().getFullYear()))).reduce((s, b) => s + (b.km ?? 0), 0);
  const fines = done.filter(hasFine).length;
  const urgent = open[0];
  const cost = (b: Booking) => (b.km ?? 0) * CONFIG.ratePerKm + (hasFine(b) ? CONFIG.fine : 0);

  async function cancel(b: Booking) {
    if (!window.confirm(`Rit ${b.ref} op ${fmtDate(b.date, true)} annuleren?`)) return;
    try { await api.cancelBooking(b.id); toast("Rit " + b.ref + " geannuleerd"); reload(); } catch (e) { toast((e as Error).message); }
  }

  const list = tab === "open" ? open : tab === "planned" ? planned : done;
  const TabBtn = ({ k, label, count, bad }: { k: TabKey; label: string; count: number; bad?: boolean }) => (
    <button onClick={() => setTab(k)} className={`bg-transparent border-0 border-b-2 -mb-px px-3.5 py-2.5 font-bold ${tab === k ? "text-ink border-accent" : "text-ink2 border-transparent"}`}>{label}<span className={`inline-block min-w-5 px-1.5 py-px rounded-full text-[.75rem] ml-1.5 text-center ${bad && count ? "bg-bad text-white" : "bg-surface2"}`}>{count}</span></button>
  );

  return (
    <div className="wrap">
      <div className="flex justify-between items-end gap-5 flex-wrap mb-[26px]">
        <div><span className="eyebrow">Mijn account</span><h2>Goedendag, {user.full_name.split(" ")[0]}</h2><p className="text-ink2 text-[.86rem]">Tagnummer <strong className="num">{user.tag_number}</strong>{user.organisation ? ` · ${user.organisation}` : ""}</p></div>
        <div className="flex gap-2.5 flex-wrap"><Link to="/boeken" className="btn btn-primary">Nieuwe rit boeken</Link><button className="btn btn-ghost" onClick={async () => { await api.signOut(); nav("/"); toast("U bent uitgelogd"); }}>Uitloggen</button></div>
      </div>

      {user.is_blocked && <Notice kind="bad" className="mb-5">Uw account is geblokkeerd. Neem contact met ons op om weer te kunnen boeken.</Notice>}
      {err && <Notice kind="bad" className="mb-5">{err}</Notice>}

      {urgent && (() => { const h = hoursLeft(urgent.deadline_at); const late = h <= 0; return (
        <div className={`grid sm:grid-cols-[1fr_auto] gap-4 items-center p-5 rounded-lg border mb-[22px] ${late ? "bg-badSoft border-bad/40" : "bg-warnSoft border-warn/40"}`}>
          <div><h4 className="text-base font-bold mb-0.5">Rit van {fmtDate(urgent.date, true)} nog registreren</h4>
            <p className="text-[.88rem] text-ink2">{late ? (CONFIG.fineEnabled ? `De termijn van ${CONFIG.deadlineHours} uur is verstreken; er worden ${eur(CONFIG.fine)} administratiekosten gerekend. Vul de rit alsnog in.` : `De termijn van ${CONFIG.deadlineHours} uur is verstreken. Vul de rit alsnog zo snel mogelijk in.`) : <>U heeft nog <strong>{Math.max(1, Math.floor(h))} uur</strong> om chauffeur, bestemming en kilometerstand in te vullen.{CONFIG.fineEnabled && <> Daarna rekenen wij {eur(CONFIG.fine)} administratiekosten.</>}</>}</p></div>
          <button className="btn btn-primary" onClick={() => setReg(urgent)}>Nu invullen</button>
        </div>); })()}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        {[["Te registreren", String(open.length), open.length > 0], ["Geplande ritten", String(planned.length), false], ["Gereden dit jaar", `${kmYear.toLocaleString("nl-NL")} km`, false], ...(CONFIG.fineEnabled ? [["Administratiekosten", `${fines}×`, false]] : [["Afgeronde ritten", String(done.length), false]])].map(([l, v, alert]) => (
          <div key={l as string} className={`border rounded-md px-[18px] py-4 ${alert ? "border-bad bg-badSoft" : "bg-surface border-line"}`}><span className="text-[.78rem] font-bold tracking-[.06em] uppercase text-ink3">{l}</span><b className={`block font-display text-[1.7rem] font-extrabold mt-1 num ${alert ? "text-bad" : ""}`}>{v}</b></div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-line mb-[18px]"><TabBtn k="open" label="Te registreren" count={open.length} bad /><TabBtn k="planned" label="Gepland" count={planned.length} /><TabBtn k="done" label="Afgerond" count={done.length} /></div>

      <div className="overflow-x-auto bg-surface border border-line rounded-lg">
        {list.length === 0 ? (
          <div className="p-10 text-center text-ink2">{tab === "open" ? "Alles is geregistreerd. Zo houden we het graag." : tab === "planned" ? <>Geen geplande ritten. <Link to="/boeken">Boek een rit →</Link></> : "Nog geen afgeronde ritten."}</div>
        ) : (
          <table className="w-full border-collapse text-[.9rem] min-w-[900px]">
            <thead><tr>{["Rit", "Voertuig", "Chauffeur", "Bestemming", "Kilometers", "Bedrag", "Status", ""].map((h, i) => <th key={i} className={`text-left text-[.72rem] tracking-[.08em] uppercase text-ink3 px-4 py-3 border-b border-line font-bold ${i === 4 || i === 5 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>
              {list.map((b) => {
                const v = VEHICLES[b.vehicle_id];
                const h = hoursLeft(b.deadline_at);
                return (
                  <tr key={b.id} className="[&>td]:px-4 [&>td]:py-3.5 [&>td]:border-b [&>td]:border-line last:[&>td]:border-0 align-middle">
                    <td className="whitespace-nowrap"><div className="font-bold">{fmtDate(b.date)}</div><div className="text-[.82rem] text-ink2 num">{hhmm(b.time_from)}–{hhmm(b.time_to)} · {b.ref}</div></td>
                    <td>{v.short}</td>
                    <td>{b.reg_driver_name ?? b.driver_name}</td>
                    <td>{b.reg_destination ?? b.destination}</td>
                    <td className="text-right num">{b.km ? `${b.km} km` : "—"}</td>
                    <td className="text-right num">{b.phase === "done" ? <>{eur(cost(b))}{hasFine(b) && <div className="text-[.82rem] text-ink2">incl. {eur(CONFIG.fine)}</div>}</> : b.phase === "overdue" && CONFIG.fineEnabled ? <>{eur(CONFIG.fine)}<div className="text-[.82rem] text-ink2">+ km volgt</div></> : "—"}</td>
                    <td>{b.phase === "planned" ? <Tag kind="soft">Gepland</Tag> : b.phase === "open" ? <Tag kind="warn">Registratie open · {Math.max(1, Math.floor(h))} u</Tag> : b.phase === "overdue" ? <Tag kind="bad">{CONFIG.fineEnabled ? `Te laat · ${eur(CONFIG.fine)}` : "Nog invullen"}</Tag> : <Tag kind="ok">Afgerond</Tag>}</td>
                    <td className="text-right whitespace-nowrap">
                      {b.phase === "planned" && <button className="btn btn-ghost btn-sm" onClick={() => cancel(b)}>Annuleren</button>}
                      {b.phase === "open" && <button className="btn btn-primary btn-sm" onClick={() => setReg(b)}>Kilometers invullen</button>}
                      {b.phase === "overdue" && <button className="btn btn-brand btn-sm" onClick={() => setReg(b)}>Alsnog invullen</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <section className="grid md:grid-cols-2 gap-5 mt-9">
        <div className="card"><h3>Mijn gegevens</h3>
          <dl className="kv mt-3.5"><dt>Naam</dt><dd>{user.full_name}</dd><dt>E-mail</dt><dd>{user.email}</dd><dt>Telefoon</dt><dd>{user.phone || "—"}</dd><dt>Tagnummer</dt><dd className="num">{user.tag_number}</dd><dt>Organisatie</dt><dd>{user.organisation || "—"}</dd></dl>
          <p className="text-[.82rem] text-ink3 mt-4">Gegevens wijzigen? Neem <Link to="/contact">contact</Link> met ons op.</p></div>
        <div className="card"><h3>Hoe registreer ik een rit?</h3>
          <p className="text-ink2 text-[.88rem] mt-2.5">Na afloop van elke rit vult u binnen {CONFIG.deadlineHours} uur in: <strong>naam chauffeur, bestemming, datum</strong> en de begin- en eindstand van de kilometerteller. Wij berekenen automatisch de kilometers en sturen de afrekening per e-mail.</p>
          <p className="text-ink2 text-[.88rem] mt-2.5">Tip: maak bij vertrek en terugkomst een foto van de kilometerteller, dan heeft u de standen altijd bij de hand.</p></div>
      </section>

      {reg && <RegisterModal b={reg} onClose={() => setReg(null)} onDone={() => { setReg(null); setTab("done"); reload(); }} />}
    </div>
  );
}

function RegisterModal({ b, onClose, onDone }: { b: Booking; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const v = VEHICLES[b.vehicle_id];
  const late = b.phase === "overdue";
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const km = start && end && +end > +start ? +end - +start : 0;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) { setErr("Vul alle verplichte velden in."); f.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    if (+end <= +start) { setErr("De eindstand moet hoger zijn dan de beginstand."); return; }
    if (+end - +start > 1500) { setErr("Meer dan 1500 km op één rit? Controleer de standen."); return; }
    setErr(""); setBusy(true);
    try {
      const r = await api.registerRide({ bookingId: b.id, driver: d.driver, destination: d.destination, date: d.date, startKm: +start, endKm: +end, notes: d.notes || undefined });
      toast(`Rit geregistreerd: ${r.km} km · ${eur((r.km ?? 0) * CONFIG.ratePerKm + (CONFIG.fineEnabled && r.fine_applied ? CONFIG.fine : 0))}`);
      onDone();
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title="Rit registreren" sub={`${v.name} · boeking ${b.ref}`} labelledBy="reg-title">
      {late && CONFIG.fineEnabled && <Notice kind="bad" className="mb-[18px]">Deze rit wordt later dan {CONFIG.deadlineHours} uur na afloop geregistreerd. Er wordt <strong>{eur(CONFIG.fine)} administratiekosten</strong> bij de afrekening opgeteld.</Notice>}
      <form onSubmit={submit} noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="field req"><span>Naam chauffeur</span><input name="driver" required defaultValue={b.driver_name} /></label>
          <label className="field req"><span>Datum rit</span><input name="date" type="date" required defaultValue={b.date} max={toIso(today())} /></label>
          <label className="field req sm:col-span-2"><span>Bestemming</span><input name="destination" required defaultValue={b.destination} /></label>
          <label className="field req"><span>Beginstand teller (km)</span><input type="number" inputMode="numeric" required min={0} value={start} onChange={(e) => setStart(e.target.value)} placeholder="bijv. 48262" /></label>
          <label className="field req"><span>Eindstand teller (km)</span><input type="number" inputMode="numeric" required min={0} value={end} onChange={(e) => setEnd(e.target.value)} placeholder="bijv. 48380" /></label>
          <label className="field sm:col-span-2"><span>Bijzonderheden <span className="hint">(optioneel)</span></span><textarea name="notes" rows={2} placeholder="Schade, storing, tankbeurt, gevonden voorwerpen…" /></label>
          <div className="sm:col-span-2 bg-surface2 rounded-md px-4 py-3.5 grid grid-cols-3 gap-2.5 text-center">
            {[["Gereden", km ? `${km} km` : "— km"], ["Tarief", `${eur(CONFIG.ratePerKm)}/km`], ["Afrekening", km ? eur(km * CONFIG.ratePerKm + (late && CONFIG.fineEnabled ? CONFIG.fine : 0)) : "—"]].map(([l, v]) => <div key={l}><span className="block text-[.72rem] uppercase tracking-[.06em] text-ink3 font-bold">{l}</span><b className="font-display text-[1.3rem] num">{v}</b></div>)}
          </div>
          <label className="flex gap-2.5 items-start text-[.9rem] text-ink2 sm:col-span-2"><input type="checkbox" name="truth" required className="mt-1" /><span>Ik verklaar deze gegevens naar waarheid te hebben ingevuld.</span></label>
        </div>
        {err && <p className="err mt-3">{err}</p>}
        <div className="flex justify-end gap-2.5 mt-5"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuleren</button><button className="btn btn-primary" disabled={busy}>{busy ? "Opslaan…" : "Registratie opslaan"}</button></div>
      </form>
    </Modal>
  );
}
