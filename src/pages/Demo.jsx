import React from "react";
import { Link } from "react-router-dom";
import { demoArtifacts } from "../data/demoArtifacts.js";
import "./Demo.css";

export default function Demo() {
  return (
    <main className="demo-page">
      <section className="demo-page__hero">
        <h1 className="demo-page__title">Demonstração do Construtor / Serginho IA</h1>
        <p className="demo-page__subtitle">
          Esta vitrine pública apresenta exemplos estáticos de artefatos gerados no pipeline do
          Construtor/Híbrido, com foco em geração, validação, preview e empacotamento.
        </p>
        <p className="demo-page__notice">
          Exemplos demonstrativos do pipeline (não são dados de produção)
        </p>
      </section>

      <section className="demo-page__section">
        <h2 className="demo-page__section-title">Artefatos demonstrativos</h2>
        <div className="demo-page__grid">
          {demoArtifacts.map((artifact) => (
            <article key={artifact.id} className="demo-card">
              <header className="demo-card__header">
                <span className="demo-card__type">{artifact.category}</span>
                <span className="demo-card__status">{artifact.status}</span>
              </header>

              <h2 className="demo-card__title">{artifact.name}</h2>
              <p className="demo-card__description">{artifact.description}</p>
              <p className="demo-card__problem">
                <strong>Problema que resolve:</strong> {artifact.problemSolved}
              </p>
              <p className="demo-card__stack">
                <strong>Tecnologias / estrutura estimada:</strong> {artifact.technologies.join(" • ")}
              </p>
              <p className="demo-card__score">{artifact.qualityScore}</p>

              <div className="demo-card__footer">
                <span className="demo-card__hint">Exemplo demonstrativo</span>
                <div className="demo-card__actions">
                  <a className="demo-card__action" href={artifact.previewAnchor}>
                    Ver exemplo
                  </a>
                  <a className="demo-card__action demo-card__action--secondary" href={artifact.structureAnchor}>
                    Ver estrutura
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-page__section">
        <h2 className="demo-page__section-title">Por que isso não é apenas um chat?</h2>
        <ul className="demo-page__list">
          <li>O Construtor entrega artefatos digitais estruturados, não apenas respostas textuais.</li>
          <li>Há pipeline de validação, revisão e preview antes da entrega final.</li>
          <li>Os exemplos abaixo simulam saídas prontas para uso em produto e operação.</li>
        </ul>
      </section>

      <section className="demo-page__section">
        <h2 className="demo-page__section-title">Como avaliar em 5 minutos</h2>
        <ol className="demo-page__list demo-page__list--ordered">
          <li>Compare os 5 tipos de artefatos e os problemas de negócio atendidos.</li>
          <li>Abra “Ver exemplo” para validar preview estático de cada entrega.</li>
          <li>Abra “Ver estrutura” para visualizar a composição técnica de cada artefato.</li>
          <li>Analise status e score de qualidade para entender nível de prontidão.</li>
          <li>Depois, acesse o institucional para contexto estratégico da startup.</li>
        </ol>
      </section>

      <section className="demo-page__section">
        <h2 className="demo-page__section-title">Previews estáticos</h2>
        {demoArtifacts.map((artifact) => (
          <article key={`preview-${artifact.id}`} id={`preview-${artifact.id}`} className="demo-preview">
            <h3>{artifact.name}</h3>
            <p>
              Preview estático demonstrativo. Sem geração ao vivo e sem dados reais de produção.
            </p>
            <div id={`structure-${artifact.id}`} className="demo-preview__structure">
              <strong>Estrutura sugerida:</strong>
              <ul>
                {artifact.technologies.map((item) => (
                  <li key={`${artifact.id}-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <footer className="demo-page__footer">
        <p>
          Todos os exemplos desta vitrine são demonstrativos do Construtor/Híbrido e foram
          publicados para avaliação rápida e segura.
        </p>
        <a href="https://kizirianmax.site/startup" target="_blank" rel="noopener noreferrer">
          Conhecer a visão institucional
        </a>
        <Link to="/hybrid">Acessar Construtor/Híbrido</Link>
      </footer>
    </main>
  );
}
