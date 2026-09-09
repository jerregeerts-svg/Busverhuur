import { useEffect, useRef, type ReactNode } from "react";

/** Laat kinderen zacht in beeld komen zodra ze in het zicht scrollen (één keer). */
export function Reveal({ children, className = "", stagger = false, as: Tag = "div" }: { children: ReactNode; className?: string; stagger?: boolean; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-in"); return; }
    const io = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); } }); }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as "div";
  return <T ref={ref} className={`${stagger ? "reveal-stagger" : "reveal"} ${className}`}>{children}</T>;
}

/** Telt van 0 naar het eindgetal zodra zichtbaar. */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1200 }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fmt = (n: number) => prefix + n.toLocaleString("nl-NL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(to); return; }
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / duration); const e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, decimals, prefix, suffix, duration]);
  return <span ref={ref} className="num">{prefix}{(0).toLocaleString("nl-NL", { minimumFractionDigits: decimals })}{suffix}</span>;
}
