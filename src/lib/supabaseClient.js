// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Vite expõe variáveis de ambiente com prefixo VITE_ via import.meta.env
// (CRA usava process.env.REACT_APP_* — incompatível com Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase: variáveis de ambiente ausentes. " +
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// default export para compatibilidade com AuthProvider (import supabase from ...)
export default supabase;
