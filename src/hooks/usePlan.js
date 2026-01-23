// src/hooks/usePlan.js
import { useEffect, useState } from "react";

export default function usePlan() {
  const [plan, setPlan] = useState("basic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setPlan("basic");
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();

    const load = async () => {
      const raw = window.localStorage.getItem("user_email");
      if (!raw) {
        setPlan("basic");
        setLoading(false);
        return;
      }

      const email = raw.trim().toLowerCase();
      try {
        const res = await fetch("/api/me-plan", {
          headers: { "x-user-email": email },
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setPlan("basic");
          return;
        }

        const j = await res.json().catch(() => ({}));
        setPlan(j.plan || "basic");
      } catch {
        if (ctrl.signal.aborted) return;
        setPlan("basic");
      } finally {
        setLoading(false);
      }
    };

    load();

    const onStorage = (e) => {
      if (e.key === "user_email") {
        setLoading(true);
        load();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      ctrl.abort();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { plan, loading };
}
