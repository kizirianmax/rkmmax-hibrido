import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 🔐 INICIALIZAR GERENCIADOR DE SEGREDOS
import { initializeSecrets } from "./api/initializeSecrets";
initializeSecrets();

// 🧹 SW KILL SWITCH — elimina Service Workers e caches legados (roda 1x por sessão)
(async () => {
  try {
    const KEY = "rkmmax_sw_kill_v1";
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY) === "1") return;

    let changed = false;

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const results = await Promise.all(regs.map(r => r.unregister()));
      if (results.some(Boolean)) changed = true;
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      const results = await Promise.all(
        keys.filter(k => k.startsWith("rkmmax-")).map(k => caches.delete(k))
      );
      if (results.some(Boolean)) changed = true;
    }

    sessionStorage.setItem(KEY, "1");

    if (changed) window.location.reload();
  } catch (e) {
    // no-op: falha silenciosa para não travar UI
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
