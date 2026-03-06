// src/components/abnt/CitationGenerator.jsx
// Portado de rkmmax-app/src/utils/formatador/src/components/CitationGenerator.tsx
// Convertido de TypeScript + shadcn para JSX puro com inline styles (sem novas deps)
import React, { useState } from "react";

const SOURCE_TYPES = [
  { value: "livro", label: "📚 Livro" },
  { value: "artigo", label: "📄 Artigo" },
  { value: "site", label: "🌐 Site" },
  { value: "tese", label: "🎓 Tese/Dissertação" },
];

const EMPTY_FORMS = {
  livro: { author: "", title: "", subtitle: "", edition: "", city: "", publisher: "", year: "" },
  artigo: { author: "", title: "", journal: "", city: "", volume: "", number: "", pages: "", month: "", year: "" },
  site: { author: "", title: "", siteName: "", url: "", year: "", accessDate: new Date().toLocaleDateString("pt-BR") },
  tese: { author: "", title: "", year: "", pages: "", type: "Dissertação", degree: "Mestrado", institution: "", city: "" },
};

function formatAuthor(author) {
  if (!author) return "";
  const parts = author.trim().split(" ");
  if (parts.length === 1) return parts[0].toUpperCase();
  const lastName = parts.pop().toUpperCase();
  return `${lastName}, ${parts.join(" ")}`;
}

function generateCitation(type, data) {
  const fa = formatAuthor(data.author);
  // authorPrefix garante que não saia ". " no início quando não há autor
  const authorPrefix = fa ? `${fa}. ` : "";
  switch (type) {
    case "livro":
      return `${authorPrefix}${data.title}${data.subtitle ? `: ${data.subtitle}` : ""}. ${data.edition ? `${data.edition}. ed. ` : ""}${data.city || "Local"}: ${data.publisher || "Editora"}, ${data.year || "Ano"}.`;
    case "artigo":
      return `${authorPrefix}${data.title}. ${data.journal || "Nome da Revista"}, ${data.city || "Local"}, v. ${data.volume || "X"}, n. ${data.number || "X"}, p. ${data.pages || "X-X"}, ${data.month || ""} ${data.year || "Ano"}.`;
    case "site":
      return `${authorPrefix}${data.title}. ${data.siteName || "Nome do site"}, ${data.year || new Date().getFullYear()}. Dispon\u00edvel em: ${data.url || "URL"}. Acesso em: ${data.accessDate || new Date().toLocaleDateString("pt-BR")}.`;
    case "tese":
      return `${authorPrefix}${data.title}. ${data.year || "Ano"}. ${data.pages ? `${data.pages} f. ` : ""}${data.type || "Disserta\u00e7\u00e3o"} (${data.degree || "Mestrado"}) - ${data.institution || "Institui\u00e7\u00e3o"}, ${data.city || "Local"}, ${data.year || "Ano"}.`;
    default:
      return "";
  }
}

