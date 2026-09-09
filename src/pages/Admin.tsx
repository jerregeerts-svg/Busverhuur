import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CONFIG, VEHICLES, applySettings, type VehicleId } from "@/config";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AdminBooking, ContactRequest, Profile, Settings, VehicleBlock } from "@/lib/supabase";
import { DOW, MON, addDays, eur, fmtDate, hhmm, hoursLeft, toIso, today } from "@/lib/format";
import { Modal, Notice, Tag, useToast } from "@/components/ui";

type TabKey = "agenda" | "registraties" | "ritten" | "klanten" | "aanvragen" | "instellingen";
const TABS: { k: TabKey; l: string }[] = [
  { k: "agenda", l: "Agenda" }, { k: "registraties", l: "Registraties" }, { k: "ritten", l: "Alle ritten" },
  { k: "klanten", l: "Klanten" }, { k: "aanvragen", l: "Aanvragen" }, { k: "instellingen", l: "Instellingen" },
];

export function Admin() {
  const { user, loading, openAuth } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("agenda");
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [blocks, setBlocks] = useState<VehicleBlock[]>([]);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    try {
      const [b, p, c, bl] = await Promise.all([api.adminBookings(), api.adminProfiles(), api.adminContacts(), api.adminBlocks()]);
      setRows(b); setProfiles(p); setContacts(c); setBlocks(bl); setErr("");
    } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { if (user?.is_admin) reload(); }, [user, reload]);

  if (loading) return <div className="wrap text-ink2">Laden…</div>;
  if (!user) return <div className="wrap"><div className="panel max-w-[520px]"><h3>Beheer</h3><p className="text-ink2 text-[.92rem] mb-5">Log in met een beheerdersaccount.</p><button className="btn btn-primary" onClick={() => openAuth("login")}>Inloggen</button></div></div>;
  if (!user.is_admin) return <div className="wrap"><Notice kind="bad">Dit gedeelte is alleen voor beheerders. <Link to="/account">Terug naar mijn ritten</Link>.</Notice></div>;

  const open = rows.filter((b) => b.phase === "open" || b.phase === "overdue");
  const flagged = rows.filter((b) => b.km_flagged && b.phase === "done");
  const newContacts = contacts.filter((c) => !c.handled);
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast(msg); await reload(); } catch (e) { toast((e as Error).message); } };

  return (
    <div className="wrap">
      <div className="flex justify-between items-end gap-5 flex-wrap mb-[22px]">
        <div><span className="eyebrow">Beheer</span><h2>Dashboard</h2></div>
        <div className="flex gap-2.5 flex-wrap"><button className="btn btn-ghost btn-sm" onClick={reload}>Vernieuwen</button><Link to="/account" className="btn btn-ghost btn-sm">Mijn ritten</Link></div>
      </div>
      {err && <Notice kind="bad" className="mb-4">{err}</Notice>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[["Te registreren", open.length, open.length > 0], ["Km-afwijkingen", flagged.length, flagged.length > 0], ["Nieuwe aanvragen", newContacts.length, newContacts.length > 0], ["Klanten", profiles.length, false]].map(([l, v, alert]) => (
          <div key={l as string} className={`border rounded-md px-[18px] py-4 ${alert ? "border-warn bg-warnSoft" : "bg-surface border-line"}`}><span className="text-[.78rem] font-bold tracking-[.06em] uppercase text-ink3">{l}</span><b className="block font-display text-[1.7rem] font-extrabold mt-1 num">{v as number}</b></div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-line mb-[18px] overflow-x-auto">
        {TABS.map((t) => <button key={t.k} onClick={() => setTab(t.k)} className={`whitespace-nowrap bg-transparent border-0 border-b-2 -mb-px px-3.5 py-2.5 font-bold ${tab === t.k ? "text-ink border-accent" : "text-ink2 border-transparent"}`}>{t.l}</button>)}
      </div>

      {tab === "agenda" && <Agenda rows={rows} blocks={blocks} act={act} />}
      {tab === "registraties" && <Registraties open={open} flagged={flagged} act={act} />}
      {tab === "ritten" && <Ritten rows={rows} act={act} />}
      {tab === "klanten" && <Klanten profiles={profiles} rows={rows} me={user.id} act={act} />}
      {tab === "aanvragen" && <Aanvragen contacts={contacts} act={act} />}
      {tab === "instellingen" && <Instellingen onSaved={reload} />}
    </div>
  );
}

type Act = (fn: () => Promise<unknown>, msg: string) => Promise<void>;

/* ---------------- Agenda ---------------- */
function Agenda({ rows, blocks, act }: { rows: AdminBooking[]; blocks: VehicleBlock[]; act: Act }) {
  const [weeks, setWeeks] = useState(3);
  const [blockFor, setBlockFor] = useState<{ v: VehicleId; date: string } | null>(null);
  const [reason, setReason] = useState("Onderhoud");
  const days = useMemo(() => Array.from({ length: weeks * 7 }, (_, i) => addDays(today(), i)), [weeks]);
  const byKey = useMemo(() => {
    const m = new Map<string, AdminBooking>();
    rows.filter((b) => b.status !== "cancelled").forEach((b) => m.set(`${b.vehicle_id}|${b.date}`, b));
    return m;
  }, [rows]);
  const blockKey = useMemo(() => new Map(blocks.map((b) => [`${b.vehicle_id}|${b.date}`, b])), [blocks]);

  return (
    <div>
      <div className="flex justify-between items-center gap-3 flex-wrap mb-3">
        <p className="text-[.88rem] text-ink2">Klik op een lege dag om de bus te blokkeren (onderhoud, eigen gebruik). Klik op een blokkade om die op te heffen.</p>
        <label className="field flex-row items-center gap-2"><span>Weken</span><select value={weeks} onChange={(e) => setWeeks(+e.target.value)} className="!w-auto">{[2, 3, 4, 6, 8].map((w) => <option key={w}>{w}</option>)}</select></label>
      </div>
      <div className="overflow-x-auto bg-surface border border-line rounded-lg">
        <table className="w-full border-collapse text-[.85rem] min-w-[700px]">
          <thead><tr><th className="text-left px-3 py-2.5 text-[.72rem] uppercase tracking-[.08em] text-ink3 border-b border-line w-[120px]">Dag</th>{Object.values(VEHICLES).map((v) => <th key={v.id} className="text-left px-3 py-2.5 text-[.72rem] uppercase tracking-[.08em] text-ink3 border-b border-line">{v.name}</th>)}</tr></thead>
          <tbody>
            {days.map((d) => { const iso = toIso(d); const weekend = d.getDay() === 0 || d.getDay() === 6; return (
              <tr key={iso} className={weekend ? "bg-surface2/50" : ""}>
                <td className="px-3 py-2 border-b border-line whitespace-nowrap"><b>{DOW[d.getDay()]} {d.getDate()} {MON[d.getMonth()]}</b>{iso === toIso(today()) && <span className="ml-1.5 text-[.7rem] text-accent font-bold">vandaag</span>}</td>
                {Object.values(VEHICLES).map((v) => {
                  const b = byKey.get(`${v.id}|${iso}`); const bl = blockKey.get(`${v.id}|${iso}`);
                  return (
                    <td key={v.id} className="px-2 py-1.5 border-b border-line align-top">
                      {b ? (
                        <div className={`rounded-md px-2.5 py-1.5 border ${b.phase === "done" ? "bg-okSoft border-ok/30" : b.phase === "planned" ? "bg-brandSoft border-brand/30" : "bg-warnSoft border-warn/40"}`}>
                          <div className="flex justify-between gap-2"><b className="num">{hhmm(b.time_from)}–{hhmm(b.time_to)}</b><span className="text-[.75rem] text-ink2">{b.ref}</span></div>
                          <div className="text-[.82rem]">{b.customer_name} · {b.destination}</div>
                          {b.wheelchair && <span className="text-[.72rem] text-brand font-bold">rolstoel</span>}
                        </div>
                      ) : bl ? (
                        <button onClick={() => act(() => api.adminRemoveBlock(bl.id), "Blokkade opgeheven")} className="w-full text-left rounded-md px-2.5 py-1.5 bg-badSoft border border-bad/30 text-[.82rem]"><b>Geblokkeerd</b> · {bl.reason || "geen reden"} <span className="text-ink3">(klik om op te heffen)</span></button>
                      ) : (
                        <button onClick={() => setBlockFor({ v: v.id, date: iso })} className="w-full text-left rounded-md px-2.5 py-1.5 text-ink3 hover:bg-surface2 text-[.8rem]">vrij</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
      <Modal open={!!blockFor} onClose={() => setBlockFor(null)} title="Bus blokkeren" sub={blockFor ? `${VEHICLES[blockFor.v].name} · ${fmtDate(blockFor.date, true)}` : ""} labelledBy="blk">
        <label className="field"><span>Reden</span><input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div className="flex justify-end gap-2.5 mt-5"><button className="btn btn-ghost" onClick={() => setBlockFor(null)}>Annuleren</button><button className="btn btn-primary" onClick={async () => { if (blockFor) { await act(() => api.adminAddBlock(blockFor.v, blockFor.date, reason), "Dag geblokkeerd"); setBlockFor(null); } }}>Blokkeren</button></div>
      </Modal>
    </div>
  );
}

/* ---------------- Registraties ---------------- */
function Registraties({ open, flagged, act }: { open: AdminBooking[]; flagged: AdminBooking[]; act: Act }) {
  return (
    <div className="grid gap-7">
      <section>
        <h3 className="mb-2">Nog te registreren ({open.length})</h3>
        {open.length === 0 ? <p className="text-ink2 text-[.9rem]">Alle afgelopen ritten zijn geregistreerd.</p> : (
          <div className="overflow-x-auto bg-surface border border-line rounded-lg"><table className="w-full border-collapse text-[.88rem] min-w-[760px]">
            <thead><tr>{["Rit", "Klant", "Bus", "Bestemming", "Deadline", "Status"].map((h) => <th key={h} className="text-left px-4 py-3 text-[.72rem] uppercase tracking-[.08em] text-ink3 border-b border-line">{h}</th>)}</tr></thead>
            <tbody>{open.map((b) => { const h = hoursLeft(b.deadline_at); return (
              <tr key={b.id} className="[&>td]:px-4 [&>td]:py-3 [&>td]:border-b [&>td]:border-line">
                <td className="whitespace-nowrap"><b>{fmtDate(b.date)}</b><div className="text-[.8rem] text-ink2 num">{hhmm(b.time_from)}–{hhmm(b.time_to)} · {b.ref}</div></td>
                <td>{b.customer_name}<div className="text-[.8rem] text-ink2">{b.customer_phone || b.customer_email}</div></td>
                <td>{VEHICLES[b.vehicle_id].short}</td><td>{b.destination}</td>
                <td className="num">{h > 0 ? `nog ${Math.max(1, Math.floor(h))} u` : `${Math.floor(-h)} u te laat`}</td>
                <td>{h > 0 ? <Tag kind="warn">Open</Tag> : <Tag kind="bad">Te laat</Tag>}</td>
              </tr>); })}</tbody></table></div>
        )}
      </section>
      <section>
        <h3 className="mb-1">Kilometer-afwijkingen ({flagged.length})</h3>
        <p className="text-ink2 text-[.88rem] mb-2">De beginstand die de klant invulde sluit niet aan op de eindstand van de vorige rit met dezelfde bus. Controleer en markeer als afgehandeld.</p>
        {flagged.length === 0 ? <p className="text-ink2 text-[.9rem]">Geen afwijkingen.</p> : (
          <div className="overflow-x-auto bg-surface border border-line rounded-lg"><table className="w-full border-collapse text-[.88rem] min-w-[820px]">
            <thead><tr>{["Rit", "Klant", "Bus", "Verwachte beginstand", "Ingevuld", "Verschil", ""].map((h, i) => <th key={i} className="text-left px-4 py-3 text-[.72rem] uppercase tracking-[.08em] text-ink3 border-b border-line">{h}</th>)}</tr></thead>
            <tbody>{flagged.map((b) => { const diff = (b.start_km ?? 0) - (b.expected_start_km ?? 0); return (
              <tr key={b.id} className="[&>td]:px-4 [&>td]:py-3 [&>td]:border-b [&>td]:border-line">
                <td className="whitespace-nowrap"><b>{fmtDate(b.date)}</b><div className="text-[.8rem] text-ink2">{b.ref}</div></td>
                <td>{b.customer_name}</td><td>{VEHICLES[b.vehicle_id].short}</td>
                <td className="num">{b.expected_start_km?.toLocaleString("nl-NL")} km</td><td className="num">{b.start_km?.toLocaleString("nl-NL")} km</td>
                <td className={`num font-bold ${diff > 0 ? "text-bad" : "text-warn"}`}>{diff > 0 ? "+" : ""}{diff} km {diff > 0 && <span className="font-normal text-ink2">(ontbrekende km)</span>}</td>
                <td className="whitespace-nowrap"><button className="btn btn-ghost btn-sm" onClick={() => act(() => api.adminSetBooking(b.id, { km_flagged: false, admin_note: `Km-afwijking ${diff > 0 ? "+" : ""}${diff} gecontroleerd` }), "Gemarkeerd als gecontroleerd")}>Gecontroleerd</button></td>
              </tr>); })}</tbody></table></div>
        )}
      </section>
    </div>
  );
}

/* ---------------- Alle ritten ---------------- */
function Ritten({ rows, act }: { rows: AdminBooking[]; act: Act }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("alle");
  const [month, setMonth] = useState("");
  const list = rows.filter((b) => (status === "alle" || b.phase === status) && (!month || b.date.startsWith(month)) && (!q || `${b.customer_name} ${b.destination} ${b.ref} ${b.driver_name}`.toLowerCase().includes(q.toLowerCase())));
  const cost = (b: AdminBooking) => (b.km ?? 0) * CONFIG.ratePerKm + (CONFIG.fineEnabled && b.fine_applied && !b.fine_waived ? CONFIG.fine : 0);
  const totalKm = list.reduce((s, b) => s + (b.km ?? 0), 0), totalEur = list.filter((b) => b.phase === "done").reduce((s, b) => s + cost(b), 0);

  function exportCsv() {
    const head = ["Ref", "Datum", "Van", "Tot", "Bus", "Klant", "E-mail", "Tagnummer", "Chauffeur", "Bestemming", "Beginstand", "Eindstand", "Km", "Tarief", "Boete", "Bedrag", "Status"];
    const lines = list.map((b) => [b.ref, b.date, hhmm(b.time_from), hhmm(b.time_to), VEHICLES[b.vehicle_id].short, b.customer_name, b.customer_email, b.customer_tag, b.reg_driver_name ?? b.driver_name, b.reg_destination ?? b.destination, b.start_km ?? "", b.end_km ?? "", b.km ?? "", CONFIG.ratePerKm.toFixed(2).replace(".", ","), CONFIG.fineEnabled && b.fine_applied && !b.fine_waived ? CONFIG.fine : 0, b.phase === "done" ? cost(b).toFixed(2).replace(".", ",") : "", b.phase].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `ritten${month ? "-" + month : ""}.csv`; a.click();
  }
  function afrekening(b: AdminBooking) {
    const w = window.open("", "_blank"); if (!w) return;
    const fine = CONFIG.fineEnabled && b.fine_applied && !b.fine_waived ? CONFIG.fine : 0;
    w.document.write(`<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Afrekening ${b.ref}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#152226}h1{font-size:1.6rem;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px 8px;border-bottom:1px solid #ddd;text-align:left}td.r,th.r{text-align:right}.tot td{font-weight:700;border-top:2px solid #152226}.muted{color:#5c6b63;font-size:.9rem}@media print{button{display:none}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h1>Afrekening</h1><div class="muted">${CONFIG.company.name} Busverhuur · ${CONFIG.company.address}<br>KvK ${CONFIG.company.kvk} · BTW ${CONFIG.company.btw}</div></div><div style="text-align:right"><b>${b.ref}</b><br><span class="muted">${fmtDate(b.date, true)}</span></div></div>
      <p style="margin-top:28px"><b>${b.customer_name}</b>${b.customer_org ? " · " + b.customer_org : ""}<br><span class="muted">${b.customer_email}${b.customer_phone ? " · " + b.customer_phone : ""} · tagnummer ${b.customer_tag}</span></p>
      <table><tr><th>Omschrijving</th><th class="r">Aantal</th><th class="r">Prijs</th><th class="r">Bedrag</th></tr>
      <tr><td>${VEHICLES[b.vehicle_id].name} · ${hhmm(b.time_from)}–${hhmm(b.time_to)} · chauffeur ${b.reg_driver_name ?? b.driver_name}<br><span class="muted">${b.reg_destination ?? b.destination} · tellerstand ${b.start_km?.toLocaleString("nl-NL")} → ${b.end_km?.toLocaleString("nl-NL")}</span></td><td class="r">${b.km} km</td><td class="r">${eur(CONFIG.ratePerKm)}</td><td class="r">${eur((b.km ?? 0) * CONFIG.ratePerKm)}</td></tr>
      ${fine ? `<tr><td>Administratiekosten late registratie</td><td class="r">1</td><td class="r">${eur(fine)}</td><td class="r">${eur(fine)}</td></tr>` : ""}
      <tr class="tot"><td colspan="3">Totaal te betalen</td><td class="r">${eur((b.km ?? 0) * CONFIG.ratePerKm + fine)}</td></tr></table>
      <p class="muted" style="margin-top:24px">Gelieve binnen 14 dagen te voldoen onder vermelding van ${b.ref}.</p>
      <button onclick="print()" style="margin-top:20px;padding:10px 16px;font:inherit">Afdrukken / opslaan als PDF</button></body></html>`);
    w.document.close();
  }

  return (
    <div>
      <div className="flex gap-3 flex-wrap items-end mb-3">
        <label className="field"><span>Zoeken</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Klant, bestemming, ref…" /></label>
        <label className="field"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="alle">Alle</option><option value="planned">Gepland</option><option value="open">Registratie open</option><option value="overdue">Te laat</option><option value="done">Afgerond</option><option value="cancelled">Geannuleerd</option></select></label>
        <label className="field"><span>Maand</span><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}>Exporteer CSV</button>
        <span className="text-[.86rem] text-ink2 ml-auto num">{list.length} ritten · {totalKm.toLocaleString("nl-NL")} km · {eur(totalEur)} afgerond</span>
      </div>
      <div className="overflow-x-auto bg-surface border border-line rounded-lg"><table className="w-full border-collapse text-[.88rem] min-w-[980px]">
        <thead><tr>{["Rit", "Klant", "Bus", "Chauffeur / bestemming", "Km", "Bedrag", "Status", ""].map((h, i) => <th key={i} className={`text-left px-4 py-3 text-[.72rem] uppercase tracking-[.08em] text-ink3 border-b border-line ${i === 4 || i === 5 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
        <tbody>{list.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-ink2">Geen ritten gevonden.</td></tr> : list.map((b) => (
          <tr key={b.id} className="[&>td]:px-4 [&>td]:py-3 [&>td]:border-b [&>td]:border-line align-top">
            <td className="whitespace-nowrap"><b>{fmtDate(b.date)}</b><div className="text-[.8rem] text-ink2 num">{hhmm(b.time_from)}–{hhmm(b.time_to)} · {b.ref}</div></td>
            <td>{b.customer_name}<div className="text-[.8rem] text-ink2">{b.customer_tag}</div></td>
            <td>{VEHICLES[b.vehicle_id].short}</td>
            <td>{b.reg_driver_name ?? b.driver_name}<div className="text-[.8rem] text-ink2">{b.reg_destination ?? b.destination}</div>{b.km_flagged && <Tag kind="warn">km-afwijking</Tag>}{b.admin_note && <div className="text-[.78rem] text-ink3">{b.admin_note}</div>}</td>
            <td className="text-right num">{b.km ? `${b.km}` : "—"}{b.start_km ? <div className="text-[.78rem] text-ink3">{b.start_km}→{b.end_km}</div> : null}</td>
            <td className="text-right num">{b.phase === "done" ? eur(cost(b)) : "—"}</td>
            <td>{b.phase === "planned" ? <Tag kind="soft">Gepland</Tag> : b.phase === "open" ? <Tag kind="warn">Open</Tag> : b.phase === "overdue" ? <Tag kind="bad">Te laat</Tag> : b.phase === "cancelled" ? <Tag kind="soft">Geannuleerd</Tag> : <Tag kind="ok">Afgerond</Tag>}{CONFIG.fineEnabled && b.fine_applied && <div className="mt-1">{b.fine_waived ? <Tag kind="soft">boete kwijtgescholden</Tag> : <Tag kind="bad">boete {eur(CONFIG.fine)}</Tag>}</div>}</td>
            <td className="whitespace-nowrap text-right">
              {b.phase === "done" && <button className="btn btn-ghost btn-sm" onClick={() => afrekening(b)}>Afrekening</button>}
              {b.phase === "planned" && <button className="btn btn-ghost btn-sm" onClick={() => window.confirm(`Rit ${b.ref} van ${b.customer_name} annuleren?`) && act(() => api.adminCancelBooking(b.id), "Rit geannuleerd")}>Annuleren</button>}
              {CONFIG.fineEnabled && b.fine_applied && !b.fine_waived && <button className="btn btn-ghost btn-sm ml-1" onClick={() => act(() => api.adminSetBooking(b.id, { fine_waived: true }), "Boete kwijtgescholden")}>Boete kwijtschelden</button>}
            </td>
          </tr>))}</tbody></table></div>
    </div>
  );
}

/* ---------------- Klanten ---------------- */
function Klanten({ profiles, rows, me, act }: { profiles: Profile[]; rows: AdminBooking[]; me: string; act: Act }) {
  const [q, setQ] = useState("");
  const list = profiles.filter((p) => !q || `${p.full_name} ${p.email} ${p.tag_number} ${p.organisation ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const stats = (id: string) => { const r = rows.filter((b) => b.user_id === id); return { n: r.filter((b) => b.status !== "cancelled").length, km: r.reduce((s, b) => s + (b.km ?? 0), 0), late: r.filter((b) => b.fine_applied).length }; };
  return (
    <div>
      <label className="field mb-3 max-w-[360px]"><span>Zoeken</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Naam, e-mail, tagnummer…" /></label>
      <div className="overflow-x-auto bg-surface border border-line rounded-lg"><table className="w-full border-collapse text-[.88rem] min-w-[900px]">
        <thead><tr>{["Klant", "Contact", "Tagnummer", "Ritten", "Km totaal", "Status", ""].map((h, i) => <th key={i} className="text-left px-4 py-3 text-[.72rem] uppercase tracking-[.08em] text-ink3 border-b border-line">{h}</th>)}</tr></thead>
        <tbody>{list.map((p) => { const s = stats(p.id); return (
          <tr key={p.id} className="[&>td]:px-4 [&>td]:py-3 [&>td]:border-b [&>td]:border-line">
            <td><b>{p.full_name}</b>{p.is_admin && <Tag kind="brand">beheerder</Tag>}<div className="text-[.8rem] text-ink2">{p.organisation || ""}</div></td>
            <td className="text-[.85rem]">{p.email}<div className="text-ink2">{p.phone || ""}</div></td>
            <td className="num">{p.tag_number}</td>
            <td className="num">{s.n}{s.late > 0 && <div className="text-[.78rem] text-warn">{s.late}× te laat</div>}</td>
            <td className="num">{s.km.toLocaleString("nl-NL")} km</td>
            <td>{p.is_blocked ? <Tag kind="bad">Geblokkeerd</Tag> : <Tag kind="ok">Actief</Tag>}</td>
            <td className="whitespace-nowrap text-right">
              {p.id !== me && <button className="btn btn-ghost btn-sm" onClick={() => act(() => api.adminSetProfile(p.id, { is_blocked: !p.is_blocked }), p.is_blocked ? "Klant gedeblokkeerd" : "Klant geblokkeerd")}>{p.is_blocked ? "Deblokkeren" : "Blokkeren"}</button>}
              {p.id !== me && <button className="btn btn-ghost btn-sm ml-1" onClick={() => window.confirm(`${p.full_name} ${p.is_admin ? "beheerdersrechten afnemen" : "beheerder maken"}?`) && act(() => api.adminSetProfile(p.id, { is_admin: !p.is_admin }), "Rechten aangepast")}>{p.is_admin ? "Geen beheerder" : "Maak beheerder"}</button>}
            </td>
          </tr>); })}</tbody></table></div>
    </div>
  );
}

/* ---------------- Aanvragen ---------------- */
function Aanvragen({ contacts, act }: { contacts: ContactRequest[]; act: Act }) {
  const [showDone, setShowDone] = useState(false);
  const list = contacts.filter((c) => showDone || !c.handled);
  const subj: Record<string, string> = { "lange-termijn": "Boeking > 14 dagen", vraag: "Algemene vraag", factuur: "Afrekening / rit", schade: "Schade / storing", anders: "Anders" };
  return (
    <div>
      <label className="flex gap-2 items-center text-[.9rem] text-ink2 mb-3"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Ook afgehandelde tonen</label>
      {list.length === 0 ? <p className="text-ink2 text-[.9rem]">Geen openstaande aanvragen.</p> : (
        <div className="grid gap-3">{list.map((c) => (
          <div key={c.id} className={`card ${c.handled ? "opacity-70" : ""}`}>
            <div className="flex justify-between gap-3 flex-wrap">
              <div><Tag kind={c.subject === "lange-termijn" ? "brand" : "soft"}>{subj[c.subject] ?? c.subject}</Tag> <b className="ml-2">{c.name}</b> <span className="text-ink2 text-[.86rem]">· <a href={`mailto:${c.email}`}>{c.email}</a>{c.phone ? ` · ${c.phone}` : ""}</span></div>
              <span className="text-[.82rem] text-ink3">{new Date(c.created_at).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            {c.subject === "lange-termijn" && <p className="mt-2 text-[.9rem]"><b>Gewenst:</b> {c.wanted_date ? fmtDate(c.wanted_date, true) : "—"} · {c.vehicle_id && c.vehicle_id in VEHICLES ? VEHICLES[c.vehicle_id as VehicleId].short : c.vehicle_id ?? "—"} · {c.time_from ? hhmm(c.time_from) : "?"}–{c.time_to ? hhmm(c.time_to) : "?"}{c.destination ? ` · ${c.destination}` : ""}</p>}
            <p className="mt-2 text-[.92rem] whitespace-pre-wrap">{c.message}</p>
            <div className="mt-3 flex gap-2"><a className="btn btn-ghost btn-sm" href={`mailto:${c.email}?subject=Re: uw aanvraag bij ${CONFIG.company.name} Busverhuur`}>Beantwoorden</a><button className="btn btn-ghost btn-sm" onClick={() => act(() => api.adminSetContactHandled(c.id, !c.handled), c.handled ? "Heropend" : "Afgehandeld")}>{c.handled ? "Heropenen" : "Afgehandeld"}</button></div>
          </div>))}</div>
      )}
    </div>
  );
}

/* ---------------- Instellingen ---------------- */
function Instellingen({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.getSettings().then(setS); }, []);
  if (!s) return <p className="text-ink2">Laden…</p>;
  async function save(e: FormEvent) {
    e.preventDefault(); if (!s) return; setBusy(true);
    try { await api.adminSaveSettings(s); applySettings(s); toast("Instellingen opgeslagen"); onSaved(); } catch (ex) { toast((ex as Error).message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="panel max-w-[640px]">
      <h3 className="mb-1">Tarieven en regels</h3><p className="text-ink2 text-[.9rem] mb-5">Wijzigingen gelden direct voor nieuwe boekingen en registraties.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="field"><span>Tarief per km (€)</span><input type="number" step="0.01" min="0" value={s.rate_per_km} onChange={(e) => setS({ ...s, rate_per_km: +e.target.value })} /></label>
        <label className="field"><span>Online boeken tot (dagen vooruit)</span><input type="number" min="1" max="90" value={s.horizon_days} onChange={(e) => setS({ ...s, horizon_days: +e.target.value })} /></label>
        <label className="field"><span>Registreren binnen (uren na terugbrengen)</span><input type="number" min="1" value={s.deadline_hours} onChange={(e) => setS({ ...s, deadline_hours: +e.target.value })} /></label>
        <label className="field"><span>Buffer tussen boekingen (minuten)</span><input type="number" min="0" step="15" value={s.buffer_minutes} onChange={(e) => setS({ ...s, buffer_minutes: +e.target.value })} /><span className="hint">Nog niet actief in de boekingsflow (één boeking per bus per dag).</span></label>
        <label className="flex gap-2.5 items-start text-[.92rem] sm:col-span-2 mt-2"><input type="checkbox" checked={s.fine_enabled} onChange={(e) => setS({ ...s, fine_enabled: e.target.checked })} className="mt-1" /><span><b>Administratiekosten bij te late registratie inschakelen</b><br /><span className="text-ink2 text-[.86rem]">Zet dit aan om de boete weer te tonen op de site en toe te passen bij registraties na de termijn.</span></span></label>
        <label className="field"><span>Administratiekosten (€)</span><input type="number" step="0.5" min="0" value={s.fine} disabled={!s.fine_enabled} onChange={(e) => setS({ ...s, fine: +e.target.value })} /></label>
      </div>
      <div className="flex justify-end mt-5"><button className="btn btn-primary" disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</button></div>
    </form>
  );
}
