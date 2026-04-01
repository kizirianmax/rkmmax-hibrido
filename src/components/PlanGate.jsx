// src/components/PlanGate.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * PlanGate — guarda de rota por nível de plano.
 *
 * Props:
 *   requirePlan  {string}  Plano mínimo exigido para acessar a rota
 *                          ("basic" | "intermediate" | "premium" | "ultra" | "dev")
 *   children     {node}    Conteúdo a renderizar se o plano for suficiente
 *
 * Comportamento:
 *   - Lê o plano do usuário de localStorage.userPlan
 *   - Se o plano for suficiente → renderiza children
 *   - Se não for suficiente → redireciona para /pricing
 *   - Se o plano não estiver definido → fallback para "basic" (não bloqueia boot)
 */

const PLAN_RANK = {
  basic: 1,
  intermediate: 2,
  premium: 3,
  ultra: 4,
  dev: 99,
};

export default function PlanGate({ requirePlan, children }) {
  const rawPlan = localStorage.getItem("userPlan") || "basic";
  const userPlan = PLAN_RANK[rawPlan] !== undefined ? rawPlan : "basic";

  const userRank = PLAN_RANK[userPlan] ?? 1;
  const requiredRank = PLAN_RANK[requirePlan] ?? 1;

  if (userRank < requiredRank) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
