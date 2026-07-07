import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import api from "../utils/api";

const AppDataContext = createContext(null);

// Single shared source of truth for the dashboard payload (balance, streak,
// today's zone, recent logs, active goals). Previously each screen fetched
// its own copy of overlapping data (dashboard, wallet, and stake all called
// /tokens/balance independently) — they could briefly disagree, and every
// screen paid for its own round trip. Now there's one fetch, shared via
// context; any screen can call refresh() and every consumer re-renders with
// the same, single, up-to-date value.
export function AppDataProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(null);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current; // coalesce concurrent calls
    const request = api.get("/dashboard/")
      .then((res) => {
        setDashboard(res.data);
        return res.data;
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });
    inFlight.current = request;
    return request;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({ dashboard, loading, refresh }), [dashboard, loading, refresh]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
