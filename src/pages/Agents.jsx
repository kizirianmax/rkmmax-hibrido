// src/pages/Agents.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import usePlan from "../hooks/usePlan.js";
import AgentCard from "../components/AgentCard.jsx";
import { AGENTS } from "../data/agents.js";

export default function AgentsPage() {
  const navigate = useNavigate();
  const { plan, loading } = usePlan(); // "free" | "intermediate" | "premium"

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>;

  const goChat = (agent) => navigate(`/chat?agent=${agent.id}`);
  const goPricing = () => navigate("/pricing");

  return (
    <main>
      <div
        style={{
          maxWidth: 980,
          margin: "40px auto",
          padding: "0 16px",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Agentes RKMMAX</h1>

        {/* Aviso: Serginho sempre liberado, demais no Premium */}
        <p
          style={{
            color: "#0f172a",
            margin: "16px 0 24px",
            background: "#f1f5f9",
            padding: "12px 16px",
            borderRadius: 12,
          }}
        >
          <strong>Serginho</strong> está disponível em <strong>todos os planos</strong> e coordena
          os especialistas. Os demais agentes ficam liberados para uso no plano{" "}
          <strong>Premium</strong>.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {AGENTS.map((agent) => {
            // regra: apenas especialistas são bloqueados fora do premium
            const locked = plan !== "premium" && agent.id !== "serginho";

            return (
              <div key={agent.id} style={{ position: "relative" }}>
                {/* Card sempre visível */}
                <AgentCard agent={agent} onClick={() => (locked ? goPricing() : goChat(agent))} />

                {/* Selo no canto: “Livre” para Serginho, “Premium” para especialistas */}
                <div
                  onClick={locked ? goPricing : undefined}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: 14,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: locked ? "1px solid #94a3b8" : "1px solid #22c55e",
                    background: locked ? "rgba(255,255,255,.8)" : "rgba(34,197,94,.1)",
                    backdropFilter: "blur(2px)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: locked ? "#0f172a" : "#15803d",
                    cursor: locked ? "pointer" : "default",
                  }}
                  aria-label={locked ? "Requer plano Premium" : "Disponível em todos os planos"}
                  title={locked ? "Requer plano Premium" : "Disponível em todos os planos"}
                >
                  {locked ? "Premium" : "Livre"}
                </div>

                {/* Feedback suave em cards bloqueados */}
                {locked && (
                  <div
                    onClick={goPricing}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 16,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(241,245,249,.65) 100%)",
                      pointerEvents: "none", // mantém clique no card
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
