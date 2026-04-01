// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Vite expõe variáveis de ambiente com prefixo VITE_ via import.meta.env
// (CRA usava process.env.REACT_APP_* — incompatível com Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error(
    "Supabase: variáveis de ambiente ausentes. " +
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel. " +
    "Auth ficará indisponível até que sejam configuradas."
  );
  // Stub seguro — não crasha o boot; auth fica degradada mas o app monta.
  const noop = () => {};
  const resolved = (val) => Promise.resolve(val);
  const noopChain = {
    select: () => noopChain,
    eq: () => noopChain,
    neq: () => noopChain,
    order: () => noopChain,
    limit: () => noopChain,
    maybeSingle: () => resolved({ data: null, error: null }),
    single: () => resolved({ data: null, error: null }),
    insert: () => noopChain,
    update: () => noopChain,
    upsert: () => noopChain,
    delete: () => noopChain,
    then: (fn) => resolved({ data: null, error: null }).then(fn),
  };
  supabase = {
    auth: {
      getSession: () => resolved({ data: { session: null }, error: null }),
      getUser: () => resolved({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: noop } },
      }),
      signInWithOtp: () =>
        resolved({ error: new Error("Supabase não configurado") }),
      signOut: () => resolved({ error: null }),
      resetPasswordForEmail: () =>
        resolved({ error: new Error("Supabase não configurado") }),
      updateUser: () =>
        resolved({ error: new Error("Supabase não configurado") }),
    },
    from: () => noopChain,
  };
}

export { supabase };

// default export para compatibilidade com AuthProvider (import supabase from ...)
export default supabase;
