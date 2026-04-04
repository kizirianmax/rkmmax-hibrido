// src/pages/PlansScreen.jsx
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

/** Payment Links via variáveis de ambiente e rótulos por plano/região */
const PLANS = {
  BR: [
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
  ],
  US: [
    {
      planKey: "basic_us",
      icon: "🔹",
      name: "Basic",
      price: "$20/month",
      features: [
        "Serginho orchestrator",
        "All specialists",
        "100 credits/day · 3,000/month",
        "Basic support",
      ],
      examples: [
        "100 common interactions per day",
        "12 heavy executions + 4 questions",
      ],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US || "",
      priceId: null,
      cta: "Subscribe Basic",
    },
    {
      planKey: "inter_us",
      icon: "⚡",
      name: "Intermediate",
      price: "$48/month",
      features: [
        "Everything in Basic",
        "200 credits/day · 6,000/month",
        "Voice (Whisper + TTS)",
        "Priority support",
      ],
      examples: [
        "200 common interactions per day",
        "25 heavy executions per day",
      ],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US || "",
      priceId: null,
      cta: "Subscribe Intermediate",
    },
    {
      planKey: "prem_us",
      icon: "💎",
      name: "Premium",
      price: "$149/month",
      features: [
        "Everything in Intermediate",
        "600 credits/day · 18,000/month",
        "Advanced models",
        "24/7 support",
      ],
      examples: [
        "600 common interactions per day",
        "75 heavy executions per day",
      ],
      payLink: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US || "",
      priceId: null,
      cta: "Subscribe Premium",
    },
  ],
};

export default function PlansScreen() {
  // Admin mode: permite alternar entre BR/US
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem("rkmmax_admin") === "true";
  });
  const [adminRegion, setAdminRegion] = useState(() => {
    return localStorage.getItem("rkmmax_admin_region") || "BR";
  });
  const [logoClicks, setLogoClicks] = useState(0);

  const detectedRegion = useMemo(detectRegion, []);
  const region = isAdminMode ? adminRegion : detectedRegion;
  const [loading, setLoading] = useState("");
  const plans = PLANS[region] || PLANS.BR;

  // Ativar modo admin: clicar 3x no logo
  React.useEffect(() => {
    if (logoClicks >= 3 && !isAdminMode) {
      localStorage.setItem("rkmmax_admin", "true");
      setIsAdminMode(true);
      setLogoClicks(0);
      alert("🔧 Modo Admin Ativado!");
    }
  }, [logoClicks, isAdminMode]);

  const toggleAdminRegion = () => {
    const newRegion = adminRegion === "BR" ? "US" : "BR";
    setAdminRegion(newRegion);
    localStorage.setItem("rkmmax_admin_region", newRegion);
  };

  async function startCheckout(plan) {
    try {
      setLoading(plan.planKey);

      // 1) tenta via API da Vercel (se você tiver /api/checkout configurado)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: plan.planKey,
          region,
          priceId: plan.priceId, // use se seu backend aceitar price_id
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const { url } = await res.json();
        if (url) {
          window.location.href = url;
          return;
        }
      }

      // 2) fallback: Payment Link
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
      <header style={{ marginBottom: 24, position: "relative" }}>
        <h1
          style={{ margin: 0, cursor: "pointer", display: "inline-block" }}
          onClick={() => setLogoClicks((prev) => prev + 1)}
          title="Clique 3x para ativar modo admin"
        >
          Escolha seu Plano
        </h1>
        <p style={{ opacity: 0.8, margin: "8px 0 4px" }}>
          Região detectada: <b>{region}</b>
        </p>

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
          {region === "BR" ? (
            <>
              <b>Como funciona:</b> você tem um saldo único de créditos — use em qualquer parte do sistema.
              {" "}Interações comuns = <b>1 crédito</b>. Execuções pesadas = <b>8 créditos</b>.
              Sem limite separado por ferramenta.
            </>
          ) : (
            <>
              <b>How it works:</b> you have a single credit balance — use it anywhere in the platform.
              {" "}Common interactions = <b>1 credit</b>. Heavy executions = <b>8 credits</b>.
              No separate limit per tool.
            </>
          )}
        </div>

        {/* Botão Admin - só aparece quando ativado */}
        {isAdminMode && (
          <div
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 9999,
              background: "#1a1a1a",
              color: "white",
              padding: "12px 16px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.8 }}>🔧 ADMIN</span>
            <button
              onClick={toggleAdminRegion}
              style={{
                background: adminRegion === "BR" ? "#0070f3" : "#10b981",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              {adminRegion === "BR" ? "🇧🇷 BR" : "🇺🇸 US"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("rkmmax_admin");
                localStorage.removeItem("rkmmax_admin_region");
                setIsAdminMode(false);
                alert("Modo admin desativado");
              }}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
              }}
              title="Desativar modo admin"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      <section
        className="plans-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {plans.map((p) => (
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
                  {region === "BR" ? "Exemplos/dia:" : "Examples/day:"}
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
