// src/pages/Abnt.jsx
// Formatador ABNT completo — portado de rkmmax-app/src/utils/formatador
// Editor com 4 abas (Capa, Resumo, Conteúdo, Referências) + sidebar (Citações, URL, Biblioteca, Exportar)
// Sem dependências externas novas. Sem chaves no frontend.
// Rollback: git revert <sha> (restaura versão anterior que abria abnt.kizirianmax.site em nova aba)
import React, { useState } from "react";
import { Link } from "react-router-dom";
import CitationGenerator from "../components/abnt/CitationGenerator.jsx";
import URLImporter from "../components/abnt/URLImporter.jsx";
import DocumentExporter from "../components/abnt/DocumentExporter.jsx";
import ReferenceLibrary, { useReferenceLibrary } from "../components/abnt/ReferenceLibrary.jsx";

const TABS = [
  { id: "capa", label: "📋 Capa" },
  { id: "resumo", label: "📝 Resumo" },
  { id: "conteudo", label: "📖 Conteúdo" },
  { id: "referencias", label: "📚 Referências" },
];

const SIDEBAR_TABS = [
  { id: "citation", label: "✍️ Citações" },
  { id: "url", label: "🌐 URL" },
  { id: "library", label: "📚 Biblioteca" },
  { id: "export", label: "📤 Exportar" },
];

const EMPTY_WORK = {
  title: "",
  author: "",
  institution: "",
  course: "",
  city: "",
  year: new Date().getFullYear().toString(),
  abstract: "",
  keywords: "",
  introduction: "",
  development: "",
  conclusion: "",
  references: "",
};

