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

function buildHtmlContent(workData) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${workData.title || "Trabalho Acadêmico"}</title>
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
    <p class="instituicao">${workData.institution || ""}</p>
    <p class="autor">${workData.author || ""}</p>
    <h1>${workData.title || ""}</h1>
    <p class="rodape">${workData.city || ""}<br/>${workData.year || ""}</p>
  </div>
  ${workData.abstract ? `
  <div class="resumo">
    <h2>Resumo</h2>
    <p>${workData.abstract.replace(/\n/g, "</p><p>")}</p>
    ${workData.keywords ? `<p class="keywords"><span class="keywords-label">Palavras-chave:</span> ${workData.keywords}</p>` : ""}
  </div>` : ""}
  ${workData.introduction ? `<h2>1 Introdução</h2><p>${workData.introduction.replace(/\n/g, "</p><p>")}</p>` : ""}
  ${workData.development ? `<h2>2 Desenvolvimento</h2><p>${workData.development.replace(/\n/g, "</p><p>")}</p>` : ""}
  ${workData.conclusion ? `<h2>3 Conclusão</h2><p>${workData.conclusion.replace(/\n/g, "</p><p>")}</p>` : ""}
  ${workData.references ? `<div class="referencias"><h2>Referências</h2>${workData.references.split("\n").filter(Boolean).map(r => `<p>${r}</p>`).join("")}</div>` : ""}
</body>
</html>`;
}

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
