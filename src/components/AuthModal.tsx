import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { CONFIG } from "@/config";
import { eur } from "@/lib/format";
import { Modal, useToast } from "./ui";

export function AuthModal() {
  const { authOpen, closeAuth, openAuth } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const mode = authOpen ?? "login";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) { setErr("Vul alle verplichte velden (*) correct in."); f.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    setErr(""); setBusy(true);
    try {
      if (mode === "login") {
        await api.signIn(d.email, d.password);
        toast("Ingelogd"); closeAuth(); nav("/account");
      } else {
        if (!/^[A-Z0-9-]{4,}$/i.test(d.tag_number)) { setErr("Vul een geldig tagnummer in (bijv. TAG-04821)."); return; }
        const r = await api.signUp({ email: d.email, password: d.password, full_name: d.full_name, phone: d.phone, tag_number: d.tag_number, organisation: d.organisation });
        if (r.needsConfirmation) { setInfo("Bijna klaar! We hebben een bevestigingslink naar uw e-mailadres gestuurd. Klik daarop en log daarna in."); }
        else { toast("Account aangemaakt. Welkom!"); closeAuth(); nav("/account"); }
      }
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  }

  async function forgot(e: React.MouseEvent) {
    e.preventDefault();
    const email = (document.getElementById("auth-email") as HTMLInputElement | null)?.value;
    if (!email) { setErr("Vul eerst uw e-mailadres in, dan sturen wij een herstel-link."); return; }
    try { await api.resetPassword(email); toast("Herstel-link verstuurd naar " + email); } catch (ex) { setErr((ex as Error).message); }
  }

  const close = () => { setErr(""); setInfo(""); closeAuth(); };

  return (
    <Modal open={!!authOpen} onClose={close} title={mode === "login" ? "Inloggen" : "Account aanmaken"}
      sub={mode === "login" ? "Log in om een rit te boeken of uw kilometers in te vullen." : "Eenmalig registreren, daarna boekt u in een minuut. Uw tagnummer vindt u op uw pas of sleutelhanger."}>
      {info ? (
        <div className="notice bg-okSoft">{info}</div>
      ) : (
        <>
          <div className="flex gap-1 bg-surface2 p-1 rounded-[10px] mb-5">
            {(["login", "register"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setErr(""); openAuth(m); }} className={`flex-1 py-2 rounded-[7px] font-bold ${mode === m ? "bg-surface text-ink shadow-card" : "text-ink2"}`}>{m === "login" ? "Inloggen" : "Registreren"}</button>
            ))}
          </div>
          <form onSubmit={submit} noValidate>
            {mode === "login" ? (
              <div className="grid gap-4">
                <label className="field req"><span>E-mailadres</span><input id="auth-email" type="email" name="email" required autoComplete="email" /></label>
                <label className="field req"><span>Wachtwoord</span><input type="password" name="password" required autoComplete="current-password" /></label>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="field req"><span>Voor- en achternaam</span><input name="full_name" required autoComplete="name" /></label>
                <label className="field req"><span>Tagnummer</span><input name="tag_number" required placeholder="TAG-00000" className="uppercase" /><span className="hint">Verplicht. Staat op uw toegangspas/sleutelhanger.</span></label>
                <label className="field req"><span>E-mailadres</span><input type="email" name="email" required autoComplete="email" /></label>
                <label className="field req"><span>Telefoonnummer</span><input type="tel" name="phone" required autoComplete="tel" /></label>
                <label className="field"><span>Organisatie <span className="hint">(optioneel)</span></span><input name="organisation" placeholder="Vereniging, zorginstelling, bedrijf" /></label>
                <label className="field req"><span>Wachtwoord</span><input type="password" name="password" required minLength={8} autoComplete="new-password" /><span className="hint">Minimaal 8 tekens</span></label>
                <label className="flex gap-2.5 items-start text-[.9rem] text-ink2 sm:col-span-2"><input type="checkbox" name="agree" required className="mt-1" /><span>Ik ga akkoord met de <Link to="/tarieven" onClick={close}>huisregels</Link>, waaronder de verplichte ritregistratie na elke rit{CONFIG.fineEnabled && <> en de {eur(CONFIG.fine)} administratiekosten bij het niet registreren van een rit</>}.</span></label>
              </div>
            )}
            {err && <p className="err mt-3">{err}</p>}
            <div className="flex justify-between items-center mt-5 gap-3">
              {mode === "login" ? <a href="#" onClick={forgot} className="text-[.86rem] text-ink2">Wachtwoord vergeten?</a> : <span />}
              <button className="btn btn-primary" disabled={busy}>{busy ? "Even geduld…" : mode === "login" ? "Inloggen" : "Account aanmaken"}</button>
            </div>
          </form>
          {api.demo && mode === "login" && (
            <div className="border border-dashed border-lineStrong rounded-md px-3.5 py-3 text-[.84rem] text-ink2 flex justify-between items-center gap-3 mt-4">
              <span><strong>Demo:</strong> bekijk het portaal met een voorbeeldaccount, inclusief ritten en een openstaande registratie.</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { await api.loginDemo?.(); toast("Welkom terug, Sanne"); close(); nav("/account"); }}>Demo-account</button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
