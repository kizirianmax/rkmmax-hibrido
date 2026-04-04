// src/components/OwnerGate.jsx
import React from "react";
import useOwner from "../hooks/useOwner.js";

/**
 * OwnerGate — renderiza children somente quando o usuário
 * logado tem papel de dono/admin (role: "owner" | "admin" | "dev").
 *
 * Props:
 *   children   {node}   Conteúdo restrito ao owner/admin
 *   fallback   {node}   Conteúdo alternativo (padrão: null)
 */
export default function OwnerGate({ children, fallback = null }) {
  const { isOwner, loading } = useOwner();

  if (loading) return null;
  if (!isOwner) return <>{fallback}</>;

  return <>{children}</>;
}
