// src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

const PLAN_STORAGE_KEY = "rkm.plan"; // mantém o plano escolhido

// Mapeia id -> nome do agente (ajuste livre)
const AGENTS = {
  serginho: "Serginho",
  emo: "Emo",
  didak: "Didak",
};

function usePlan() {
  const [search] = useSearchParams();
  const nav = useNavigate();
  const [plan, setPlan] = useState(() => {
    return search.get("plan") || localStorage.getItem(PLAN_STORAGE_KEY) || "free";
  });

  useEffect(() => {
    const q = search.get("plan");
    if (q) {
      setPlan(q);
      localStorage.setItem(PLAN_STORAGE_KEY, q);
      // limpa o query param para a URL ficar bonita
      nav(".", { replace: true });
    }
  }, [search, nav]);

  const label = useMemo(() => {
    const map = { free: "Gratuito", basic: "Básico", mid: "Intermediário", premium: "Premium" };
    return map[plan] || "Gratuito";
  }, [plan]);

  return { plan, label, setPlan };
}

export default function Chat() {
  const { id } = useParams(); // /chat/:id
  const agentName = AGENTS[id] || "Assistente";
  const { plan, label } = usePlan();

  // chat local (placeholder)
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: `Olá! Sou ${agentName}. Como posso ajudar?` },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function handleSend(e) {
    e?.preventDefault?.();
    const content = input.trim();
    if (!content) return;

    // adiciona mensagem do usuário
    setMsgs((m) => [...m, { role: "user", text: content }]);
    setInput("");

    // resposta fake local (substitua depois pela sua API de chat)
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Recebi sua mensagem. (Demo de chat local) — " +
            "integração real pode ser ligada ao seu backend/funções.",
        },
      ]);
    }, 400);
  }

  return (
    <div style={styles.page}>
      {/* Navbar mínima da página de chat */}
      <header style={styles.header}>
        <Link to="/agents" style={styles.linkBack}>
          ← Voltar
        </Link>
        <div style={{ flex: 1 }} />
        <Link to="/pricing" style={styles.linkTop}>
          Planos
        </Link>
      </header>

      {/* Banner de plano/upgrade */}
      <div style={styles.planBanner}>
        <div style={{ fontWeight: 700 }}>Plano atual: {label}</div>
        <div style={{ opacity: 0.85 }}>
          Precisa de mais limite ou recursos?{" "}
          <Link to="/pricing" style={styles.linkInline}>
            Ver planos
          </Link>
        </div>
      </div>

      {/* Cabeçalho do agente */}
      <div style={styles.agentHeader}>
        <h1 style={styles.h1}>{agentName}</h1>
        <p style={styles.subtitle}>Converse à vontade. Respeitamos seu plano atual.</p>
      </div>

      {/* Área do chat */}
      <div ref={listRef} style={styles.chatArea}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant),
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={styles.form}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva sua mensagem..."
          style={styles.input}
        />
        <button type="submit" style={styles.sendBtn}>
          Enviar
        </button>
      </form>
    </div>
  );
}

/* ===== estilos inline (simples e responsivos) ===== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#0f172a,#0b1220)",
    color: "#e6eef5",
    display: "grid",
    gridTemplateRows: "auto auto auto 1fr auto",
    gap: 12,
  },
  header: {
    display: "flex",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    background: "rgba(255,255,255,.03)",
  },
  linkBack: { textDecoration: "none", color: "#e6eef5", fontWeight: 600 },
  linkTop: {
    textDecoration: "none",
    color: "#a5d8ff",
    border: "1px solid rgba(165,216,255,.35)",
    padding: "6px 10px",
    borderRadius: 8,
    fontWeight: 600,
  },
  linkInline: { color: "#a5d8ff", textDecoration: "underline" },
  planBanner: {
    margin: "0 16px",
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(59,130,246,.08)",
    border: "1px dashed rgba(59,130,246,.35)",
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentHeader: { padding: "8px 16px 0" },
  h1: { margin: "6px 0 0", fontSize: 24 },
  subtitle: { margin: "4px 0 0", color: "#9aa4b2" },
  chatArea: {
    margin: "6px 16px 0",
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.06)",
    overflowY: "auto",
  },
  bubble: {
    maxWidth: 680,
    padding: "10px 12px",
    borderRadius: 12,
    margin: "6px 0",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },
  bubbleUser: {
    marginLeft: "auto",
    background: "linear-gradient(180deg,#2563eb,#1d4ed8)",
    border: "1px solid rgba(37,99,235,.5)",
  },
  bubbleAssistant: {
    marginRight: "auto",
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.08)",
  },
  form: {
    display: "flex",
    gap: 8,
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,.06)",
    background: "rgba(255,255,255,.03)",
  },
  input: {
    flex: 1,
    padding: "12px 14px",
    background: "rgba(255,255,255,.06)",
    color: "#e6eef5",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 10,
    outline: "none",
  },
  sendBtn: {
    padding: "12px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
};
