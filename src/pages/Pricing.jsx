// src/pages/Pricing.jsx
import React, { useMemo, useState } from "react";

/** Detecta região pelo locale do navegador */
function detectRegion() {
  try {
    const loc = (Intl.DateTimeFormat().resolvedOptions().locale || "pt-BR").toLowerCase();
    return loc.includes("pt") || loc.includes("br") ? "BR" : "US";
  } catch {
    return "BR";
  }
}

/** Payment Links via variáveis de ambiente por plano/região */
const PLANS = {
  BR: [
    {
      planKey: "basic_br",
      icon: "🔹",
      name: "Básico",
      price: "R$ 25,00/mês",
      description: "Acesso ao Serginho e funções essenciais.",
      features: ["Serginho (orquestrador)", "Todos os especialistas", "Limite diário de tokens", "Suporte inicial"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR || "",
      cta: "Assinar Básico",
    },
    {
      planKey: "inter_br",
      icon: "⚡",
      name: "Intermediário",
      price: "R$ 50,00/mês",
      description: "Mais tokens, voz e recursos avançados.",
      features: ["Tudo do Básico", "Mais tokens/dia", "Voz (Whisper + TTS)", "Suporte prioritário"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR || "",
      cta: "Assinar Intermediário",
    },
    {
      planKey: "prem_br",
      icon: "💎",
      name: "Premium",
      price: "R$ 90,00/mês",
      description: "Acesso total aos especialistas e recursos premium.",
      features: ["Tudo do Intermediário", "GPT-5 Std + GPT-4.1 Mini", "12 especialistas + Orquestrador", "Suporte 24/7"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR || "",
      cta: "Assinar Premium",
    },
    {
      planKey: "ultra_br",
      icon: "🚀",
      name: "Ultra",
      price: "R$ 150,00/mês",
      description: "Uso ilimitado com compliance e SLA dedicado.",
      features: ["Sem limite de tokens/dia", "Sem limite mensal", "LGPD/GDPR/SLA", "Suporte VIP"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_ULTRA_BR || "",
      cta: "Assinar Ultra",
    },
    {
      planKey: "dev_br",
      icon: "🛠️",
      name: "Dev",
      price: "Plano interno",
      description: "Ambiente de desenvolvimento sem limites.",
      features: ["Sem limite de tokens", "Todos os modelos", "Acesso total", "Uso interno"],
      payLink: "",
      cta: "Contato",
    },
  ],
  US: [
    {
      planKey: "basic_us",
      icon: "🔹",
      name: "Basic",
      price: "$10/month",
      description: "Orchestrator access and core features.",
      features: ["Serginho orchestrator", "All specialists", "Daily token limit", "Basic support"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US || "",
      cta: "Subscribe Basic",
    },
    {
      planKey: "inter_us",
      icon: "⚡",
      name: "Intermediate",
      price: "$20/month",
      description: "More tokens, voice and advanced features.",
      features: ["Everything in Basic", "Higher daily limits", "Voice (Whisper + TTS)", "Priority support"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US || "",
      cta: "Subscribe Intermediate",
    },
    {
      planKey: "prem_us",
      icon: "💎",
      name: "Premium",
      price: "$30/month",
      description: "Full access to specialists and premium features.",
      features: ["Everything in Intermediate", "GPT-5 Std + GPT-4.1 Mini", "All specialists", "24/7 support"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US || "",
      cta: "Subscribe Premium",
    },
    {
      planKey: "ultra_us",
      icon: "🚀",
      name: "Ultra",
      price: "$60/month",
      description: "Unlimited usage with compliance and dedicated SLA.",
      features: ["Unlimited tokens/day", "Unlimited monthly", "GDPR/SLA", "VIP support"],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_ULTRA_US || "",
      cta: "Subscribe Ultra",
    },
    {
      planKey: "dev_us",
      icon: "🛠️",
      name: "Dev",
      price: "Internal plan",
      description: "Development environment with no limits.",
      features: ["Unlimited tokens", "All models", "Full access", "Internal use"],
      payLink: "",
      cta: "Contact",
    },
  ],
};

const FAQ = [
  {
    q: "Posso usar para estudo?",
    a: "Sim! Acesse o Study Lab (opcional) para estudo acelerado com ABNT/APA, cronogramas e fontes verificadas.",
  },
  {
    q: "Há desconto educacional?",
    a: "Sim! Use o código EDU50 no checkout para 50% OFF nos primeiros 6 meses.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Pagamentos processados com segurança pela Stripe. Cancele a qualquer momento.",
  },
];

function planAccentColor(planKey) {
  if (planKey.includes("ultra")) return "#7c3aed";
  if (planKey.includes("prem")) return "#0f172a";
  if (planKey.includes("inter")) return "#0070f3";
  if (planKey.includes("dev")) return "#475569";
  return "#334155";
}

function PlanCard({ plan, onCheckout, isLoading }) {
  const hasLink = Boolean(plan.payLink);
  const isDev = plan.planKey.includes("dev");
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
      <div style={{ marginTop: 16 }}>
        {isDev ? (
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
            {plan.cta}
          </button>
        ) : hasLink ? (
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
  const region = useMemo(detectRegion, []);
  const plans = PLANS[region] || PLANS.BR;
  const [loading, setLoading] = useState("");

  async function startCheckout(plan) {
    try {
      setLoading(plan.planKey);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: plan.planKey, region }),
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800 }}>Planos RKMMAX</h1>
      </div>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>Região detectada: <b>{region}</b></p>

      {plans.map((p) => (
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
