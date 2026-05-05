// src/pages/Projects.jsx
import React from "react";
import "./Projects.css";

export default function Projects() {
  return (
    <main className="startup-page">
      {/* Hero */}
      <section className="startup-hero">
        <h1>RKMMAX INFINITY MATRIX STUDY / Serginho IA</h1>
        <p>
          AI startup in active development and validation, focused on creating, validating,
          reviewing, previewing, and exporting digital artifacts with governance, cost control,
          and user ownership.
        </p>
      </section>

      {/* Company Verification */}
      <section className="startup-section">
        <h2>Company Verification</h2>
        <table className="startup-verify-table">
          <tbody>
            <tr>
              <td>Startup / Project</td>
              <td>RKMMAX INFINITY MATRIX STUDY / Serginho IA</td>
            </tr>
            <tr>
              <td>Founder</td>
              <td>Roberto Kizirian Max</td>
            </tr>
            <tr>
              <td>Business Email</td>
              <td>
                <a href="mailto:roberto@kizirianmax.site">roberto@kizirianmax.site</a>
              </td>
            </tr>
            <tr>
              <td>Additional Email</td>
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
            <tr>
              <td>Status</td>
              <td>Early-stage startup / functional prototype in active development and validation</td>
            </tr>
            <tr>
              <td>Development Context</td>
              <td>
                Built 100% from a mobile phone with AI assistance, GitHub, Vercel, operational
                checklists, manual review, and structured governance
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Product Description */}
      <section className="startup-section">
        <h2>Product Description</h2>
        <p className="startup-body">
          Serginho IA is being developed as an AI-based intelligence platform for creating,
          validating, reviewing, previewing, and exporting digital artifacts. The platform is
          designed to help users transform ideas into structured outputs while maintaining
          governance, cost control, and ownership of the generated results.
        </p>
      </section>

      {/* Architecture */}
      <section className="startup-section">
        <h2>Architecture / Product Layers</h2>
        <ul className="startup-arch-list">
          <li className="startup-arch-item">
            <span className="startup-arch-badge">Serginho</span>
            <span className="startup-arch-text">
              Sovereign orchestrator and central intelligence layer
            </span>
          </li>
          <li className="startup-arch-item">
            <span className="startup-arch-badge">Hybrid</span>
            <span className="startup-arch-text">
              Artifact generation, validation, preview, review, and export
            </span>
          </li>
          <li className="startup-arch-item">
            <span className="startup-arch-badge">Specialists</span>
            <span className="startup-arch-text">Domain-specific expert agents</span>
          </li>
          <li className="startup-arch-item">
            <span className="startup-arch-badge">ABNT</span>
            <span className="startup-arch-text">Validation and compliance layer</span>
          </li>
        </ul>
      </section>

      {/* Current Stage */}
      <section className="startup-section">
        <h2>Current Stage</h2>
        <p className="startup-body">
          The product is not yet a fully commercialized platform. It is a functional prototype in
          active development and validation, being prepared for first real users and external
          startup programs.
        </p>
      </section>

      {/* Security and Access */}
      <section className="startup-section">
        <h2>Security and Access</h2>
        <p className="startup-body">
          The main application may be protected by login for security reasons. This public page
          exists specifically to help partners verify the company, founder, product, domain, and
          startup validation context without exposing private systems, users, tokens, code, or
          sensitive infrastructure.
        </p>
      </section>

      {/* External Validation */}
      <section className="startup-section">
        <h2>External Validation</h2>
        <div className="startup-validation-grid">
          <div className="startup-validation-card">
            <div className="startup-validation-card-title">Ginga Prototipa / Startup SC / Sebrae Startups</div>
            <div className="startup-validation-card-status">✅ Approved / Selected</div>
          </div>
          <div className="startup-validation-card">
            <div className="startup-validation-card-title">Start Digital 2026 — Sebrae SP + ABStartups</div>
            <div className="startup-validation-card-status">✅ Approved</div>
          </div>
          <div className="startup-validation-card">
            <div className="startup-validation-card-title">Founders Club</div>
            <div className="startup-validation-card-status">✅ Application approved by their team</div>
          </div>
          <div className="startup-validation-card">
            <div className="startup-validation-card-title">SciBiz / USP</div>
            <div className="startup-validation-card-status">🔄 Application / evaluation in progress</div>
          </div>
          <div className="startup-validation-card">
            <div className="startup-validation-card-title">Sebrae Startups Benefits</div>
            <div className="startup-validation-card-status">
              Access to partner benefits such as GitHub Enterprise and Google Cloud credits
              application pathway
            </div>
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="startup-section">
        <h2>Business Model / Usage Model</h2>
        <p className="startup-body">
          Users will use Serginho IA to create, validate, preview, and export artifacts. User
          projects are not intended to be hosted permanently on the founder's Vercel, GitHub,
          domain, or private infrastructure. The goal is to provide a controlled creation and
          validation environment, then allow users to export and own their outputs.
        </p>
      </section>

      {/* Cloud Infrastructure */}
      <section className="startup-section">
        <h2>Cloud Infrastructure Goal</h2>
        <p className="startup-body">
          Google Cloud credits would support the next stage of the project by enabling secure,
          scalable, and economically controlled infrastructure for artifact validation, testing,
          packaging, and future user workflows.
        </p>
      </section>

      {/* Contact */}
      <section className="startup-section">
        <h2>Contact</h2>
        <div className="startup-contact-box">
          <p className="startup-contact-label">
            For institutional verification, partnerships, or startup program review:
          </p>
          <p>
            <strong>Roberto Kizirian Max</strong>
          </p>
          <p>
            <a href="mailto:roberto@kizirianmax.site">roberto@kizirianmax.site</a>
          </p>
          <p>RKMMAX INFINITY MATRIX STUDY / Serginho IA</p>
        </div>
        <div className="startup-notice">
          This page is intended solely for institutional verification by program partners. It does
          not expose private systems, user data, tokens, or sensitive infrastructure.
        </div>
      </section>
    </main>
  );
}
