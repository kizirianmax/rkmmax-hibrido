// src/hooks/useOwner.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";

const OWNER_ROLES = ["owner", "admin", "dev"];

/**
 * useOwner — verifica se o usuário logado tem papel de dono/admin.
 *
 * Consulta `profiles.role` no Supabase para o usuário atual.
 * Se a coluna não existir ainda, ou o perfil não for encontrado,
 * retorna graciosamente `{ isOwner: false }` sem lançar erros.
 *
 * @returns {{ isOwner: boolean, role: string|null, loading: boolean }}
 */
export default function useOwner() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (cancelled) return;

        if (error) {
          // Coluna inexistente (PGRST116 = not found, 42703 = column does not exist)
          setRole(null);
        } else {
          setRole(data?.role ?? null);
        }
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isOwner = OWNER_ROLES.includes(role);

  return { isOwner, role, loading };
}
