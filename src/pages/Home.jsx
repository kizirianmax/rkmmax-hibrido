import { BRAND } from "../config/brand.js";
import "./Home.css";

const PRIMARY_ACTIONS = [
  {
    href: "/serginho",
    label: "🤖 Falar com o Serginho",
    ariaLabel: "Falar com o Serginho",
    className: "rkm-btn-primary",
  },
  {
    href: "/specialists",
    label: "👥 Explorar Especialistas",
    ariaLabel: "Explorar Especialistas",
    className: "rkm-btn-secondary",
  },
  {
    href: "/study",
    label: "📚 Abrir Study Lab",
    ariaLabel: "Abrir Study Lab",
    className: "rkm-btn-secondary",
  },
  {
    href: "/pricing",
    label: "💳 Ver Planos",
    ariaLabel: "Ver Planos",
    className: "rkm-btn-ghost",
  },
];

export default function Home() {
  return (
    <main className="home-page" role="main" aria-label="Página inicial">
      <header className="home-page__hero rkm-card rkm-card-elevated" aria-labelledby="hero-title">
        <div className="home-page__hero-overlay" aria-hidden />
        <div className="home-page__hero-content">
          <span className="home-page__eyebrow">RKMMAX INFINITY MATRIX STUDY</span>
          <h1 id="hero-title" className="home-page__title">
            Serginho e sua equipe de especialistas transformam o impossível em realidade
          </h1>
          <p className="home-page__subtitle">
            <strong>Serginho + Especialistas.</strong> E, quando precisar, o{" "}
            <strong>Study Lab</strong> (opcional) para estudo acelerado.
          </p>
        </div>
      </header>

      <div className="home-page__content-grid">
        <section className="home-page__panel rkm-card rkm-card-elevated" aria-labelledby="serginho-title">
          <div className="home-page__panel-header">
            <div className="home-page__identity">
              <img
                src="/avatars/serginho.png"
                alt="Avatar do Serginho (Orquestrador)"
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="home-page__avatar"
              />

              <div>
                <h2 id="serginho-title" className="home-page__panel-title">
                  Serginho
                </h2>
                <p className="home-page__role">Orquestrador</p>
              </div>
            </div>

            <span className="home-page__app-badge" aria-label="Disponível como aplicativo">
              ✨ APP
            </span>
          </div>

          <p className="home-page__body">
            Agente especial e generalista. Orquestra os especialistas, supervisiona e
            articula todas as interações para resolver <strong>qualquer tarefa</strong>.
          </p>

          <div className="home-page__cta-grid">
            {PRIMARY_ACTIONS.map((action) => (
              <a
                key={action.href}
                href={action.href}
                className={`home-page__cta ${action.className}`}
                role="button"
                aria-label={action.ariaLabel}
              >
                {action.label}
              </a>
            ))}

            <a
              href="/hybrid"
              className="home-page__cta rkm-btn-secondary home-page__cta--hybrid"
              role="button"
              aria-label="Agente Híbrido"
            >
              <img src="/avatars/hybrid.png" alt="Avatar do Agente Híbrido" className="home-page__hybrid-avatar" />
              Agente Híbrido
            </a>
          </div>
        </section>

        <section className="home-page__panel home-page__panel--info rkm-card" aria-labelledby="info-title">
          <div className="home-page__info-header">
            <div className="home-page__info-icon" aria-hidden>
              📜
            </div>
            <div>
              <p className="home-page__section-kicker">Visão geral</p>
              <h2 id="info-title" className="home-page__panel-title">
                Sobre o RKMMAX
              </h2>
            </div>
          </div>

          <p className="home-page__body">
            Plataforma completa com <strong>47 especialistas de IA</strong> orquestrados pelo
            Serginho. Pagamento seguro via <strong>Stripe</strong>, acesso imediato e suporte
            dedicado para transformar suas ideias em realidade.
          </p>

          <div className="home-page__benefits">
            <div className="home-page__benefit">
              <span className="home-page__benefit-icon">✅</span>
              <span>SSL/TLS automático</span>
            </div>
            <div className="home-page__benefit">
              <span className="home-page__benefit-icon">✅</span>
              <span>Checkout Stripe seguro</span>
            </div>
            <div className="home-page__benefit">
              <span className="home-page__benefit-icon">✅</span>
              <span>PWA para Android/iOS</span>
            </div>
            <div className="home-page__benefit">
              <span className="home-page__benefit-icon">✅</span>
              <span>47 Especialistas + Serginho</span>
            </div>
          </div>

          <a
            href="/regulamento"
            className="home-page__cta home-page__cta--full rkm-btn-secondary"
            role="button"
            aria-label="Ver regulamento do projeto"
          >
            📜 Regulamento do Projeto
          </a>
        </section>
      </div>

      <footer className="home-page__footer">
        <small className="home-page__footer-copy">
          © {new Date().getFullYear()} {BRAND.master} — {BRAND.vertical}
        </small>
      </footer>
    </main>
  );
}
