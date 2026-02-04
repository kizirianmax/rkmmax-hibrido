// src/lib/fnClient.js
// Cliente único para chamar funções no backend.
// Tenta Vercel (/api) primeiro e, se falhar, cai para Netlify (/.netlify/functions),
// ou você pode forçar o provedor via REACT_APP_BACKEND_PROVIDER.

const API_BASE = "/api"; // Vercel
const PROVIDER = (process.env.REACT_APP_BACKEND_PROVIDER || "auto").toLowerCase(); // "auto" | "vercel" | "netlify"
const NF_BASE_RAW = (process.env.REACT_APP_FUNCTIONS_BASE_URL || "").replace(/\/+$/, ""); // ex: https://seusite.netlify.app
const NF_REL = "/.netlify/functions"; // caminho relativo no Netlify

function toInit(init) {
  const out = { ...(init || {}) };
  // Headers
  const headers = new Headers(out.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  out.headers = headers;
  // Body → JSON string
  if (out && typeof out === "object" && out.body && typeof out.body === "object") {
    out.body = JSON.stringify(out.body);
  }
  return out;
}

function normName(name) {
  return name.startsWith("/") ? name : `/${name}`;
}

async function parseResponse(res) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text?.slice(0, 400)}`);
  }
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return text;
}

async function callVercel(name, init) {
  const url = `${API_BASE}${normName(name)}`;
  const res = await fetch(url, toInit(init));
  return parseResponse(res);
}

async function callNetlify(name, init) {
  const prefix = NF_BASE_RAW || "";
  const url = `${prefix}${NF_REL}${normName(name)}`;
  const res = await fetch(url, toInit(init));
  return parseResponse(res);
}

export async function callFn(name, init) {
  const mode = PROVIDER;
  if (mode === "vercel") return callVercel(name, init);
  if (mode === "netlify") return callNetlify(name, init);

  // auto: tenta Vercel → fallback Netlify
  try {
    return await callVercel(name, init);
  } catch {
    return await callNetlify(name, init);
  }
}

export function backendInfo() {
  return {
    provider: PROVIDER, // "auto" | "vercel" | "netlify"
    vercelBase: API_BASE, // "/api"
    netlifyBase: NF_BASE_RAW || null, // ex: "https://seusite.netlify.app"
  };
}

// Conveniências
export const get = (name, params, init = {}) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return callFn(`${name}${qs}`, { ...init, method: "GET" });
};

export const post = (name, body, init = {}) => {
  return callFn(name, { ...init, method: "POST", body });
};

export default callFn;
