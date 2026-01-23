// src/pages/AppInfo.jsx
import React from "react";
import { Link } from "react-router-dom";

// ✅ Coloque seu número (DDI+DDD+número). Ex: 5511999999999
const WHATSAPP_NUMBER = "55SEUNUMEROAQUI";

function openWhatsAppEmergency() {
  const ok = window.confirm(
    "Canal de EMERGÊNCIA (humano).\n\n" +
      "Use apenas se o chat inteligente (Serginho) falhar ou for um caso crítico.\n\n" +
      "Deseja abrir o WhatsApp agora?"
  );
  if (!ok) return;

  const text = "Suporte crítico: preciso de ajuda com meu projeto (Serginho).";
  const appDeepLink = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
  const webFallback = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  // tenta abrir o app
  window.location.href = appDeepLink;
  // fallback web
  setTimeout(() => {
    window.open(webFallback, "_blank", "noopener,noreferrer");
  }, 600);
}

export default function AppInfo() {
  return (
    <div style={{ padding: "1.5rem", color: "#e6eef5" }}>
      <h1 style={{ marginBottom: 8 }}>Informações do aplicativo</h1>
      <p style={{ opacity: 0.9 }}>
        Nosso suporte é <strong>100% inteligente</strong> com o <strong>Serginho</strong>, que
        orquestra os 12 especialistas. Para quase todos os casos, use o botão <em>“Chat no app”</em>{" "}
        na lista de agentes.
      </p>

      <div
        style={{
          marginTop: 16,
          background: "rgba(255,255,255,.06)",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 8px 18px rgba(0,0,0,.25)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Como usar</h3>
        <ul style={{ lineHeight: 1.6 }}>
          <li>
            Escolha o <strong>Serginho</strong> para ele orquestrar tudo para você.
          </li>
          <li>
            Ou fale direto com um <strong>especialista</strong> se já souber o foco.
          </li>
          <li>
            Envie sua mensagem no <strong>chat do app</strong> e acompanhe por aqui.
          </li>
        </ul>

        <h3>FAQ rápido</h3>
        <ul style={{ lineHeight: 1.6 }}>
          <li>
            <strong>Preciso do WhatsApp?</strong> Não. O chat do app resolve 99% dos casos.
          </li>
          <li>
            <strong>Quando usar humano?</strong> Só em emergência (bug grave, acesso, cobrança,
            denúncia).
          </li>
          <li>
            <strong>Privacidade:</strong> conversas do app ficam no app; WhatsApp é opcional.
          </li>
        </ul>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px dashed rgba(255,255,255,.25)",
            background: "rgba(255,255,255,.04)",
          }}
        >
          <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.9 }}>
            <strong>Canal de emergência (humano)</strong>
            <br />
            Use somente se o chat inteligente não resolver ou estiver indisponível.
          </div>

          <button
            onClick={openWhatsAppEmergency}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #25d366",
              background: "rgba(37,211,102,.12)",
              color: "#e6eef5",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Abrir canal humano no WhatsApp (com confirmação)"
          >
            ⚠ Abrir suporte humano (WhatsApp)
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link to="/agents" style={{ color: "#15d0d4" }}>
          ← Voltar para os agentes
        </Link>
      </div>
    </div>
  );
}
