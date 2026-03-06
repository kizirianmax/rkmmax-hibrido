// src/components/abnt/URLImporter.jsx
// Portado de rkmmax-app/src/utils/formatador/src/components/URLImporter.tsx
// Chama /api/abnt-extract-url (backend) em vez de fetch direto — sem chaves no frontend
import React, { useState } from "react";

const s = {
  card: { background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  desc: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  row: { display: "flex", gap: 8 },
  input: { flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 },
  btn: { padding: "8px 16px", borderRadius: 8, background: "#667eea", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  result: { marginTop: 12, background: "#f8fafc", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0" },
  field: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: 600, color: "#64748b", display: "block" },
  value: { fontSize: 13, color: "#1e293b" },
  citation: { background: "#ede9fe", borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "monospace", lineHeight: 1.6, marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  insertBtn: { marginTop: 8, padding: "6px 14px", borderRadius: 8, background: "#10b981", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  error: { marginTop: 8, color: "#ef4444", fontSize: 13 },
};

export default function URLImporter({ onAddReference }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/abnt-extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Erro ao extrair metadados da URL.");
      }
    } catch (e) {
      setError("Erro de rede. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (result?.abntReference && onAddReference) {
      onAddReference(result.abntReference, "site");
      setResult(null);
      setUrl("");
    }
  };

  return (
    <div style={s.card}>
      <div style={s.title}>🌐 Importar de URL</div>
      <div style={s.desc}>Cole o link de um site para gerar a referência ABNT automaticamente</div>

      <div style={s.row}>
        <input
          style={s.input}
          placeholder="https://exemplo.com/artigo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleExtract()}
        />
        <button
          style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
          onClick={handleExtract}
          disabled={loading || !url.trim()}
        >
          {loading ? "⏳ Extraindo..." : "Extrair"}
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {result?.data && (
        <div style={s.result}>
          {result.data.title && (
            <div style={s.field}>
              <span style={s.label}>Título</span>
              <span style={s.value}>{result.data.title}</span>
            </div>
          )}
          {result.data.author && (
            <div style={s.field}>
              <span style={s.label}>Autor</span>
              <span style={s.value}>{result.data.author}</span>
            </div>
          )}
          {result.data.siteName && (
            <div style={s.field}>
              <span style={s.label}>Site</span>
              <span style={s.value}>{result.data.siteName}</span>
            </div>
          )}
          {result.abntReference && (
            <>
              <div style={{ ...s.label, marginTop: 8 }}>Referência ABNT gerada:</div>
              <div style={s.citation}>{result.abntReference}</div>
              <button style={s.insertBtn} onClick={handleInsert}>
                ↩ Inserir nas Referências
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
