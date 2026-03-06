// src/components/abnt/DocumentExporter.jsx
// Portado de rkmmax-app/src/utils/formatador/src/components/DocumentExporter.tsx
// Exportação local (Word/HTML/PDF via print) — sem chamadas externas
import React, { useState } from "react";

const s = {
  card: { background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  desc: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  btnRow: { display: "flex", flexDirection: "column", gap: 8 },
  btn: (color) => ({
    padding: "10px 16px",
    borderRadius: 8,
    background: color,
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    justifyContent: "center",
  }),
  success: { color: "#10b981", fontSize: 12, textAlign: "center", marginTop: 4 },
};

// ─── XSS GUARD ───────────────────────────────────────────────────────────────

/** Escapa caracteres especiais HTML para prevenir XSS no documento exportado. */
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapa o texto e converte quebras de linha em parágrafos HTML. */
function toParagraphs(text) {
  if (!text) return "";
  return escapeHtml(text).replace(/\n/g, "</p><p>");
}

// ─── HTML BUILDER ─────────────────────────────────────────────────────────────

function buildHtmlContent(workData) {
  const title = escapeHtml(workData.title) || "Trabalho Acadêmico";
  const institution = escapeHtml(workData.institution);
  const author = escapeHtml(workData.author);
  const city = escapeHtml(workData.city);
  const year = escapeHtml(workData.year);
  const keywords = escapeHtml(workData.keywords);

  const resumoSection = workData.abstract
    ? `<div class="resumo">
    <h2>Resumo</h2>
    <p>${toParagraphs(workData.abstract)}</p>
    ${workData.keywords ? `<p class="keywords"><span class="keywords-label">Palavras-chave:</span> ${keywords}</p>` : ""}
  </div>`
    : "";

  const introSection = workData.introduction
    ? `<h2>1 Introdução</h2><p>${toParagraphs(workData.introduction)}</p>`
    : "";

  const devSection = workData.development
    ? `<h2>2 Desenvolvimento</h2><p>${toParagraphs(workData.development)}</p>`
    : "";

  const concSection = workData.conclusion
    ? `<h2>3 Conclusão</h2><p>${toParagraphs(workData.conclusion)}</p>`
    : "";

  const refsSection = workData.references
    ? `<div class="referencias"><h2>Referências</h2>${workData.references
        .split("\n")
        .filter(Boolean)
        .map((r) => `<p>${escapeHtml(r)}</p>`)
        .join("")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  body { font-family: "Times New Roman", serif; font-size: 12pt; margin: 3cm 2cm 2cm 3cm; line-height: 1.5; color: #000; }
  h1 { font-size: 14pt; text-align: center; text-transform: uppercase; font-weight: bold; }
  h2 { font-size: 12pt; text-transform: uppercase; font-weight: bold; margin-top: 24pt; }
  .capa { text-align: center; page-break-after: always; padding-top: 5cm; }
  .capa .instituicao { font-size: 12pt; font-weight: bold; margin-bottom: 4cm; }
  .capa .autor { margin-bottom: 4cm; }
  .capa .rodape { position: fixed; bottom: 2cm; width: 100%; }
  .resumo { page-break-after: always; }
  .keywords { margin-top: 12pt; }
  .keywords-label { font-weight: bold; }
  p { text-indent: 1.25cm; text-align: justify; margin: 0 0 6pt 0; }
  .referencias p { text-indent: 0; }
  @media print { body { margin: 3cm 2cm 2cm 3cm; } }
</style>
</head>
<body>
  <div class="capa">
    <p class="instituicao">${institution}</p>
    <p class="autor">${author}</p>
    <h1>${title}</h1>
    <p class="rodape">${city}<br/>${year}</p>
  </div>
  ${resumoSection}
  ${introSection}
  ${devSection}
  ${concSection}
  ${refsSection}
</body>
</html>`;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function DocumentExporter({ workData }) {
  const [exporting, setExporting] = useState(null);
  const [success, setSuccess] = useState(null);

  const markSuccess = (type) => {
    setSuccess(type);
    setTimeout(() => setSuccess(null), 3000);
  };

  const exportAsWord = () => {
    setExporting("word");
    try {
      const html = buildHtmlContent(workData);
      const blob = new Blob([html], { type: "application/msword" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${workData.title || "trabalho"}_ABNT.doc`;
      a.click();
      URL.revokeObjectURL(a.href);
      markSuccess("word");
    } finally {
      setExporting(null);
    }
  };

  const exportAsHTML = () => {
    setExporting("html");
    try {
      const html = buildHtmlContent(workData);
      const blob = new Blob([html], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${workData.title || "trabalho"}_ABNT.html`;
      a.click();
      URL.revokeObjectURL(a.href);
      markSuccess("html");
    } finally {
      setExporting(null);
    }
  };

  const exportAsPDF = () => {
    setExporting("pdf");
    try {
      const html = buildHtmlContent(workData);
      const win = window.open("", "_blank");
      if (!win) {
        alert("Não foi possível abrir a janela de impressão. Desabilite o bloqueador de pop-ups e tente novamente.");
        setExporting(null);
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        markSuccess("pdf");
        setExporting(null);
      }, 500);
    } catch {
      setExporting(null);
    }
  };

  return (
    <div style={s.card}>
      <div style={s.title}>📤 Exportar Documento</div>
      <div style={s.desc}>Baixe seu trabalho formatado em ABNT</div>
      <div style={s.btnRow}>
        <button style={s.btn("#3b82f6")} onClick={exportAsWord} disabled={!!exporting}>
          📄 {exporting === "word" ? "Exportando..." : "Exportar Word (.doc)"}
        </button>
        <button style={s.btn("#10b981")} onClick={exportAsHTML} disabled={!!exporting}>
          🌐 {exporting === "html" ? "Exportando..." : "Exportar HTML"}
        </button>
        <button style={s.btn("#ef4444")} onClick={exportAsPDF} disabled={!!exporting}>
          📑 {exporting === "pdf" ? "Abrindo impressão..." : "Exportar PDF (via impressão)"}
        </button>
      </div>
      {success && (
        <div style={s.success}>
          ✓ {success === "word" ? "Word exportado!" : success === "html" ? "HTML exportado!" : "Janela de impressão aberta!"}
        </div>
      )}
    </div>
  );
}
