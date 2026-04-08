// src/pages/PlansScreen.jsx
import React, { useState } from "react";

/** Planos públicos — Brasil */
const PLANS = [
  {
    planKey: "basic_br",
    icon: "🔹",
    name: "Básico",
    price: "R$ 65,00/mês",
    features: [
      "Serginho (orquestrador)",
      "Todos os especialistas e ABNT",
      "100 créditos/dia · 3.000/mês",
      "Suporte inicial",
    ],
    examples: [
      "100 perguntas comuns por dia",
      "12 execuções pesadas + 4 perguntas",
    ],
    payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR || "",
    priceId: null,
    cta: "Assinar Básico",
  },
  {
    planKey: "inter_br",
    icon: "⚡",
    name: "Intermediário",
    price: "R$ 119,00/mês",
    features: [
      "Tudo do Básico",
      "200 créditos/dia · 6.000/mês",
      "Voz (Whisper + TTS)",
      "Suporte prioritário",
    ],
    examples: [
      "200 perguntas comuns por dia",
      "25 execuções pesadas por dia",
    ],
    payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR || "",
    priceId: null,
    cta: "Assinar Intermediário",
  },
  {
    planKey: "prem_br",
    icon: "💎",
    name: "Premium",
    price: "R$ 379,00/mês",
    features: [
      "Tudo do Intermediário",
      "600 créditos/dia · 18.000/mês",
      "Modelos avançados",
      "Suporte 24/7",
    ],
    examples: [
      "600 perguntas comuns por dia",
      "75 execuções pesadas por dia",
      "50 execuções pesadas + 200 perguntas",
    ],
    payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR || "",
    priceId: "price_1S7TM1ENxlkCT0yfGHMGJ9Rh",
    cta: "Assinar Premium",
  },
];

export default function PlansScreen() {
  const [loading, setLoading] = useState("");

  async function startCheckout(plan) {
    try {
      setLoading(plan.planKey);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: plan.planKey,
          priceId: plan.priceId,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const { url } = await res.json();
        if (url) {
          window.location.href = url;
          return;
        }
      }

      if (plan.payLink) {
        window.location.href = plan.payLink;
        return;
      }

      alert("Link de pagamento ainda não configurado para este plano.");
    } catch (e) {
      console.error(e);
      alert("Não foi possível iniciar o checkout agora.");
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="container" style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Escolha seu Plano</h1>

        {/* Resumo do modelo de créditos */}
        <div
          style={{
            margin: "12px 0 0",
            padding: "12px 16px",
            background: "rgba(0,112,243,0.06)",
            borderRadius: 10,
            maxWidth: 540,
            fontSize: 13,
          }}
        >
          <b>Como funciona:</b> você tem um saldo único de créditos — use em qualquer parte do
          sistema. Interações comuns = <b>1 crédito</b>. Execuções pesadas = <b>8 créditos</b>.
          Sem limite separado por ferramenta.
        </div>
      </header>

      <section
        className="plans-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {PLANS.map((p) => (
          <article
            key={p.planKey}
            className="card plan-card"
            style={{
              border: "1px solid #e7e7e7",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }} aria-hidden>
                {p.icon}
              </span>
              <h2 style={{ margin: 0 }}>{p.name}</h2>
            </div>

            <div style={{ fontSize: 18, marginTop: 8 }}>{p.price}</div>

            <ul style={{ marginTop: 12, paddingLeft: 18 }}>
              {p.features.map((f, i) => (
                <li key={i}>✔ {f}</li>
              ))}
            </ul>

            {p.examples && p.examples.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "rgba(0,0,0,0.04)",
                  borderRadius: 8,
                }}
              >
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 12, color: "#334155" }}>
                  Exemplos/dia:
                </p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {p.examples.map((ex, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#475569" }}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => startCheckout(p)}
              disabled={loading === p.planKey}
              aria-busy={loading === p.planKey}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: p.planKey.includes("prem")
                  ? "#6e2cf4"
                  : p.planKey.includes("inter")
                    ? "#4f8cff"
                    : "#2eb88a",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading === p.planKey ? "Redirecionando..." : p.cta}
            </button>
          </article>
        ))}
      </section>

      <footer style={{ marginTop: 24, opacity: 0.8 }}>
        <small>© {new Date().getFullYear()} RKMMax</small>
      </footer>
    </main>
  );
}

