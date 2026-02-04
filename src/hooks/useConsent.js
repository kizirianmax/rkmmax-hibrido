// src/hooks/useConsent.js
import { useEffect, useState } from "react";

const KEY = "consent.v1";

// leituras/escritas seguras
function readConsent() {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
}
function writeConsent(val) {
  try {
    if (typeof window === "undefined") return;
    if (val) window.localStorage.setItem(KEY, "yes");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

// APIs utilitárias (se você usa em outros lugares)
export function getConsent() {
  return readConsent();
}
export function acceptConsent() {
  writeConsent(true);
}
export function revokeConsent() {
  writeConsent(false);
}

export default function useConsent() {
  // inicia falso e ajusta no efeito → evita mismatch em SSR/hydration
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // ler do localStorage quando a app montar
    setAccepted(readConsent());

    // sincroniza se outra aba mudar o valor
    const onStorage = (e) => {
      if (e.key === KEY) setAccepted(e.newValue === "yes");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const accept = () => {
    writeConsent(true);
    setAccepted(true);
  };
  const revoke = () => {
    writeConsent(false);
    setAccepted(false);
  };

  return { accepted, accept, revoke };
}