const s = {
  card: { background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  desc: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tab: (active) => ({ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: active ? "#667eea" : "white", color: active ? "white" : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 }),
  label: { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box", marginBottom: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  btn: { padding: "10px 20px", borderRadius: 8, background: "#667eea", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  result: { background: "#f8fafc", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "monospace", lineHeight: 1.6, marginTop: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  copyBtn: { padding: "6px 14px", borderRadius: 8, background: "#10b981", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, marginTop: 8 },
};

export default function CitationGenerator({ onInsertCitation }) {
  const [type, setType] = useState("livro");
  const [form, setForm] = useState({ ...EMPTY_FORMS.livro });
  const [citation, setCitation] = useState("");
  const [copied, setCopied] = useState(false);

  const handleTypeChange = (t) => {
    setType(t);
    setForm({ ...EMPTY_FORMS[t] });
    setCitation("");
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleGenerate = () => {
    const c = generateCitation(type, form);
    setCitation(c);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onInsertCitation && citation) onInsertCitation(citation, type);
  };

  return (
    <div style={s.card}>
      <div style={s.title}>✍️ Gerador de Citações</div>
      <div style={s.desc}>Gere referências ABNT formatadas automaticamente</div>

      {/* Tipo de fonte */}
      <div style={s.tabs}>
        {SOURCE_TYPES.map((st) => (
          <button key={st.value} style={s.tab(type === st.value)} onClick={() => handleTypeChange(st.value)}>
            {st.label}
          </button>
        ))}
      </div>

      {/* Formulário dinâmico */}
      {type === "livro" && (
        <>
          <label style={s.label}>Autor</label>
          <input style={s.input} placeholder="Nome Sobrenome" value={form.author} onChange={(e) => handleChange("author", e.target.value)} />
          <label style={s.label}>Título *</label>
          <input style={s.input} placeholder="Título do livro" value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
          <label style={s.label}>Subtítulo</label>
          <input style={s.input} placeholder="Subtítulo (opcional)" value={form.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Edição</label>
              <input style={s.input} placeholder="Ex: 3" value={form.edition} onChange={(e) => handleChange("edition", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Ano</label>
              <input style={s.input} placeholder="2024" value={form.year} onChange={(e) => handleChange("year", e.target.value)} />
            </div>
          </div>
          <div style={s.row}>
            <div>
              <label style={s.label}>Cidade</label>
              <input style={s.input} placeholder="São Paulo" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Editora</label>
              <input style={s.input} placeholder="Nome da editora" value={form.publisher} onChange={(e) => handleChange("publisher", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {type === "artigo" && (
        <>
          <label style={s.label}>Autor</label>
          <input style={s.input} placeholder="Nome Sobrenome" value={form.author} onChange={(e) => handleChange("author", e.target.value)} />
          <label style={s.label}>Título do artigo *</label>
          <input style={s.input} placeholder="Título" value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
          <label style={s.label}>Nome da Revista/Periódico *</label>
          <input style={s.input} placeholder="Ex: Revista Brasileira de Educação" value={form.journal} onChange={(e) => handleChange("journal", e.target.value)} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Volume</label>
              <input style={s.input} placeholder="v. X" value={form.volume} onChange={(e) => handleChange("volume", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Número</label>
              <input style={s.input} placeholder="n. X" value={form.number} onChange={(e) => handleChange("number", e.target.value)} />
            </div>
          </div>
          <div style={s.row}>
            <div>
              <label style={s.label}>Páginas</label>
              <input style={s.input} placeholder="p. X-X" value={form.pages} onChange={(e) => handleChange("pages", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Ano</label>
              <input style={s.input} placeholder="2024" value={form.year} onChange={(e) => handleChange("year", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {type === "site" && (
        <>
          <label style={s.label}>Autor (opcional)</label>
          <input style={s.input} placeholder="Nome Sobrenome" value={form.author} onChange={(e) => handleChange("author", e.target.value)} />
          <label style={s.label}>Título da página *</label>
          <input style={s.input} placeholder="Título" value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
          <label style={s.label}>Nome do site</label>
          <input style={s.input} placeholder="Ex: G1, UOL" value={form.siteName} onChange={(e) => handleChange("siteName", e.target.value)} />
          <label style={s.label}>URL *</label>
          <input style={s.input} placeholder="https://..." value={form.url} onChange={(e) => handleChange("url", e.target.value)} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Ano</label>
              <input style={s.input} placeholder="2024" value={form.year} onChange={(e) => handleChange("year", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Data de acesso</label>
              <input style={s.input} placeholder="DD/MM/AAAA" value={form.accessDate} onChange={(e) => handleChange("accessDate", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {type === "tese" && (
        <>
          <label style={s.label}>Autor *</label>
          <input style={s.input} placeholder="Nome Sobrenome" value={form.author} onChange={(e) => handleChange("author", e.target.value)} />
          <label style={s.label}>Título *</label>
          <input style={s.input} placeholder="Título da tese/dissertação" value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Tipo</label>
              <select style={s.input} value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
                <option>Dissertação</option>
                <option>Tese</option>
                <option>Monografia</option>
                <option>TCC</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Grau</label>
              <select style={s.input} value={form.degree} onChange={(e) => handleChange("degree", e.target.value)}>
                <option>Mestrado</option>
                <option>Doutorado</option>
                <option>Especialização</option>
                <option>Graduação</option>
              </select>
            </div>
          </div>
          <label style={s.label}>Instituição</label>
          <input style={s.input} placeholder="Nome da universidade" value={form.institution} onChange={(e) => handleChange("institution", e.target.value)} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Cidade</label>
              <input style={s.input} placeholder="São Paulo" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Ano</label>
              <input style={s.input} placeholder="2024" value={form.year} onChange={(e) => handleChange("year", e.target.value)} />
            </div>
          </div>
        </>
      )}

      <button style={s.btn} onClick={handleGenerate}>Gerar Referência ABNT</button>

      {citation && (
        <div>
          <div style={s.result}>{citation}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button style={s.copyBtn} onClick={handleCopy}>{copied ? "✓ Copiado!" : "📋 Copiar"}</button>
            {onInsertCitation && (
              <button style={{ ...s.copyBtn, background: "#667eea" }} onClick={handleInsert}>
                ↩ Inserir nas Referências
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
