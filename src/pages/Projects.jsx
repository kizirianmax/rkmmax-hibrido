// src/pages/Projects.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Projects.css";

const CONTENT = {
  en: {
    institutionTag: "A solution by RKMMAX INFINITY MATRIX STUDY",
    heroSubtitle:
      "Serginho IA helps teams plan, build, review, and validate structured digital artifacts with artificial intelligence, human review, and governed workflows.",
    sections: {
      demoCtaPrimary: "View public demo",
      demoCtaSecondary: "Watch guided demo",
      demoCtaSupport:
        "Public demonstration route for the product experience. Guided autoplay remains available as a secondary option.",

      value: "Value proposition",
      valueCards: [
        {
          title: "Problem solved",
          text: "Turn ideas and business needs into structured and verifiable digital artifacts.",
        },
        {
          title: "Who it serves",
          text: "Entrepreneurs, teams, and organizations that need to create, review, or validate digital deliverables.",
        },
        {
          title: "How it works",
          text: "Serginho IA orchestrates construction capabilities, domain specialists, and ABNT compliance steps with human review.",
        },
      ],

      capabilities: "Product capabilities",
      capabilityItems: [
        {
          title: "Planning and orchestration with Serginho IA",
          text: "Central intelligence coordinates priorities, workflow sequence, and quality gates.",
        },
        {
          title: "Digital artifact construction",
          text: "Structured creation, iteration, preview, revision, and export of digital artifacts.",
        },
        {
          title: "Domain specialists under coordination",
          text: "Specialized expertise is used under Serginho IA governance, without bypassing orchestration.",
        },
        {
          title: "ABNT compliance validation",
          text: "Document validation and conformity guidance are integrated as governed product capabilities.",
        },
      ],

      business: "Digital business model",
      businessText:
        "Serginho IA is being developed as a digital platform/SaaS model, with future access plans aligned to usage level and available capabilities. The current stage remains a functional prototype in active development and validation.",

      team: "Founder and project",
      teamRows: [
        ["Founder", "Roberto Kizirian Max"],
        ["Product", "Serginho IA"],
        ["Institutional organization", "RKMMAX INFINITY MATRIX STUDY"],
      ],
      contactLabel: "Professional contact:",

      validation: "External validation trajectory",
      validationCards: [
        { title: "Ginga Prototipa / Startup SC / Sebrae Startups", status: "✅ Approved / Selected" },
        { title: "Start Digital 2026 — Sebrae SP + ABStartups", status: "✅ Approved" },
        { title: "Founders Club", status: "✅ Application approved by their team" },
        {
          title: "SciBiz / USP",
          status:
            "✅ Selected to participate in the SciBiz 2026 Startup Fair at CDI USP, Campus Butantã, São Paulo",
        },
        {
          title: "Sebrae Startups Benefits",
          status: "Access to partner benefits, including GitHub Enterprise and a Google Cloud credit application path",
        },
      ],

      verify: "Institutional context",
      verifyRows: [
        ["Startup / Project", "RKMMAX INFINITY MATRIX STUDY / Serginho IA"],
        ["Status", "Early-stage startup / functional prototype in active development and validation"],
        [
          "Development context",
          "Built from mobile-first execution with AI assistance, GitHub, Vercel, operational checklists, manual review, and structured governance",
        ],
      ],

      cloud: "Cloud infrastructure strategy",
      cloudText:
        "Cloud infrastructure is treated as a secondary strategic layer to support secure scale, operational control, and future workflows. It does not replace the core product value proposition.",

      notice:
        "This public page presents product and institutional context without exposing private systems, tokens, user data, or sensitive infrastructure.",
    },
  },
  pt: {
    institutionTag: "Uma solução da RKMMAX INFINITY MATRIX STUDY",
    heroSubtitle:
      "O Serginho IA ajuda equipes a planejar, construir, revisar e validar artefatos digitais estruturados com inteligência artificial, revisão humana e governança.",
    sections: {
      demoCtaPrimary: "Ver demonstração pública",
      demoCtaSecondary: "Ver demo guiada",
      demoCtaSupport:
        "Rota pública de demonstração da experiência do produto. A versão guiada em autoplay permanece como opção secundária.",

      value: "Proposta de valor",
      valueCards: [
        {
          title: "Problema que resolve",
          text: "Transformar ideias e necessidades em artefatos digitais estruturados e verificáveis.",
        },
        {
          title: "Para quem serve",
          text: "Empreendedores, equipes e organizações que precisam criar, revisar ou validar entregas digitais.",
        },
        {
          title: "Como funciona",
          text: "O Serginho IA coordena capacidades de construção, especialistas de domínio e conformidade ABNT com revisão humana.",
        },
      ],

      capabilities: "Capacidades do produto",
      capabilityItems: [
        {
          title: "Planejamento e orquestração com Serginho IA",
          text: "A inteligência central coordena prioridades, sequência de trabalho e critérios de qualidade.",
        },
        {
          title: "Construção de artefatos digitais",
          text: "Criação estruturada, iteração, preview, revisão e exportação de artefatos digitais.",
        },
        {
          title: "Especialistas de domínio sob coordenação",
          text: "Especialistas atuam sob governança do Serginho IA, sem bypass da orquestração.",
        },
        {
          title: "Validação de conformidade ABNT",
          text: "Validação documental e conformidade são tratadas como capacidades governadas do produto.",
        },
      ],

      business: "Modelo de negócio digital",
      businessText:
        "O Serginho IA está em desenvolvimento como plataforma digital/SaaS, com planos de acesso futuros conforme nível de uso e capacidades disponibilizadas. O estágio atual permanece como protótipo funcional em desenvolvimento e validação ativa.",

      team: "Fundador e projeto",
      teamRows: [
        ["Fundador", "Roberto Kizirian Max"],
        ["Produto", "Serginho IA"],
        ["Organização institucional", "RKMMAX INFINITY MATRIX STUDY"],
      ],
      contactLabel: "Contato profissional:",

      validation: "Trajetória de validações externas",
      validationCards: [
        { title: "Ginga Prototipa / Startup SC / Sebrae Startups", status: "✅ Aprovado / Selecionado" },
        { title: "Start Digital 2026 — Sebrae SP + ABStartups", status: "✅ Aprovado" },
        { title: "Founders Club", status: "✅ Candidatura aprovada pelo time deles" },
        {
          title: "SciBiz / USP",
          status:
            "✅ Selecionado para participar da Feira de Startups do SciBiz 2026 no CDI USP, Campus Butantã, São Paulo",
        },
        {
          title: "Benefícios Sebrae Startups",
          status:
            "Acesso a benefícios de parceiros, incluindo GitHub Enterprise e caminho para candidatura a créditos Google Cloud",
        },
      ],

      verify: "Contexto institucional",
      verifyRows: [
        ["Startup / Projeto", "RKMMAX INFINITY MATRIX STUDY / Serginho IA"],
        ["Status", "Startup em estágio inicial / protótipo funcional em desenvolvimento ativo e validação"],
        [
          "Contexto de desenvolvimento",
          "Construído com execução mobile-first, auxílio de IA, GitHub, Vercel, checklists operacionais, revisão manual e governança estruturada",
        ],
      ],

      cloud: "Estratégia de infraestrutura em nuvem",
      cloudText:
        "A infraestrutura em nuvem é tratada como camada estratégica secundária para suportar escala segura, controle operacional e fluxos futuros. Ela não substitui a proposta de valor central do produto.",

      notice:
        "Esta página pública apresenta contexto de produto e institucional sem expor sistemas privados, tokens, dados de usuários ou infraestrutura sensível.",
    },
  },
};

