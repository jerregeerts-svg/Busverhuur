import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Profile } from "./supabase";
import { applySettings } from "@/config";

interface AuthCtx {
  user: Profile | null;
  loading: boolean;
  authOpen: "login" | "register" | null;
  openAuth: (mode?: "login" | "register") => void;
  closeAuth: () => void;
  refresh: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState<"login" | "register" | null>(null);

  const refresh = useCallback(async () => { setUser(await api.getSession()); }, []);

  useEffect(() => {
    Promise.all([api.getSession(), api.getSettings().catch(() => null)]).then(([u, s]) => { if (s) applySettings(s); setUser(u); setLoading(false); });
    return api.onAuthChange(setUser);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, authOpen, openAuth: (m = "login") => setAuthOpen(m), closeAuth: () => setAuthOpen(null), refresh }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
