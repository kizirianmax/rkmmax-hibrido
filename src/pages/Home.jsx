import React from "react";
import { BRAND } from "../config/brand.js";


/**
 * Home — RKMMAX Infinity Matrix/Study
 * - Hero com a marca do BRAND.lockup
 * - Card do Serginho + CTA para /agents
 * - Preview dos especialistas + link
 * - Card de Planos + CTA para /pricing
 * - Design profissional com tema azul
 */

export default function Home() {
  return (
    <main style={sx.page} role="main" aria-label="Página inicial">
      {/* Header / Hero */}
      <header style={sx.hero} aria-labelledby="hero-title">
        <div style={sx.heroOverlay} aria-hidden />
        <h1 id="hero-title" style={sx.title}>
          Serginho e sua equipe de especialistas transformam o impossível em realidade
        </h1>

        <p style={sx.sub}>
          <strong>Serginho + Especialistas.</strong> E, quando precisar, o{" "}
          <strong>Study Lab</strong> (opcional) para estudo acelerado.
        </p>
      </header>

      {/* Serginho (orquestrador) */}
      <section style={sx.card} aria-labelledby="serginho-title">
        <div style={sx.row}>
          <img
            src="/avatars/serginho.png"
            alt="Avatar do Serginho (Orquestrador)"
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            style={sx.sergImg}
          />

          <div>
            <h2 id="serginho-title" style={sx.h2}>Serginho</h2>
            <p style={sx.role}>Orquestrador</p>
          </div>

          <span style={sx.badgePWA} aria-label="Disponível como aplicativo">
            ✨ APP
          </span>
        </div>

        <p style={sx.p}>
          Agente especial e generalista. Orquestra os especialistas, supervisiona
          e articula todas as interações para resolver <strong>qualquer tarefa</strong>.
        </p>

        <div style={{ display: "flex", gap: "10px", flexDirection: "column", marginTop: 16 }}>
          <a
            href="/serginho"
            style={sx.ctaPrimary}
            role="button"
            aria-label="Falar com o Serginho"
          >
            🤖 Falar com o Serginho
          </a>
          <a
            href="/specialists"
            style={sx.ctaSecondary}
            role="button"
            aria-label="Explorar Especialistas"
          >
            👥 Explorar Especialistas
          </a>
          <a
            href="/study"
            style={sx.ctaTertiary}
            role="button"
            aria-label="Abrir Study Lab"
          >
            📚 Abrir Study Lab
          </a>
          <a
            href="/hybrid"
            style={sx.ctaHybrid}
            role="button"
            aria-label="Agente Híbrido"
          >
            <img src="/avatars/hybrid.png" alt="Avatar do Agente Híbrido" style={sx.hybridAvatar} />
            Agente Híbrido
          </a>
          <a
            href="/pricing"
            style={sx.ctaOutline}
            role="button"
            aria-label="Ver Planos"
          >
            💳 Ver Planos
          </a>
        </div>
      </section>

      {/* Informações e Regulamento */}
      <section style={sx.infoCard} aria-labelledby="info-title">
        <div style={sx.infoHeader}>
          <div style={sx.infoIcon} aria-hidden>📜</div>
          <h3 id="info-title" style={sx.infoTitle}>Sobre o RKMMAX</h3>
        </div>

        <p style={sx.infoText}>
          Plataforma completa com <strong>47 especialistas de IA</strong> orquestrados pelo Serginho. 
          Pagamento seguro via <strong>Stripe</strong>, acesso imediato e suporte dedicado para 
          transformar suas ideias em realidade.
        </p>

        <div style={sx.benefitsList}>
          <div style={sx.benefitItem}>
            <span style={sx.benefitIcon}>✅</span>
            <span>SSL/TLS automático</span>
          </div>
          <div style={sx.benefitItem}>
            <span style={sx.benefitIcon}>✅</span>
            <span>Checkout Stripe seguro</span>
          </div>
          <div style={sx.benefitItem}>
            <span style={sx.benefitIcon}>✅</span>
            <span>PWA para Android/iOS</span>
          </div>
          <div style={sx.benefitItem}>
            <span style={sx.benefitIcon}>✅</span>
            <span>47 Especialistas + Serginho</span>
          </div>
        </div>

        <a 
          href="/regulamento" 
          style={sx.regulamentoButton}
          role="button"
          aria-label="Ver regulamento do projeto"
        >
          📜 Regulamento do Projeto
        </a>
      </section>

      <footer style={sx.footer}>
        <small style={sx.muted}>
          © {new Date().getFullYear()} {BRAND.master} — {BRAND.vertical}
        </small>
      </footer>


    </main>
  );
}

/* ─── design tokens / estilos AZUL PROFISSIONAL ─── */