export default function Projects() {
  const [lang, setLang] = useState("en");
  const c = CONTENT[lang].sections;

  return (
    <main className="startup-page">
      <div className="startup-lang-bar rkm-card">
        <div className="startup-lang-buttons">
          <button
            className={`startup-lang-btn rkm-btn${lang === "en" ? " active" : ""}`}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            🇺🇸 English
          </button>
          <button
            className={`startup-lang-btn rkm-btn${lang === "pt" ? " active" : ""}`}
            onClick={() => setLang("pt")}
            aria-pressed={lang === "pt"}
          >
            🇧🇷 Português
          </button>
        </div>

        <div className="startup-demo-cta-wrap">
          <Link
            className="startup-demo-cta rkm-btn-primary"
            to="/demo"
            aria-label={lang === "en" ? "Open public product demonstration" : "Abrir demonstração pública do produto"}
          >
            {c.demoCtaPrimary}
          </Link>
          <Link
            className="startup-demo-cta-secondary rkm-btn-secondary"
            to="/demo-autoplay"
            aria-label={lang === "en" ? "Open guided autoplay demo" : "Abrir demo guiada em autoplay"}
          >
            {c.demoCtaSecondary}
          </Link>
          <p className="startup-demo-cta-support">{c.demoCtaSupport}</p>
        </div>
      </div>

      <section className="startup-hero rkm-card rkm-card-elevated">
        <h1>Serginho IA</h1>
        <p className="startup-hero-kicker">{CONTENT[lang].institutionTag}</p>
        <p>{CONTENT[lang].heroSubtitle}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.value}</h2>
        <div className="startup-value-grid">
          {c.valueCards.map((item, index) => (
            <article key={index} className="startup-value-card rkm-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.capabilities}</h2>
        <div className="startup-capabilities-grid">
          {c.capabilityItems.map((item, index) => (
            <article key={index} className="startup-capability-card rkm-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.business}</h2>
        <p className="startup-body">{c.businessText}</p>
      </section>

      <section className="startup-section rkm-card">
        <h2>{c.team}</h2>
        <table className="startup-verify-table">
          <tbody>
            {c.teamRows.map(([label, value], index) => (
              <tr key={index}>
                <td>{label}</td>
                <td>{value}</td>
              </tr>
            ))}
            <tr>
              <td>{c.contactLabel}</td>
              <td>
                <a href="mailto:roberto@kizirianmax.site">roberto@kizirianmax.site</a>
              </td>
            </tr>
          </tbody>
        </table>
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
              <td>{lang === "en" ? "Website" : "Website"}</td>
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
        <h2>{c.cloud}</h2>
        <p className="startup-body">{c.cloudText}</p>
      </section>

      <section className="startup-section rkm-card">
        <div className="startup-notice rkm-card">{c.notice}</div>
      </section>
    </main>
  );
}
