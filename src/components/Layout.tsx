import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CONFIG } from "@/config";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Icon } from "./ui";
import { AuthModal } from "./AuthModal";

const links = [
  { to: "/", label: "Home" },
  { to: "/voertuigen", label: "Voertuigen" },
  { to: "/tarieven", label: "Tarieven & regels" },
  { to: "/contact", label: "Contact" },
];

export function Layout() {
  const { user, openAuth } = useAuth();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => { setMenu(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
  useEffect(() => {
    if (!user) { setOpenCount(0); return; }
    api.myBookings().then((b) => setOpenCount(b.filter((x) => x.phase === "open" || x.phase === "overdue").length)).catch(() => {});
  }, [user, loc.pathname]);

  return (
    <>
      {api.demo && (
        <div className="bg-accentSoft text-ink text-center text-[.8rem] font-semibold py-1.5 px-4">
          Demo-modus: gegevens worden alleen in deze browser bewaard. Koppel Supabase (zie README) voor de echte versie.
        </div>
      )}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md border-b border-line">
        <div className="wrap flex items-center gap-7 h-[66px] relative">
          <Link to="/" className="flex items-center gap-2.5 no-underline font-display font-extrabold text-[1.15rem]" title="Logo en naam volgen nog">
            <span className="w-9 h-9 rounded-[9px] bg-brand grid place-items-center text-brandInk"><Icon.Bus className="w-[22px] h-[22px]" /></span>
            <span className="border border-dashed border-lineStrong rounded-md px-2 py-0.5 text-ink2 font-semibold text-[.95rem]">{CONFIG.company.name}</span>
          </Link>
          <button className="md:hidden ml-auto border border-line rounded-lg px-2.5 py-1.5" aria-label="Menu" onClick={() => setMenu(!menu)}>☰</button>
          <ul className={`${menu ? "flex absolute top-[66px] left-0 right-0 flex-col bg-surface p-3 border-b border-line shadow-card" : "hidden"} md:flex md:static md:flex-row md:ml-auto md:bg-transparent md:p-0 md:border-0 md:shadow-none gap-1 list-none m-0`}>
            {links.map((l) => (
              <li key={l.to}><NavLink to={l.to} end className={({ isActive }) => `block px-3 py-2 rounded-lg no-underline font-semibold text-[.92rem] ${isActive ? "bg-surface2 text-ink" : "text-ink2 hover:bg-surface2 hover:text-ink"}`}>{l.label}</NavLink></li>
            ))}
          </ul>
          <div className="flex gap-2 items-center">
            {user ? (
              <>{user.is_admin && <Link to="/beheer" className="btn btn-brand btn-sm">Beheer</Link>}<Link to="/account" className="btn btn-ghost btn-sm">Mijn ritten {openCount > 0 && <span className="tag bg-bad text-white px-[7px] py-px">{openCount}</span>}</Link></>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => openAuth("login")}>Inloggen</button>
            )}
            <Link to="/boeken" className="btn btn-primary btn-sm hidden sm:inline-flex">Rit boeken</Link>
          </div>
        </div>
      </header>

      <main className="py-12 pb-20"><Outlet /></main>

      <footer className="border-t border-line py-9 text-ink2 text-[.86rem]">
        <div className="wrap flex justify-between gap-6 flex-wrap">
          <div><strong className="text-ink">{CONFIG.company.name} Busverhuur</strong><br />KvK {CONFIG.company.kvk} · BTW {CONFIG.company.btw}</div>
          <div className="flex gap-[18px] flex-wrap">
            <Link to="/tarieven" className="no-underline hover:text-ink">Tarieven & huisregels</Link>
            <a href="#" className="no-underline hover:text-ink">Algemene voorwaarden</a>
            <a href="#" className="no-underline hover:text-ink">Privacy</a>
            <Link to="/contact" className="no-underline hover:text-ink">Contact</Link>
          </div>
        </div>
      </footer>
      <AuthModal />
    </>
  );
}
