// src/pages/Projects.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Projects.css";

const CONTENT = {
  en: {
    heroSubtitle:
      "AI startup in active development and validation, focused on creating, validating, reviewing, previewing, and exporting digital artifacts with governance, cost control, and user ownership.",
    sections: {
      verify: "Company Verification",
      verifyRows: [
        ["Startup / Project", "RKMMAX INFINITY MATRIX STUDY / Serginho IA"],
        ["Founder", "Roberto Kizirian Max"],
        ["Status", "Early-stage startup / functional prototype in active development and validation"],
        [
          "Development Context",
          "Built 100% from a mobile phone with AI assistance, GitHub, Vercel, operational checklists, manual review, and structured governance",
        ],
      ],
      product: "Product Description",
      productText:
        "Serginho IA is being developed as an AI-based intelligence platform for creating, validating, reviewing, previewing, and exporting digital artifacts. The platform is designed to help users transform ideas into structured outputs while maintaining governance, cost control, and ownership of the generated results.",
      arch: "Architecture / Product Layers",
      archItems: [
        { badge: "Serginho", text: "Sovereign orchestrator and central intelligence layer" },
        { badge: "Hybrid", text: "Artifact generation, validation, preview, review, and export" },
        { badge: "Specialists", text: "Domain-specific expert agents" },
        { badge: "ABNT", text: "Validation and compliance layer" },
      ],
      stage: "Current Stage",
      stageText:
        "The product is not yet a fully commercialized platform. It is a functional prototype in active development and validation, being prepared for first real users and external startup programs.",
      security: "Security and Access",
      securityText:
        "The main application may be protected by login for security reasons. This public page exists specifically to help partners verify the company, founder, product, domain, and startup validation context without exposing private systems, users, tokens, code, or sensitive infrastructure.",
      validation: "External Validation",
      validationCards: [
        { title: "Ginga Prototipa / Startup SC / Sebrae Startups", status: "✅ Approved / Selected" },
        { title: "Start Digital 2026 — Sebrae SP + ABStartups", status: "✅ Approved" },
        { title: "Founders Club", status: "✅ Application approved by their team" },
        { title: "SciBiz / USP", status: "✅ Selected to participate in the SciBiz 2026 Startup Fair at CDI USP, Campus Butantã, São Paulo" },
        {
          title: "Sebrae Startups Benefits",
          status:
            "Access to partner benefits such as GitHub Enterprise and Google Cloud credits application pathway",
        },
      ],
      business: "Business Model / Usage Model",
      businessText:
        "Users will use Serginho IA to create, validate, preview, and export artifacts. User projects are not intended to be hosted permanently on the founder's Vercel, GitHub, domain, or private infrastructure. The goal is to provide a controlled creation and validation environment, then allow users to export and own their outputs.",
      cloud: "Cloud Infrastructure Goal",
      cloudText:
        "Google Cloud credits would support the next stage of the project by enabling secure, scalable, and economically controlled infrastructure for artifact validation, testing, packaging, and future user workflows.",
      contact: "Contact",
      contactLabel: "For institutional verification, partnerships, or startup program review:",
      notice:
        "This page is intended solely for institutional verification by program partners. It does not expose private systems, user data, tokens, or sensitive infrastructure.",
      demoCta: "▶ Watch Serginho IA guided demo",
      demoCtaSupport: "Automatic or manual presentation of the Builder.",
    },
  },
  pt: {
    heroSubtitle:
      "Startup de IA em desenvolvimento ativo e validação, focada em criar, validar, revisar, visualizar e exportar artefatos digitais com governança, controle de custos e propriedade do usuário.",
    sections: {
      verify: "Verificação Institucional",
      verifyRows: [
        ["Startup / Projeto", "RKMMAX INFINITY MATRIX STUDY / Serginho IA"],
        ["Fundador", "Roberto Kizirian Max"],
        ["Status", "Startup em estágio inicial / protótipo funcional em desenvolvimento ativo e validação"],
        [
          "Contexto de desenvolvimento",
          "Construído 100% pelo celular com auxílio de IA, GitHub, Vercel, checklists operacionais, revisão manual e governança estruturada",
        ],
      ],
      product: "Descrição do Produto",
      productText:
        "O Serginho IA está sendo desenvolvido como uma plataforma de inteligência baseada em IA para criar, validar, revisar, visualizar e exportar artefatos digitais. A plataforma foi projetada para ajudar os usuários a transformar ideias em resultados estruturados, mantendo governança, controle de custos e propriedade dos resultados gerados.",
      arch: "Arquitetura / Camadas do Produto",
      archItems: [
        { badge: "Serginho", text: "Orquestrador soberano e camada de inteligência central" },
        { badge: "Híbrido", text: "Geração, validação, preview, revisão e exportação de artefatos" },
        { badge: "Especialistas", text: "Agentes especialistas por domínio" },
        { badge: "ABNT", text: "Camada de validação e conformidade" },
      ],
      stage: "Estágio Atual",
      stageText:
        "O produto ainda não é uma plataforma comercialmente finalizada. É um protótipo funcional em desenvolvimento ativo e validação, sendo preparado para os primeiros usuários reais e programas externos de startups.",
      security: "Segurança e Acesso",
      securityText:
        "A aplicação principal pode estar protegida por login por razões de segurança. Esta página pública existe especificamente para ajudar parceiros a verificar a empresa, o fundador, o produto, o domínio e o contexto de validação da startup, sem expor sistemas privados, usuários, tokens, código ou infraestrutura sensível.",
      validation: "Validações Externas",
      validationCards: [
        { title: "Ginga Prototipa / Startup SC / Sebrae Startups", status: "✅ Aprovado / Selecionado" },
        { title: "Start Digital 2026 — Sebrae SP + ABStartups", status: "✅ Aprovado" },
        { title: "Founders Club", status: "✅ Candidatura aprovada pelo time deles" },
        { title: "SciBiz / USP", status: "✅ Selecionado para participar da Feira de Startups do SciBiz 2026 no CDI USP, Campus Butantã, São Paulo" },
        {
          title: "Benefícios Sebrae Startups",
          status:
            "Acesso a benefícios de parceiros como GitHub Enterprise e caminho para candidatura a créditos Google Cloud",
        },
      ],
      business: "Modelo de Negócio / Modelo de Uso",
      businessText:
        "Os usuários utilizarão o Serginho IA para criar, validar, visualizar e exportar artefatos. Os projetos dos usuários não têm a intenção de ser hospedados permanentemente na Vercel, GitHub, domínio ou infraestrutura privada do fundador. O objetivo é oferecer um ambiente controlado de criação e validação, permitindo que os usuários exportem e sejam donos dos seus resultados.",
      cloud: "Objetivo de Infraestrutura Cloud",
      cloudText:
        "Créditos do Google Cloud apoiariam a próxima etapa do projeto, viabilizando uma infraestrutura segura, escalável e economicamente controlada para validação de artefatos, testes, empacotamento e futuros fluxos de trabalho dos usuários.",
      contact: "Contato",
      contactLabel: "Para verificação institucional, parcerias ou análise de programa de startups:",
      notice:
        "Esta página destina-se exclusivamente à verificação institucional por parceiros de programas. Não expõe sistemas privados, dados de usuários, tokens ou infraestrutura sensível.",
      demoCta: "▶ Ver demo guiada do Serginho IA",
      demoCtaSupport: "Apresentação automática ou manual do Construtor.",
    },
  },
};

