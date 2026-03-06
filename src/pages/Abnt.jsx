// src/pages/Abnt.jsx
// Rota interna /abnt — ponto de acesso controlado ao Formatador ABNT/APA dentro do RKMMAX.
// Para trocar a URL do formatador: alterar apenas a constante ABNT_URL abaixo.
// Rollback: git revert <commit> ou remover este arquivo + rota no App.jsx + restaurar StudyLab.jsx
import React from "react";
import { Link } from "react-router-dom";

const ABNT_URL = "https://formatador-abnt.vercel.app";

export default function Abnt() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 560,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        {/* Ícone */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>

        {/* Título */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#1e293b",
            marginBottom: 12,
          }}
        >
          Formatador ABNT/APA
        </h1>

        {/* Descrição */}
        <p
          style={{
            fontSize: 15,
            color: "#64748b",
            lineHeight: 1.7,
            marginBottom: 8,
          }}
        >
          Formate seus trabalhos acadêmicos automaticamente nas normas{" "}
          <strong>ABNT</strong> e <strong>APA</strong>. O formatador abre em
          uma nova aba para melhor experiência.
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#94a3b8",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Se for solicitado login, é uma proteção do deploy. O acesso completo
          será integrado diretamente ao RKMMAX em breve.
        </p>

        {/* Botão principal */}
        <a
          href={ABNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "16px 40px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 20px rgba(102,126,234,0.4)",
            transition: "all 0.2s",
            marginBottom: 24,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 28px rgba(102,126,234,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(102,126,234,0.4)";
          }}
        >
          Abrir Formatador →
        </a>

        {/* Funcionalidades */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {["Capa ABNT", "Resumo", "Referências", "Exportar PDF"].map((feat) => (
            <span
              key={feat}
              style={{
                fontSize: 12,
                color: "#667eea",
                fontWeight: 600,
                background: "#ede9fe",
                padding: "4px 12px",
                borderRadius: 8,
              }}
            >
              {feat}
            </span>
          ))}
        </div>

        {/* Link de volta */}
        <Link
          to="/study"
          style={{
            fontSize: 14,
            color: "#94a3b8",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Voltar ao Study Lab
        </Link>
      </div>
    </div>
  );
}
