// src/pages/AgentDetail.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import AGENTS from "../data/agents.js";

// ===== Configurações =====
const SHOW_HUMAN_SUPPORT = true; // torne false para ocultar
const WHATSAPP_NUMBER = "55SEUNUMEROAQUI"; // DDI+DDD+número

function openWhatsAppEmergency(agent) {
  const text =
    agent?.id === "serginho"
      ? "Suporte crítico: preciso de ajuda com meu projeto (Serginho)."
      : `Suporte crítico sobre o especialista ${agent?.name} (orquestrado pelo Serginho).`;

  const appDeepLink = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
  const webFallback = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  window.location.href = appDeepLink;
  setTimeout(() => {
    window.open(webFallback, "_blank", "noopener,noreferrer");
  }, 600);
}

export default function AgentDetail() {
  const { id } = useParams();
  const agent = AGENTS.find((a) => a.id === id);

  if (!agent) {
    return (
      <div style={{ padding: "1.5rem", color: "#e6eef5" }}>
        <h1>Agente não encontrado</h1>
        <Link to="/agents" style={{ color: "#15d0d4" }}>
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", color: "#e6eef5" }}>
      <Link to="/agents" style={{ color: "#15d0d4" }}>
        ← Voltar
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <img
          src={agent.avatar_url}
          alt={agent.name}
          width={60}
          height={60}
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
        <div>
          <h2 style={{ margin: 0 }}>
            {agent.name}{" "}
            {agent.principal && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(21,208,212,.15)",
                  color: "#15d0d4",
                }}
              >
                Principal
              </span>
            )}
          </h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>{agent.role}</p>
        </div>
      </div>

      <p style={{ marginTop: 12, color: "#ddd" }}>{agent.description}</p>

      {/* Ação principal */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Link
          to={`/chat/${agent.id}`}
          style={{
            flex: 1,
            textAlign: "center",
            textDecoration: "none",
            color: "#e6eef5",
            border: "1px solid #15d0d4",
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(21,208,212,.15)",
            fontWeight: 600,
          }}
        >
          💬 Chat no app
        </Link>
      </div>

      {/* Suporte humano discreto */}
      {SHOW_HUMAN_SUPPORT && (
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <button
            onClick={() => openWhatsAppEmergency(agent)}
            style={{
              background: "transparent",
              border: "none",
              color: "#9fe5b5",
              fontSize: 12,
              opacity: 0.8,
              textDecoration: "underline",
              cursor: "pointer",
            }}
            title="Use apenas se o chat falhar ou for crítico"
          >
            ⚠ Suporte humano (WhatsApp)
          </button>
        </div>
      )}
    </div>
  );
}
