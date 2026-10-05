import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* ---------- Iconen (inline SVG, geen library nodig) ---------- */
const S = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icon = {
  Check: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M20 6 9 17l-5-5" /></svg>,
  X: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Warn: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>,
  Info: (p: { className?: string }) => <svg {...S} className={p.className}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>,
  Calendar: (p: { className?: string }) => <svg {...S} className={p.className}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  Clock: (p: { className?: string }) => <svg {...S} className={p.className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  User: (p: { className?: string }) => <svg {...S} className={p.className}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  Shield: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>,
  Phone: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2z" /></svg>,
  Mail: (p: { className?: string }) => <svg {...S} className={p.className}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>,
  Pin: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Bus: (p: { className?: string }) => <svg {...S} className={p.className}><path d="M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9" /><path d="M4 16h16" /><path d="M4 11h16" /><circle cx="8" cy="18.5" r="1.5" /><circle cx="16" cy="18.5" r="1.5" /></svg>,
};

/* ---------- Toast ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<number>();
  const show = useCallback((m: string) => { setMsg(m); window.clearTimeout(t.current); t.current = window.setTimeout(() => setMsg(null), 3200); }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className={`fixed left-1/2 bottom-6 -translate-x-1/2 bg-ink text-bg px-[18px] py-3 rounded-[10px] font-semibold text-[.9rem] shadow-card z-[60] pointer-events-none transition-all duration-300 ${msg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>{msg}</div>
    </ToastCtx.Provider>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, sub, children, labelledBy = "modal-title", wide = false }: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode; labelledBy?: string; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  // Via een portal in <body>, anders knipt een kaart met overflow/transform het venster af.
  return createPortal(
    <div className="fixed inset-0 bg-[rgba(8,20,24,.55)] grid place-items-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={`bg-surface rounded-lg w-full ${wide ? "max-w-[760px]" : "max-w-[560px]"} max-h-[92vh] overflow-auto p-7 shadow-card relative`}>
        <button onClick={onClose} aria-label="Sluiten" className="absolute top-3.5 right-3.5 bg-surface2 w-8 h-8 rounded-full text-ink2 grid place-items-center"><Icon.X className="w-4 h-4" /></button>
        <h3 id={labelledBy} className="text-[1.35rem] mb-1">{title}</h3>
        {sub && <p className="text-ink2 text-[.92rem] mb-5">{sub}</p>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Notice ---------- */
export function Notice({ kind = "info", children, className = "" }: { kind?: "info" | "warn" | "bad" | "ok"; children: ReactNode; className?: string }) {
  const bg = { info: "bg-brandSoft", warn: "bg-warnSoft", bad: "bg-badSoft", ok: "bg-okSoft" }[kind];
  const I = kind === "info" ? Icon.Info : Icon.Warn;
  return <div className={`notice ${bg} ${className}`}><I className="w-[18px] h-[18px] shrink-0 mt-0.5" /><div>{children}</div></div>;
}

/* ---------- Tag ---------- */
export function Tag({ kind, children }: { kind: "brand" | "soft" | "ok" | "warn" | "bad"; children: ReactNode }) {
  const c = { brand: "bg-brand text-brandInk", soft: "bg-surface2 text-ink2", ok: "bg-okSoft text-ok", warn: "bg-warnSoft text-warn", bad: "bg-badSoft text-bad" }[kind];
  return <span className={`tag ${c}`}>{children}</span>;
}

/* ---------- Bus-illustratie ---------- */
export function BusArt({ wide, wheelchair, driving = false }: { wide: boolean; wheelchair: boolean; driving?: boolean }) {
  const x = wide ? 20 : 50, w = wide ? 260 : 200;
  // Landschap dat voorbijtrekt (twee identieke helften van 400 breed voor een naadloze lus)
  const scenery = (
    <g className="scenery-half">
      <path d="M0 96 C50 68 90 70 130 90 S210 58 270 88 S340 76 400 96 V150 H0 Z" className="fill-brandSoft" opacity=".7" />
      <g className="fill-brand" opacity=".28">
        <path d="M40 96 l8 -22 l8 22 z M52 96 l6 -14 l6 14 z" /><path d="M190 96 l7 -18 l7 18 z" /><path d="M322 96 l9 -26 l9 26 z M336 96 l6 -13 l6 13 z" />
        <rect x="46" y="94" width="3" height="8" /><rect x="195" y="94" width="3" height="8" /><rect x="329" y="94" width="3" height="8" />
      </g>
      <g className="fill-surface" opacity=".9"><ellipse cx="90" cy="24" rx="18" ry="7" /><ellipse cx="102" cy="21" rx="12" ry="6" /><ellipse cx="290" cy="14" rx="16" ry="6" /><ellipse cx="302" cy="11" rx="10" ry="5" /></g>
    </g>
  );
  return (
    <svg viewBox={driving ? "-40 -40 400 200" : "0 0 320 130"} fill="none" aria-hidden="true" className={driving ? "bus-art driving absolute inset-0 w-full h-full" : "w-[70%] h-auto bus-art"}>
      {driving && <g className="scenery" transform="translate(-40 0)">{scenery}<g transform="translate(400 0)">{scenery}</g></g>}
      <line x1="-40" y1="121" x2="360" y2="121" className="road stroke-lineStrong" strokeWidth="2" />
      <g className="bus">
      <rect x={x} y="30" width={w} height="70" rx="14" className="fill-brand" />
      <rect x={x + 16} y="42" width={wide ? 170 : 120} height="30" rx="6" className="fill-brandSoft" opacity=".9" />
      <path d={`M${wide ? 216 : 196} 42h${wide ? 40 : 36}l12 14v16h-${wide ? 52 : 48}z`} className="fill-brandSoft" opacity=".9" />
      <rect x={x} y="88" width={w} height="12" rx="4" className="fill-brandDeep" />
      {[wide ? 80 : 100, wide ? 230 : 210].map((cx) => (
        <g key={cx} className="wheel"><circle cx={cx} cy="102" r="16" className="fill-ink" /><circle cx={cx} cy="102" r="7" className="fill-surface2" /><path d={`M${cx} 86v6M${cx} 112v6M${cx - 16} 102h6M${cx + 10} 102h6`} className="stroke-surface2" strokeWidth="2" /></g>
      ))}
      {wheelchair && (<><circle cx="290" cy="60" r="18" className="fill-accent" /><g className="stroke-accentInk" strokeWidth="2.2" fill="none" strokeLinecap="round"><circle cx="287" cy="66" r="6" /><path d="M287 52v8h7l4 6" /><circle cx="287" cy="49" r="2" /></g></>)}
      </g>
    </svg>
  );
}