const s = {
  page: { minHeight: "calc(100vh - 64px)", background: "#f1f5f9" },
  header: {
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  backLink: { fontSize: 13, color: "#667eea", textDecoration: "none", fontWeight: 600 },
  divider: { width: 1, height: 20, background: "#e2e8f0" },
  headerTitle: { fontSize: 18, fontWeight: 800, color: "#1e293b" },
  headerSub: { fontSize: 12, color: "#64748b" },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px",
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 20,
    alignItems: "start",
  },
  card: { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" },
  cardHeader: { padding: "16px 20px", borderBottom: "1px solid #e2e8f0" },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 2 },
  cardDesc: { fontSize: 13, color: "#64748b" },
  tabList: { display: "flex", borderBottom: "1px solid #e2e8f0", overflowX: "auto" },
  tab: (active) => ({
    padding: "12px 18px",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? "#667eea" : "#64748b",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #667eea" : "2px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  }),
  tabContent: { padding: "20px" },
  label: { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4, marginTop: 14 },
  labelFirst: { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4, marginTop: 0 },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    color: "#1e293b",
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 160,
    fontFamily: "inherit",
    outline: "none",
    color: "#1e293b",
    lineHeight: 1.6,
  },
  textareaMono: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 13,
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 220,
    fontFamily: "monospace",
    outline: "none",
    color: "#1e293b",
    lineHeight: 1.7,
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  hint: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  sidebarTabList: { display: "flex", borderBottom: "1px solid #e2e8f0", overflowX: "auto" },
  sidebarTab: (active) => ({
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    color: active ? "#667eea" : "#64748b",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #667eea" : "2px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),
  sidebarContent: { padding: "16px" },
  abntTip: {
    background: "white",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #e2e8f0",
    marginTop: 16,
  },
  abntTipTitle: { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 },
  abntTipItem: { display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  abntTipDot: { width: 6, height: 6, borderRadius: "50%", background: "#667eea", marginTop: 5, flexShrink: 0 },
  abntTipText: { fontSize: 12, color: "#64748b", lineHeight: 1.5 },
};

export default function Abnt() {
  const [work, setWork] = useState({ ...EMPTY_WORK });
  const [activeTab, setActiveTab] = useState("capa");
  const [sidebarTab, setSidebarTab] = useState("citation");
  const { addReference } = useReferenceLibrary();

  const set = (field, value) => setWork((w) => ({ ...w, [field]: value }));

  const handleAddReference = (ref) => {
    set("references", work.references ? work.references + "\n\n" + ref : ref);
    addReference(ref, "site");
  };

  const handleSelectFromLibrary = (ref) => {
    set("references", work.references ? work.references + "\n\n" + ref : ref);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <Link to="/study" style={s.backLink}>← Study Lab</Link>
        <div style={s.divider} />
        <div>
          <div style={s.headerTitle}>📝 Formatador ABNT Online</div>
          <div style={s.headerSub}>Formate seus trabalhos acadêmicos automaticamente</div>
        </div>
      </header>

      {/* Layout principal */}
      <div style={s.main}>
        {/* Editor principal */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>Dados do Trabalho</div>
            <div style={s.cardDesc}>Preencha as informações do seu trabalho acadêmico</div>
          </div>

          {/* Abas do editor */}
          <div style={s.tabList}>
            {TABS.map((t) => (
              <button key={t.id} style={s.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={s.tabContent}>
            {/* ─── ABA: CAPA ─── */}
            {activeTab === "capa" && (
              <>
                <label style={s.labelFirst}>Título do Trabalho *</label>
                <input
                  style={s.input}
                  placeholder="Ex: A Importância da Tecnologia na Educação"
                  value={work.title}
                  onChange={(e) => set("title", e.target.value)}
                />

                <label style={s.label}>Autor *</label>
                <input
                  style={s.input}
                  placeholder="Seu nome completo"
                  value={work.author}
                  onChange={(e) => set("author", e.target.value)}
                />

                <div style={s.row}>
                  <div>
                    <label style={s.label}>Instituição *</label>
                    <input
                      style={s.input}
                      placeholder="Nome da universidade"
                      value={work.institution}
                      onChange={(e) => set("institution", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Curso *</label>
                    <input
                      style={s.input}
                      placeholder="Ex: Engenharia de Software"
                      value={work.course}
                      onChange={(e) => set("course", e.target.value)}
                    />
                  </div>
                </div>

                <div style={s.row}>
                  <div>
                    <label style={s.label}>Cidade *</label>
                    <input
                      style={s.input}
                      placeholder="Ex: São Paulo"
                      value={work.city}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Ano *</label>
                    <input
                      style={s.input}
                      placeholder="2024"
                      value={work.year}
                      onChange={(e) => set("year", e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ─── ABA: RESUMO ─── */}
            {activeTab === "resumo" && (
              <>
                <label style={s.labelFirst}>Resumo</label>
                <textarea
                  style={s.textarea}
                  placeholder="Escreva o resumo do seu trabalho (150–500 palavras)..."
                  value={work.abstract}
                  onChange={(e) => set("abstract", e.target.value)}
                />
                <div style={s.hint}>{work.abstract.split(/\s+/).filter(Boolean).length} palavras</div>

                <label style={s.label}>Palavras-chave</label>
                <input
                  style={s.input}
                  placeholder="Ex: educação, tecnologia, aprendizagem"
                  value={work.keywords}
                  onChange={(e) => set("keywords", e.target.value)}
                />
                <div style={s.hint}>Separe por vírgula</div>
              </>
            )}

            {/* ─── ABA: CONTEÚDO ─── */}
            {activeTab === "conteudo" && (
              <>
                <label style={s.labelFirst}>1 Introdução</label>
                <textarea
                  style={s.textarea}
                  placeholder="Apresente o tema, justificativa, objetivos e estrutura do trabalho..."
                  value={work.introduction}
                  onChange={(e) => set("introduction", e.target.value)}
                />
                <div style={s.hint}>{work.introduction.split(/\s+/).filter(Boolean).length} palavras</div>

                <label style={s.label}>2 Desenvolvimento</label>
                <textarea
                  style={{ ...s.textarea, minHeight: 240 }}
                  placeholder="Desenvolva os tópicos principais, fundamentação teórica, metodologia e análise..."
                  value={work.development}
                  onChange={(e) => set("development", e.target.value)}
                />
                <div style={s.hint}>{work.development.split(/\s+/).filter(Boolean).length} palavras</div>

                <label style={s.label}>3 Conclusão</label>
                <textarea
                  style={s.textarea}
                  placeholder="Sintetize os resultados, responda aos objetivos e sugira trabalhos futuros..."
                  value={work.conclusion}
                  onChange={(e) => set("conclusion", e.target.value)}
                />
                <div style={s.hint}>{work.conclusion.split(/\s+/).filter(Boolean).length} palavras</div>
              </>
            )}

            {/* ─── ABA: REFERÊNCIAS ─── */}
            {activeTab === "referencias" && (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                  Cole ou gere referências no formato ABNT. Use as ferramentas na barra lateral para gerar automaticamente.
                </div>
                <textarea
                  style={s.textareaMono}
                  placeholder={"AUTOR, Nome. Título do livro. Cidade: Editora, Ano.\nAUTOR, Nome. Título do artigo. Nome da Revista, v. X, n. Y, p. Z-W, Ano."}
                  value={work.references}
                  onChange={(e) => set("references", e.target.value)}
                />
                <div style={s.hint}>{work.references.split("\n").filter(Boolean).length} referência(s)</div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Ferramentas */}
          <div style={s.card}>
            <div style={s.sidebarTabList}>
              {SIDEBAR_TABS.map((t) => (
                <button key={t.id} style={s.sidebarTab(sidebarTab === t.id)} onClick={() => setSidebarTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={s.sidebarContent}>
              {sidebarTab === "citation" && (
                <CitationGenerator onInsertCitation={handleAddReference} />
              )}
              {sidebarTab === "url" && (
                <URLImporter onAddReference={handleAddReference} />
              )}
              {sidebarTab === "library" && (
                <ReferenceLibrary onSelectReference={handleSelectFromLibrary} />
              )}
              {sidebarTab === "export" && (
                <DocumentExporter workData={work} />
              )}
            </div>
          </div>

          {/* Normas ABNT */}
          <div style={s.abntTip}>
            <div style={s.abntTipTitle}>📐 Normas ABNT</div>
            {[
              "Margens: 3cm superior e esquerda, 2cm inferior e direita",
              "Fonte: Arial ou Times New Roman, tamanho 12",
              "Espaçamento: 1,5 entre linhas",
              "Numeração: a partir da introdução",
            ].map((tip) => (
              <div key={tip} style={s.abntTipItem}>
                <div style={s.abntTipDot} />
                <span style={s.abntTipText}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
