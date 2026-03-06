// src/pages/StudyLab.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function StudyLab() {
  const navigate = useNavigate();
  const tools = [
    {
      id: "abnt",
      title: "📝 Formatador ABNT/APA",
      description: "Formate seus trabalhos acadêmicos automaticamente nas normas ABNT ou APA",
      status: "Disponível",
      action: () => navigate("/abnt"),
    },
    {
      id: "cronograma",
      title: "📅 Gerador de Cronogramas",
      description: "Crie cronogramas de estudo personalizados baseados em seus objetivos",
      status: "Em breve",
      action: null,
    },
    {
      id: "sourceproof",
      title: "🔍 Source-Proof",
      description: "Verifique e valide fontes acadêmicas com checagem de credibilidade",
      status: "Em breve",
      action: null,
    },
    {
      id: "resumos",
      title: "📚 Gerador de Resumos",
      description: "Transforme textos longos em resumos estruturados e objetivos",
      status: "Em breve",
      action: null,
    },
    {
      id: "flashcards",
      title: "🎯 Flashcards Inteligentes",
      description: "Crie flashcards automaticamente a partir de seus materiais de estudo",
      status: "Em breve",
      action: null,
    },
    {
      id: "mapas",
      title: "🗺️ Mapas Mentais",
      description: "Gere mapas mentais visuais para organizar conceitos e ideias",
      status: "Em breve",
      action: null,
    },
  ];

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 48,
            color: "white",
          }}
        >
          <h1
            style={{
              fontSize: 42,
              fontWeight: 900,
              marginBottom: 16,
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            🎓 Study Lab
          </h1>
          <p
            style={{
              fontSize: 18,
              opacity: 0.95,
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Ferramentas de estudo acelerado com <strong>ABNT/APA</strong>, cronogramas e{" "}
            <strong>fontes verificadas (Source-Proof)</strong>
          </p>
          <p
            style={{
              fontSize: 14,
              opacity: 0.8,
              marginTop: 12,
            }}
          >
            Funcionalidade <strong>opcional</strong> para quem precisa de suporte educacional
            avançado
          </p>
        </div>

        {/* Tools Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={tool.action}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 28,
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                cursor: tool.action ? "pointer" : "default",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (tool.action) {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
              }}
            >
              {/* Status Badge */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  background: tool.status === "Disponível" ? "#10b981" : "#94a3b8",
                  color: "white",
                }}
              >
                {tool.status}
              </div>

              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#1e293b",
                  paddingRight: 80,
                }}
              >
                {tool.title}
              </h3>

              <p
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                {tool.description}
              </p>

              {tool.action && (
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "#667eea",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Acessar →
                </div>
              )}

              {!tool.action && (
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "#f1f5f9",
                    color: "#94a3b8",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Em desenvolvimento
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 60,
            background: "white",
            borderRadius: 24,
            padding: 40,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              marginBottom: 16,
              color: "#1e293b",
            }}
          >
            💡 Sugestão de Ferramenta
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#64748b",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Tem alguma ideia de ferramenta educacional que gostaria de ver no Study Lab? Envie sua
            sugestão!
          </p>
          <button
            onClick={() => alert("Em breve: formulário de sugestões!")}
            style={{
              padding: "14px 32px",
              borderRadius: 16,
              background: "#667eea",
              color: "white",
              border: "none",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#5568d3")}
            onMouseLeave={(e) => (e.target.style.background = "#667eea")}
          >
            Enviar Sugestão
          </button>
        </div>
      </div>
    </div>
  );
}