export default function Projects() {
  const [lang, setLang] = useState("en");
  const c = CONTENT[lang].sections;

  return (
    <main className="startup-page">
      <div className="startup-lang-bar">
        <div className="startup-lang-buttons">
          <button
            className={`startup-lang-btn rkm-btn rkm-btn-secondary${lang === "en" ? " active" : ""}`}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            🇺🇸 English
          </button>
          <button
            className={`startup-lang-btn rkm-btn rkm-btn-secondary${lang === "pt" ? " active" : ""}`}
            onClick={() => setLang("pt")}
            aria-pressed={lang === "pt"}
          >
            🇧🇷 Português
          </button>
        </div>
        <div className="startup-demo-cta-wrap">
          <Link
            className="startup-demo-cta rkm-btn rkm-btn-primary"
            to="/demo-autoplay"
            aria-label={
              lang === "en"
                ? "Open guided demo in automatic or manual mode"
                : "Abrir demo guiada em modo automático ou manual"
            }
          >
            {c.demoCta}
          </Link>
          <p className="startup-demo-cta-support">{c.demoCtaSupport}</p>
        </div>
      </div>

      <section className="startup-hero rkm-card rkm-card-elevated">
        <h1>RKMMAX INFINITY MATRIX STUDY / Serginho IA</h1>
        <p>{CONTENT[lang].heroSubtitle}</p>
      </section>

      <section className="startup-section rkm-card" aria-labelledby="startup-verify-title">
        <h2 id="startup-verify-title">{c.verify}</h2>
        <table className="startup-verify-table">
          <tbody>
            {c.verifyRows.map(([label, value], index) => (
              <tr key={index}>
                <td>{label}</td>
                <td>{value}</td>
              </tr>
            ))}
            <tr>
              <td>{lang === "en" ? "Business Email" : "E-mail comercial"}</td>
              <td>
                <a href="mailto:roberto@kizirianmax.site">roberto@kizirianmax.site</a>
              </td>
            </tr>
            <tr>
              <td>{lang === "en" ? "Additional Email" : "E-mail adicional"}</td>
              <td>
                <a href="mailto:robertokizirianmax@gmail.com">robertokizirianmax@gmail.com</a>
              </td>
            </tr>
            <tr>
              <td>Website</td>
              <td>
                <a href="https://kizirianmax.site" target="_blank" rel="noopener noreferrer">
                  https://kizirianmax.site
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.product}</h2>
        <p className="startup-body">{c.productText}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.arch}</h2>
        <ul className="startup-arch-list">
          {c.archItems.map((item, index) => (
            <li key={index} className="startup-arch-item">
              <strong className="startup-arch-badge">{item.badge}</strong>
              {"\u00A0\u2014\u00A0"}
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.stage}</h2>
        <p className="startup-body">{c.stageText}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.security}</h2>
        <p className="startup-body">{c.securityText}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.validation}</h2>
        <div className="startup-validation-grid">
          {c.validationCards.map((card, index) => (
            <div key={index} className="startup-validation-card rkm-card">
              <div className="startup-validation-card-title">{card.title}</div>
              <div className="startup-validation-card-status">{card.status}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.business}</h2>
        <p className="startup-body">{c.businessText}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.cloud}</h2>
        <p className="startup-body">{c.cloudText}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.contact}</h2>
        <div className="startup-contact-box rkm-card rkm-card-elevated">
          <p className="startup-contact-label">{c.contactLabel}</p>
          <p>
            <strong>Roberto Kizirian Max</strong>
          </p>
          <p>
            <a href="mailto:roberto@kizirianmax.site">roberto@kizirianmax.site</a>
          </p>
          <p>RKMMAX INFINITY MATRIX STUDY / Serginho IA</p>
        </div>
        <div className="startup-notice">{c.notice}</div>
      </section>
    </main>
  );
}
