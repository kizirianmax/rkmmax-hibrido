// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";

// Links de pagamento (Payment Links) por região e plano via variáveis de ambiente
const LINKS = {
  BR: {
    basic: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR || "",
    pro: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR || "",
    premium: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR || "",
    labels: {
      basic: "Básico — R$ 25,00/mês",
      pro: "Intermediário — R$ 50,00/mês",
      premium: "Premium — R$ 90,00/mês",
    },
  },
  US: {
    basic: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US || "",
    pro: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US || "",
    premium: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US || "",
    labels: {
      basic: "Basic — $10/month",
      pro: "Intermediate — $20/month",
      premium: "Premium — $30/month",
    },
  },
};

// Detecção simples de região pelo idioma do navegador
function detectRegion() {
  const lang = (navigator.language || "en-US").toLowerCase();
  return lang.startsWith("pt") ? "BR" : "US";
}

export default function Subscribe() {
  const [region, setRegion] = useState(detectRegion());

  const R = useMemo(() => (region === "BR" ? LINKS.BR : LINKS.US), [region]);

  const go = (planKey) => {
    const url = R[planKey];
    if (!url) {
      alert("Link ainda não disponível para este plano.");
      return;
    }
    window.location.href = url; // redireciona direto para a Stripe
  };

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h1>Assinar</h1>
      <p>
        Região detectada: <b>{region}</b>
      </p>

      {/* Botões para trocar manualmente BR/US (útil para testes) */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setRegion("BR")} style={{ marginRight: 8 }}>
          BR
        </button>
        <button onClick={() => setRegion("US")}>US</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <button onClick={() => go("basic")}>{R.labels.basic}</button>
        <button onClick={() => go("pro")}>{R.labels.pro}</button>
        <button onClick={() => go("premium")}>{R.labels.premium}</button>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        * O valor exibido é apenas rótulo de UI; a cobrança é definida pelo Payment Link da Stripe.
      </p>
    </div>
  );
}