const tone = {
  ink: "#0f172a",
  ink2: "#111827",
  mute: "#334155",
  soft: "#64748b",
  line: "rgba(148,163,184,.35)",
  bgCard: "#ffffff",
  // Gradientes azuis profissionais
  gradPrimary: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
  gradSecondary: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
  gradTertiary: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)",
  // Badge azul
  badgeGrad: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)"
};

const sx = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "28px 16px 56px",
    paddingBottom: "96px",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: tone.ink,
    lineHeight: 1.45
  },
  hero: { 
    marginBottom: 12,
    position: "relative",
    padding: "32px 20px",
    borderRadius: 16,
    background: "url('/hero-bg.png') center/cover no-repeat",
    overflow: "hidden"
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,58,138,0.7) 100%)",
    borderRadius: 16
  },
  title: {
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: -0.5,
    margin: "0 0 10px",
    position: "relative",
    zIndex: 1,
    color: "#ffffff",
    textShadow: "0 2px 8px rgba(0,0,0,0.5)"
  },
  sub: { margin: "0 0 24px", fontSize: 18, color: "rgba(255,255,255,0.95)", position: "relative", zIndex: 1, textShadow: "0 1px 4px rgba(0,0,0,0.4)" },

  card: {
    background: tone.bgCard,
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 20px rgba(2,8,23,.06), 0 2px 6px rgba(2,8,23,.04)",
    marginBottom: 16,
    border: "1px solid rgba(59,130,246,0.1)"
  },
  row: { display: "flex", gap: 16, alignItems: "center" },
  sergImg: {
    width: 64,
    height: 64,
    borderRadius: 14,
    objectFit: "cover",
    background: "linear-gradient(180deg, #1e40af, #3b82f6)",
    boxShadow: "inset 0 0 3px rgba(255,255,255,.6)",
    flexShrink: 0
  },
  badgePWA: {
    marginLeft: "auto",
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    background: tone.badgeGrad,
    boxShadow: "0 4px 12px rgba(30,64,175,.35)",
    backdropFilter: "blur(2px)",
    letterSpacing: "1px"
  },
  h2: { fontSize: 24, fontWeight: 900, margin: 0, color: tone.ink },
  h3: { margin: "18px 0 6px", fontSize: 18, fontWeight: 900, color: tone.ink2 },
  role: { margin: "2px 0 0", fontSize: 14, color: "#3b82f6", fontWeight: 600 },
  p: { margin: "12px 0", color: "#374151" },

  // Botões em tons de azul profissional
  ctaPrimary: {
    display: "block",
    padding: "14px 20px",
    textAlign: "center",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
    boxShadow: "0 4px 12px rgba(30,64,175,.35)",
    textDecoration: "none",
    touchAction: "manipulation"
  },
  ctaSecondary: {
    display: "block",
    padding: "14px 20px",
    textAlign: "center",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    boxShadow: "0 4px 12px rgba(29,78,216,.3)",
    textDecoration: "none",
    touchAction: "manipulation"
  },
  ctaTertiary: {
    display: "block",
    padding: "14px 20px",
    textAlign: "center",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)",
    boxShadow: "0 4px 12px rgba(3,105,161,.3)",
    textDecoration: "none",
    touchAction: "manipulation"
  },
  ctaHybrid: {
    display: "block",
    padding: "14px 20px",
    textAlign: "center",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    boxShadow: "0 4px 12px rgba(99,102,241,.35)",
    textDecoration: "none",
    touchAction: "manipulation"
  },
  hybridAvatar: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
    verticalAlign: "middle"
  },
  ctaOutline: {
    display: "block",
    padding: "14px 20px",
    textAlign: "center",
    borderRadius: 12,
    color: "#1e40af",
    fontWeight: 700,
    fontSize: 15,
    background: "transparent",
    border: "2px solid #3b82f6",
    boxShadow: "0 2px 8px rgba(59,130,246,.15)",
    textDecoration: "none",
    touchAction: "manipulation"
  },

  // Info Card
  infoCard: {
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    border: "1px solid rgba(59,130,246,0.2)"
  },
  infoHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  infoIcon: {
    fontSize: 24
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e40af",
    margin: 0
  },
  infoText: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 1.6,
    margin: "0 0 16px 0"
  },
  benefitsList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginBottom: 16
  },
  benefitItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#334155"
  },
  benefitIcon: {
    fontSize: 16
  },
  regulamentoButton: {
    display: "block",
    padding: "12px 20px",
    textAlign: "center",
    borderRadius: 12,
    color: "#1e40af",
    fontWeight: 700,
    fontSize: 14,
    background: "#fff",
    border: "1px solid #3b82f6",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(59,130,246,.1)"
  },

  footer: {
    textAlign: "center",
    marginTop: 32,
    paddingTop: 20,
    borderTop: "1px solid rgba(59,130,246,0.15)"
  },
  muted: {
    color: tone.soft,
    fontSize: 13
  }
};
