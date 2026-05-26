import { BRAND } from "../config/brand.js";
import "./Home.css";

const CAPABILITIES = [
  {
    id: "plan",
    icon: "🎯",
    title: "Planejar com Serginho IA",
    body: "Orientação e coordenação central da demanda. O Serginho estrutura requisitos, define escopo e direciona cada etapa do projeto com inteligência artificial.",
  },
  {
    id: "build",
    icon: "🏗️",
    title: "Construir artefatos digitais",
    body: "O Construtor gera, valida, revisa e entrega artefatos concretos — documentos, especificações, protótipos e entregas digitais estruturadas.",
  },
  {
    id: "specialists",
    icon: "👥",
    title: "Consultar especialistas",
    body: "Especialistas de domínio acionados sob coordenação do Serginho para aprofundamento técnico e validação setorial precisa.",
  },
  {
    id: "abnt",
    icon: "📋",
    title: "Validar conformidade ABNT",
    body: "Revisão documental e conformidade com normas ABNT pela camada dedicada, garantindo padrão, rastreabilidade e credibilidade.",
  },
];

export default function Home() {
  return (
    <main className="home-page" role="main" aria-label="Página inicial">
      <header className="home-page__hero rkm-card rkm-card-elevated" aria-labelledby="hero-title">
        <div className="home-page__hero-overlay" aria-hidden />
        <div className="home-page__hero-content">
          <span className="home-page__eyebrow">Uma solução da RKMMAX INFINITY MATRIX STUDY</span>
          <h1 id="hero-title" className="home-page__title">
            Serginho IA
          </h1>
          <p className="home-page__subtitle">
            Plataforma integrada de inteligência artificial para{" "}
            <strong>planejar</strong>, <strong>construir</strong> e{" "}
            <strong>validar</strong> artefatos digitais — com coordenação por IA,
            revisão humana, especialistas de domínio e conformidade documental.
          </p>
          <p className="home-page__audience">
            Para empreendedores, equipes e organizações que precisam transformar
            ideias em artefatos digitais estruturados e verificáveis.
          </p>
          <div className="home-page__hero-cta">
            <a
              href="/demo"
              className="home-page__cta rkm-btn-primary"
              role="button"
              aria-label="Ver demonstração pública do Serginho IA"
            >
              🎬 Ver demonstração pública
            </a>
            <a
              href="/serginho"
              className="home-page__cta rkm-btn-secondary"
              role="button"
              aria-label="Acessar a plataforma Serginho IA"
            >
              🚀 Acessar a plataforma
            </a>
          </div>
        </div>
      </header>

      <div className="home-page__content-grid">
        <section className="home-page__panel rkm-card rkm-card-elevated" aria-labelledby="serginho-panel-title">
          <div className="home-page__panel-header">
            <div className="home-page__identity">
              <img
                src="/avatars/serginho.png"
                alt="Avatar do Serginho IA"
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="home-page__avatar"
              />
              <div>
                <h2 id="serginho-panel-title" className="home-page__panel-title">
                  Serginho IA
                </h2>
                <p className="home-page__role">Orquestrador central</p>
              </div>
            </div>
          </div>
          <p className="home-page__body">
            Orquestrador central da plataforma. Coordena planejamento, construção de
            artefatos, especialistas de domínio e validações conforme a necessidade
            de cada projeto.
          </p>
        </section>

        <section className="home-page__panel home-page__panel--info rkm-card" aria-labelledby="about-title">
          <div className="home-page__info-header">
            <div className="home-page__info-icon" aria-hidden>
              🤖
            </div>
            <div>
              <p className="home-page__section-kicker">Identidade do produto</p>
              <h2 id="about-title" className="home-page__panel-title">
                Sobre o Serginho IA
              </h2>
            </div>
          </div>
          <p className="home-page__body">
            Serginho IA é uma solução da{" "}
            <strong>RKMMAX INFINITY MATRIX STUDY</strong> para transformar ideias
            em artefatos digitais estruturados e verificáveis, com orquestração
            central, revisão humana, especialistas de domínio e validação de
            conformidade.
          </p>
        </section>
      </div>

      <section className="home-page__capabilities" aria-labelledby="capabilities-title">
        <div className="home-page__capabilities-header">
          <p className="home-page__section-kicker">Quatro capacidades integradas</p>
          <h2 id="capabilities-title" className="home-page__section-title">
            Uma plataforma completa, coordenada pelo Serginho IA
          </h2>
        </div>
        <div className="home-page__capabilities-grid">
          {CAPABILITIES.map((cap) => (
            <div key={cap.id} className="home-page__cap-card rkm-card">
              <div className="home-page__cap-icon" aria-hidden="true">
                {cap.icon}
              </div>
              <h3 className="home-page__cap-title">{cap.title}</h3>
              <p className="home-page__cap-body">{cap.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="home-page__footer">
        <small className="home-page__footer-copy">
          © {new Date().getFullYear()} {BRAND.master} — {BRAND.vertical}
        </small>
      </footer>
    </main>
  );
}
