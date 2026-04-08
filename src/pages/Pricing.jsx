// src/pages/Pricing.jsx
import React, { useState } from "react";

/** Planos públicos — Brasil */
const PLANS = [
  {
    planKey: "basic_br",
    icon: "🔹",
    name: "Básico",
    price: "R$ 65,00/mês",
    description: "Acesso ao Serginho e todas as ferramentas essenciais.",
    features: [
      "Serginho (orquestrador)",
      "Todos os especialistas",
      "ABNT e Study Lab",
      "100 créditos/dia · 3.000/mês",
      "Suporte inicial",
    ],
    examples: [
      "100 perguntas comuns por dia",
      "12 execuções pesadas + 4 perguntas",
    ],
    payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR || "",
    cta: "Assinar Básico",
  },
  {
    planKey: "inter_br",
    icon: "⚡",
    name: "Intermediário",
    price: "R$ 119,00/mês",
    description: "Mais créditos para uso intenso no dia a dia.",
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
    cta: "Assinar Intermediário",
  },
  {
    planKey: "prem_br",
    icon: "💎",
    name: "Premium",
    price: "R$ 379,00/mês",
    description: "Volume total para uso profissional e de agência.",
    features: [
      "Tudo do Intermediário",
      "600 créditos/dia · 18.000/mês",
      "Modelos avançados",
      "Todos os especialistas",
      "Suporte 24/7",
    ],
    examples: [
      "600 perguntas comuns por dia",
      "75 execuções pesadas por dia",
      "50 execuções pesadas + 200 perguntas",
    ],
    payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR || "",
    cta: "Assinar Premium",
  },
];

const FAQ = [
  {
    q: "O que é um crédito?",
    a: "Crédito é a unidade de consumo da plataforma. Interações comuns (Serginho, especialistas, ABNT) consomem 1 crédito. Execuções pesadas (Construtor, Híbrido, fluxos multi-etapa) consomem 8 créditos.",
  },
  {
    q: "O saldo é separado por ferramenta?",
    a: "Não. Você tem um saldo único de créditos e usa onde quiser — Serginho, Especialistas, Construtor ou ABNT. A plataforma desconta conforme a complexidade real da execução.",
  },
  {
    q: "Posso usar para estudo?",
    a: "Sim! Acesse o Study Lab para estudo acelerado com ABNT/APA, cronogramas e fontes verificadas.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Pagamentos processados com segurança pela Stripe. Cancele a qualquer momento.",
  },
];

function planAccentColor(planKey) {
  if (planKey.includes("prem")) return "#0f172a";
  if (planKey.includes("inter")) return "#0070f3";
  return "#334155";
}

function PlanCard({ plan, onCheckout, isLoading }) {
  const hasLink = Boolean(plan.payLink);
  const borderColor = planAccentColor(plan.planKey);

  return (
    <article
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        background: "transparent",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 24 }} aria-hidden={true}>{plan.icon}</span>
        <h2 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>{plan.name}</h2>
      </div>
      <p style={{ margin: "6px 0", fontSize: 20, fontWeight: 700 }}>{plan.price}</p>
      <p style={{ margin: "6px 0", color: "#64748b" }}>{plan.description}</p>
      <ul style={{ marginTop: 12 }}>
        {plan.features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      {plan.examples && plan.examples.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(0,0,0,0.04)", borderRadius: 10 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Exemplos de uso/dia:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plan.examples.map((ex, i) => (
              <li key={i} style={{ fontSize: 13, color: "#475569" }}>{ex}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {hasLink ? (
          <button
            onClick={() => onCheckout(plan)}
            disabled={isLoading}
            style={{
              display: "inline-block",
              padding: "10px 16px",
              fontWeight: 800,
              borderRadius: 12,
              background: "#22d3ee",
              color: "#000",
              border: "none",
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? "Redirecionando..." : plan.cta}
          </button>
        ) : (
          <button
            disabled
            style={{
              padding: "10px 16px",
              fontWeight: 800,
              borderRadius: 12,
              background: "#475569",
              color: "#cbd5e1",
              border: "none",
              cursor: "not-allowed",
            }}
          >
            Indisponível
          </button>
        )}
      </div>
    </article>
  );
}

export default function Pricing() {
  const [loading, setLoading] = useState("");

  async function startCheckout(plan) {
    try {
      setLoading(plan.planKey);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: plan.planKey }),
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
    <main style={{ minHeight: "100vh", padding: "32px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Planos RKMMAX</h1>

      {/* Como funciona o consumo */}
      <div
        style={{
          marginBottom: 32,
          padding: "16px 20px",
          background: "rgba(0,112,243,0.06)",
          borderRadius: 12,
          maxWidth: 560,
        }}
      >
        <p style={{ fontWeight: 700, margin: "0 0 8px" }}>Como funciona o consumo?</p>
        <p style={{ margin: "0 0 4px", fontSize: 14 }}>
          Você tem um saldo único de créditos — use onde quiser no sistema.
        </p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 14 }}>
          <li>Interações comuns (Serginho, Especialistas, ABNT) = 1 crédito</li>
          <li>Execuções pesadas (Construtor, Híbrido, fluxos multi-etapa) = 8 créditos</li>
        </ul>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#475569" }}>
          Não existe limite separado por ferramenta. O peso depende da execução real.
        </p>
      </div>

      {PLANS.map((p) => (
        <PlanCard
          key={p.planKey}
          plan={p}
          onCheckout={startCheckout}
          isLoading={loading === p.planKey}
        />
      ))}

      {/* FAQ */}
      <section style={{ marginTop: 48, maxWidth: 720 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Perguntas Frequentes</h2>
        {FAQ.map((item, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.q}</h3>
            <p style={{ color: "#64748b" }}>{item.a}</p>
          </div>
        ))}
      </section>

      <p style={{ marginTop: 24, color: "#64748b", fontSize: 12 }}>
        Pagamentos processados com segurança pela Stripe.
      </p>
    </main>
  );
}

