import React from "react";
import { Link } from "react-router-dom";
import "./Demo.css";

const ARTIFACTS = [
  {
    name: "Landing Page SaaS",
    description: "Landing page completa com hero, features, pricing e CTA.",
    type: "Landing Page",
    typeClass: "landing",
  },
  {
    name: "Dashboard Analytics",
    description: "Painel de métricas com gráficos, KPIs e tabela de dados.",
    type: "Dashboard",
    typeClass: "dashboard",
  },
  {
    name: "Formulário de Cadastro",
    description: "Formulário multistep com validação e feedback visual.",
    type: "Formulário",
    typeClass: "form",
  },
  {
    name: "Página de Produto",
    description: "Página de produto com galeria, descrição e botão de compra.",
    type: "E-commerce",
    typeClass: "commerce",
  },
  {
    name: "Página Institucional Startup",
    description: "About us, time, missão e validações externas.",
    type: "Institucional",
    typeClass: "institutional",
  },
];

export default function Demo() {
  return (
    <main className="demo-page">
      <section className="demo-page__hero">
        <h1 className="demo-page__title">Construtor de Artefatos Digitais</h1>
        <p className="demo-page__subtitle">
          O Construtor/Híbrido gera artefatos completos em segundos via IA, com foco em velocidade,
          estrutura e entrega final.
        </p>
        <p className="demo-page__notice">
          Exemplos demonstrativos — gerados pelo Construtor/Híbrido RKMMAX
        </p>
        <Link className="demo-page__cta" to="/hybrid">
          Experimente agora
        </Link>
      </section>

      <section className="demo-page__section">
        <div className="demo-page__grid">
          {ARTIFACTS.map((artifact) => (
            <article key={artifact.name} className="demo-card">
              <header className="demo-card__header">
                <span className={`demo-card__type demo-card__type--${artifact.typeClass}`}>
                  {artifact.type}
                </span>
                <span className="demo-card__status">✅ Pronto</span>
              </header>

              <h2 className="demo-card__title">{artifact.name}</h2>
              <p className="demo-card__description">{artifact.description}</p>

              <div className="demo-card__footer">
                <span className="demo-card__hint">Exemplo demonstrativo</span>
                <Link className="demo-card__action" to="/hybrid">
                  Visualizar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="demo-page__footer">
        <p>
          Todos os exemplos são artefatos demonstrativos gerados pelo pipeline Construtor/Híbrido
          RKMMAX
        </p>
        <Link to="/hybrid">Acessar gerador real</Link>
      </footer>
    </main>
  );
}
