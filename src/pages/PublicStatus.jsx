import React from "react";
import { Link } from "react-router-dom";
import { demoArtifacts } from "../data/demoArtifacts.js";
import "./PublicStatus.css";

const DEMO_VIDEO_URL = "https://youtube.com/shorts/Rq1b2TrpjEI?si=32H6CXHWQw4xl7pE";

const PIPELINE_STEPS = [
  { id: "geracao",      label: "Geração",       desc: "Construtor/Híbrido gera artefatos estruturados a partir de instruções." },
  { id: "validacao",   label: "Validação",      desc: "Pipeline de validação confere estrutura e conformidade do artefato." },
  { id: "preview",     label: "Preview",        desc: "Preview estático disponível antes da entrega final." },
  { id: "revisao",     label: "Revisão",        desc: "Etapa de revisão garante coerência e qualidade do conteúdo gerado." },
  { id: "empacotamento",label: "Empacotamento", desc: "Artefato empacotado e pronto para entrega ou exportação." },
];

const DOCS_STEPS = [
  { id: "p1", label: "P1", desc: "Arquivos-fonte do Construtor/Híbrido referenciados no README." },
  { id: "p2", label: "P2", desc: "Vitrine pública /demo com 5 artefatos demonstráveis criada." },
  { id: "p3", label: "P3", desc: "Vídeo demo público do Serginho IA gravado e publicado." },
  { id: "p4", label: "P4", desc: "Auditoria técnica documental de artifactRunner.js concluída." },
];

const NOT_EXPOSED = [
  "Autenticação, sessões ou dados de usuários reais",
  "Supabase, banco de dados ou registros de assinaturas",
  "Stripe, billing ou dados financeiros",
  "Providers de IA, configurações de modelo ou chaves de integração",
  "Segredos, variáveis de ambiente ou credenciais",
  "Dados reais de produção de qualquer natureza",
  "Camada interna do Serginho IA (orquestrador soberano)",
  "Especialistas de domínio ou camada ABNT",
];

export default function PublicStatus() {
  return (
    <main className="pstatus-page">

      {/* Aviso principal */}
      <section className="pstatus-notice">
        <span className="pstatus-notice__badge">⚠ Métricas públicas e demonstrativas</span>
        <p className="pstatus-notice__text">
          Esta página exibe métricas e status <strong>públicos e demonstrativos</strong> do
          Construtor/Híbrido do Serginho IA. Nenhum dado real de produção, dado de usuário,
          dado financeiro ou segredo é exibido aqui.
        </p>
      </section>

      {/* Hero */}
      <section className="pstatus-hero">
        <h1 className="pstatus-hero__title">Serginho IA — Status público do Construtor</h1>
        <p className="pstatus-hero__subtitle">
          Visão rápida do estado do Construtor/Híbrido para avaliadores externos
          (Sebrae / USP / SciBiz). Acesso público, sem login necessário.
        </p>
        <div className="pstatus-hero__links">
          <Link className="pstatus-hero__cta" to="/demo">
            Acessar vitrine pública /demo
          </Link>
          <a
            className="pstatus-hero__cta pstatus-hero__cta--secondary"
            href={DEMO_VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Assistir vídeo demo (P3)
          </a>
        </div>
      </section>

      {/* Status da demo */}
      <section className="pstatus-section">
        <h2 className="pstatus-section__title">Status da demo pública</h2>
        <div className="pstatus-status-row">
          <span className="pstatus-badge pstatus-badge--ok">✅ Operacional</span>
          <span className="pstatus-status-label">
            Vitrine <code>/demo</code> pública, acessível sem login, com 5 artefatos demonstrativos.
          </span>
        </div>
        <div className="pstatus-status-row">
          <span className="pstatus-badge pstatus-badge--ok">✅ Disponível</span>
          <span className="pstatus-status-label">
            Demo guiada <code>/demo-autoplay</code> disponível para avaliação e gravação.
          </span>
        </div>
        <div className="pstatus-status-row">
          <span className="pstatus-badge pstatus-badge--ok">✅ Publicado</span>
          <span className="pstatus-status-label">
            Vídeo demo P3 público no YouTube Shorts —{" "}
            <a href={DEMO_VIDEO_URL} target="_blank" rel="noopener noreferrer">
              assistir agora
            </a>.
          </span>
        </div>
      </section>

      {/* Artefatos demonstráveis */}
      <section className="pstatus-section">
        <h2 className="pstatus-section__title">Artefatos demonstráveis</h2>
        <p className="pstatus-section__lead">
          A vitrine pública apresenta os seguintes tipos de artefatos digitais demonstráveis.
        </p>
        <ul className="pstatus-artifacts">
          {demoArtifacts.map((a) => (
            <li key={a.id} className="pstatus-artifact">
              <span className="pstatus-artifact__name">{a.name}</span>
              <span className="pstatus-artifact__category">{a.category}</span>
              <span className="pstatus-badge pstatus-badge--ok pstatus-artifact__status">
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pipeline */}
      <section className="pstatus-section">
        <h2 className="pstatus-section__title">Status do pipeline demonstrativo</h2>
        <p className="pstatus-section__lead">
          Scores demonstrativos exibidos na vitrine pública.
        </p>
        <ul className="pstatus-pipeline">
          {PIPELINE_STEPS.map((step) => (
            <li key={step.id} className="pstatus-pipeline__step">
              <span className="pstatus-badge pstatus-badge--ok">✅</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Documentação */}
      <section className="pstatus-section">
        <h2 className="pstatus-section__title">Status documental</h2>
        <ul className="pstatus-docs">
          {DOCS_STEPS.map((step) => (
            <li key={step.id} className="pstatus-docs__item">
              <span className="pstatus-badge pstatus-badge--ok">✅ {step.label} concluído</span>
              <span className="pstatus-docs__desc">{step.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* O que não é exposto */}
      <section className="pstatus-section pstatus-section--notexposed">
        <h2 className="pstatus-section__title">O que não é exposto</h2>
        <p className="pstatus-section__lead">
          Esta página <strong>não expõe</strong> nenhum dos itens abaixo:
        </p>
        <ul className="pstatus-notexposed">
          {NOT_EXPOSED.map((item) => (
            <li key={item}>
              <span className="pstatus-badge pstatus-badge--no">✗</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <footer className="pstatus-footer">
        <p>
          Todos os dados desta página são <strong>demonstrativos e públicos</strong>.
          Nenhum dado real de produção, usuário ou sistema interno é exposto.
        </p>
        <div className="pstatus-footer__links">
          <Link to="/demo">Vitrine pública /demo</Link>
          <a href={DEMO_VIDEO_URL} target="_blank" rel="noopener noreferrer">Vídeo demo (P3)</a>
          <a href="https://kizirianmax.site/startup" target="_blank" rel="noopener noreferrer">
            Visão institucional
          </a>
        </div>
      </footer>
    </main>
  );
}
