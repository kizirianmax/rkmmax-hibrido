import { BRAND } from "../config/brand.js";
import "./Home.css";

export default function Home() {
  return (
    <main className="home-page" role="main" aria-label="Página inicial">
      <header className="home-page__hero rkm-card rkm-card-elevated" aria-labelledby="hero-title">
        <div className="home-page__hero-overlay" aria-hidden />
        <div className="home-page__hero-content">
          <span className="home-page__eyebrow">RKMMAX • IA orquestrada</span>
          <h1 id="hero-title" className="home-page__title">
            Serginho e sua equipe de especialistas transformam o impossível em realidade
          </h1>

          <p className="home-page__subtitle">
            <strong>Serginho + Especialistas.</strong> E, quando precisar, o <strong>Study Lab</strong> (opcional)
            para estudo acelerado.
          </p>

          <div className="home-page__hero-actions">
            <a
              href="/serginho"
              className="home-page__hero-cta rkm-btn rkm-btn-primary"
              aria-label="Falar com o Serginho"
            >
              🤖 Falar com o Serginho
            </a>
            <a
              href="/specialists"
              className="home-page__hero-cta rkm-btn rkm-btn-secondary"
              aria-label="Explorar Especialistas"
            >
              👥 Explorar Especialistas
            </a>
          </div>
        </div>

        <div className="home-page__hero-panel rkm-card" aria-label="Resumo da plataforma">
          <div className="home-page__metric">
            <strong>47</strong>
            <span>especialistas prontos para colaborar com o Serginho</span>
          </div>
          <div className="home-page__metric">
            <strong>Study Lab</strong>
            <span>módulos complementares para estudo, revisão e aceleração</span>
          </div>
          <div className="home-page__metric">
            <strong>Stripe + PWA</strong>
            <span>acesso seguro, imediato e consistente em desktop e mobile</span>
          </div>
        </div>
      </header>

      <section className="home-page__grid" aria-label="Seções principais da home">
        <section className="home-page__card home-page__card--serginho rkm-card rkm-card-elevated" aria-labelledby="serginho-title">
          <div className="home-page__card-header">
            <div className="home-page__profile">
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
                <h2 id="serginho-title" className="home-page__card-title">
                  Serginho
                </h2>
                <p className="home-page__role">Orquestrador</p>
              </div>
            </div>

            <span className="home-page__badge" aria-label="Disponível como aplicativo">
              ✨ APP
            </span>
          </div>

          <p className="home-page__text">
            Agente especial e generalista. Orquestra os especialistas, supervisiona e articula todas
            as interações para resolver <strong>qualquer tarefa</strong>.
          </p>

          <div className="home-page__actions">
            <a href="/serginho" className="home-page__action rkm-btn rkm-btn-primary">
              🤖 Falar com o Serginho
            </a>
            <a href="/specialists" className="home-page__action rkm-btn rkm-btn-secondary">
              👥 Explorar Especialistas
            </a>
            <a href="/study" className="home-page__action rkm-btn rkm-btn-secondary">
              📚 Abrir Study Lab
            </a>
            <a href="/hybrid" className="home-page__action home-page__action--hybrid rkm-btn rkm-btn-secondary">
              <img src="/avatars/hybrid.png" alt="Avatar do Agente Híbrido" className="home-page__hybrid-avatar" />
              Agente Híbrido
            </a>
            <a href="/pricing" className="home-page__action rkm-btn rkm-btn-ghost">
              💳 Ver Planos
            </a>
          </div>
        </section>

        <section className="home-page__card home-page__card--info rkm-card" aria-labelledby="info-title">
          <div className="home-page__info-header">
            <div className="home-page__info-icon" aria-hidden>
              📜
            </div>
            <h2 id="info-title" className="home-page__card-title">
              Sobre o RKMMAX
            </h2>
          </div>

          <p className="home-page__text home-page__text--muted">
            Plataforma completa com <strong>47 especialistas de IA</strong> orquestrados pelo
            Serginho. Pagamento seguro via <strong>Stripe</strong>, acesso imediato e suporte
            dedicado para transformar suas ideias em realidade.
          </p>

          <div className="home-page__benefits" aria-label="Benefícios principais">
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

          <a href="/regulamento" className="home-page__regulation rkm-btn rkm-btn-secondary" aria-label="Ver regulamento do projeto">
            📜 Regulamento do Projeto
          </a>
        </section>
      </section>

      <footer className="home-page__footer">
        <small className="home-page__footer-text">
          © {new Date().getFullYear()} {BRAND.master} — {BRAND.vertical}
        </small>
      </footer>
    </main>
  );
}
