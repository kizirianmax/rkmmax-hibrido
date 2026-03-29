// src/components/abnt/ReferenceValidator.jsx
// Portado de formatador-abnt/server/routes/references.ts (POST /api/references/validate)
// Validação ABNT 100% local (sem chamadas externas, sem chaves no frontend).
// Regras: SOBRENOME em maiúsculas, ponto final, título em destaque, ano, "Acesso em" para sites.
// Score: 100 - (nº de issues × 20), mínimo 0.
import React, { useState } from "react";

// ─── Lógica de validação (pura / síncrona) ────────────────────────────────────

/**
 * Valida uma referência ABNT e retorna score, issues e sugestões.
 * @param {string} reference - Texto da referência a validar.
 * @returns {{ isValid: boolean, score: number, issues: string[], suggestions: string[] }}
 */
export function validateABNTReference(reference) {
  const issues = [];
  const suggestions = [];

  if (!reference || !reference.trim()) {
    return { isValid: false, score: 0, issues: ["Referência vazia"], suggestions: [] };
  }

  // 1. Sobrenome do autor em MAIÚSCULAS no início
  if (!/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]+,/.test(reference)) {
    issues.push("O sobrenome do autor deve estar em MAIÚSCULAS no início");
    suggestions.push("Inicie com: SOBRENOME, Nome.");
  }

  // 2. Ponto final
  if (!reference.trim().endsWith(".")) {
    issues.push("A referência deve terminar com ponto final");
  }

  // 3. Título em destaque (negrito Markdown ou itálico)
  if (!reference.includes("**") && !reference.includes("_")) {
    issues.push("O título principal deve estar em destaque (negrito)");
    suggestions.push("Use **Título** para destacar o título principal");
  }

  // 4. Ano de publicação (4 dígitos)
  if (!/\d{4}/.test(reference)) {
    issues.push("A referência deve conter o ano de publicação");
  }

  // 5. Referência de site: "Disponível em" exige "Acesso em"
  if (
    reference.toLowerCase().includes("disponível em") &&
    !reference.toLowerCase().includes("acesso em")
  ) {
    issues.push("Referências de sites devem incluir a data de acesso");
    suggestions.push("Adicione: Acesso em: DD mês. AAAA.");
  }

  const isValid = issues.length === 0;
  const score = Math.max(0, 100 - issues.length * 20);

  return { isValid, score, issues, suggestions };
}

// ─── Estilos inline ───────────────────────────────────────────────────────────

const s = {
  card: {
    background: "white",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #e2e8f0",
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  desc: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  textarea: {
    width: "100%",
    minHeight: 80,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 13,
    fontFamily: "monospace",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: 8,
  },
  btn: {
    padding: "8px 18px",
    borderRadius: 8,
    background: "#667eea",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
  },
  scoreBar: (score) => ({
    height: 8,
    borderRadius: 4,
    background: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444",
    width: `${score}%`,
    transition: "width 0.3s",
  }),
  scoreTrack: {
    height: 8,
    borderRadius: 4,
    background: "#e2e8f0",
    marginBottom: 6,
    overflow: "hidden",
  },
  scoreLabel: (score) => ({
    fontSize: 13,
    fontWeight: 700,
    color: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444",
    marginBottom: 8,
  }),
  valid: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: 600,
    marginBottom: 8,
  },
  issueItem: {
    fontSize: 12,
    color: "#ef4444",
    marginBottom: 4,
    paddingLeft: 12,
  },
  suggItem: {
    fontSize: 12,
    color: "#667eea",
    marginBottom: 4,
    paddingLeft: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ReferenceValidator() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const handleValidate = () => {
    if (!text.trim()) return;
    setResult(validateABNTReference(text));
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  return (
    <div style={s.card}>
      <div style={s.title}>✅ Validador ABNT</div>
      <div style={s.desc}>
        Cole uma referência para verificar a conformidade com as normas ABNT NBR 6023.
      </div>

      <textarea
        style={s.textarea}
        placeholder="SOBRENOME, Nome. **Título**. Local: Editora, Ano."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={s.btn} onClick={handleValidate}>
          Validar referência
        </button>
        {result && (
          <button
            style={{ ...s.btn, background: "#94a3b8" }}
            onClick={handleClear}
          >
            Limpar
          </button>
        )}
      </div>

      {result && (
        <div>
          {/* Score */}
          <div style={s.scoreLabel(result.score)}>
            Score: {result.score}/100{" "}
            {result.isValid ? "— Referência válida ✓" : "— Referência com problemas"}
          </div>
          <div style={s.scoreTrack}>
            <div style={s.scoreBar(result.score)} />
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <>
              <div style={s.sectionLabel}>Problemas encontrados:</div>
              {result.issues.map((issue, i) => (
                <div key={i} style={s.issueItem}>
                  • {issue}
                </div>
              ))}
            </>
          )}

          {/* Sugestões */}
          {result.suggestions.length > 0 && (
            <>
              <div style={s.sectionLabel}>Sugestões:</div>
              {result.suggestions.map((sug, i) => (
                <div key={i} style={s.suggItem}>
                  → {sug}
                </div>
              ))}
            </>
          )}

          {result.isValid && (
            <div style={s.valid}>
              ✓ Referência em conformidade com as normas ABNT NBR 6023.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
