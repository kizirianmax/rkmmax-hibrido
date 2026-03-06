// src/pages/GeradorResumos.jsx
import React, { useState } from "react";
import { studyLabAI } from "../lib/StudyLabAI.js";

const ESTILOS_RESUMO = [
  { value: "academico", label: "📚 Acadêmico", desc: "Formal, com citações e referências" },
  { value: "bullet", label: "📝 Bullet Points", desc: "Tópicos organizados e diretos" },
  { value: "mapa", label: "🗺️ Mapa Mental", desc: "Hierárquico com conexões" },
  { value: "fichamento", label: "📋 Fichamento", desc: "Citações + comentários" },
  { value: "esquema", label: "📊 Esquema", desc: "Estruturado por temas" }
];

const TAMANHOS = [
  { value: "curto", label: "Curto (~100 palavras)" },
  { value: "medio", label: "Médio (~250 palavras)" },
  { value: "longo", label: "Longo (~500 palavras)" },
  { value: "detalhado", label: "Detalhado (~1000 palavras)" }
];

export default function GeradorResumos() {
  const [texto, setTexto] = useState("");
  const [estilo, setEstilo] = useState("bullet");
  const [tamanho, setTamanho] = useState("medio");
  const [incluirPalavrasChave, setIncluirPalavrasChave] = useState(true);
  const [incluirConclusao, setIncluirConclusao] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumoGerado, setResumoGerado] = useState(null);

  const contarPalavras = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const extrairPalavrasChave = (text) => {
    // Palavras comuns para ignorar
    const stopWords = ["o", "a", "os", "as", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos", 
      "em", "na", "no", "nas", "nos", "por", "para", "com", "sem", "que", "se", "não", "mais", "mas",
      "como", "quando", "onde", "qual", "quais", "este", "esta", "esse", "essa", "isto", "isso",
      "ele", "ela", "eles", "elas", "seu", "sua", "seus", "suas", "muito", "muita", "muitos", "muitas",
      "todo", "toda", "todos", "todas", "outro", "outra", "outros", "outras", "mesmo", "mesma",
      "já", "ainda", "também", "só", "apenas", "entre", "sobre", "após", "até", "desde", "durante"];
    
    const words = text.toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  };

  const gerarResumoSimulado = (texto, estilo, tamanho) => {
    const palavrasOriginal = contarPalavras(texto);
    const palavrasChave = extrairPalavrasChave(texto);
    
    // Extrair primeiras frases como "resumo"
    const frases = texto.split(/[.!?]+/).filter(f => f.trim().length > 20);
    
    let resumo = "";
    let topicos = [];
    
    // Simular extração de tópicos principais
    const numTopicos = tamanho === "curto" ? 3 : tamanho === "medio" ? 5 : tamanho === "longo" ? 7 : 10;
    
    for (let i = 0; i < Math.min(numTopicos, frases.length); i++) {
      topicos.push(frases[i].trim());
    }
    
    if (estilo === "bullet") {
      resumo = topicos.map(t => `• ${t}`).join("\n\n");
    } else if (estilo === "academico") {
      resumo = `O texto apresenta uma análise sobre ${palavrasChave.slice(0, 3).join(", ")}.\n\n`;
      resumo += topicos.slice(0, 3).join(". ") + ".\n\n";
      resumo += `Em síntese, os principais aspectos abordados relacionam-se com ${palavrasChave.slice(0, 2).join(" e ")}.`;
    } else if (estilo === "mapa") {
      resumo = `📌 TEMA CENTRAL: ${palavrasChave[0] || "Tema Principal"}\n\n`;
      resumo += `├── ${palavrasChave[1] || "Subtema 1"}\n`;
      resumo += `│   └── ${topicos[0] || "Detalhe"}\n`;
      resumo += `├── ${palavrasChave[2] || "Subtema 2"}\n`;
      resumo += `│   └── ${topicos[1] || "Detalhe"}\n`;
      resumo += `└── ${palavrasChave[3] || "Subtema 3"}\n`;
      resumo += `    └── ${topicos[2] || "Detalhe"}`;
    } else if (estilo === "fichamento") {
      resumo = `📖 FICHAMENTO\n\n`;
      resumo += `Tema: ${palavrasChave.slice(0, 2).join(", ")}\n\n`;
      topicos.slice(0, 4).forEach((t, i) => {
        resumo += `[Citação ${i + 1}] "${t}"\n`;
        resumo += `→ Comentário: Ponto relevante sobre ${palavrasChave[i] || "o tema"}.\n\n`;
      });
    } else {
      resumo = `═══════════════════════════════\n`;
      resumo += `        ESQUEMA DE ESTUDO\n`;
      resumo += `═══════════════════════════════\n\n`;
      resumo += `1. INTRODUÇÃO\n`;
      resumo += `   ${topicos[0] || "Apresentação do tema"}\n\n`;
      resumo += `2. DESENVOLVIMENTO\n`;
      topicos.slice(1, 4).forEach((t, i) => {
        resumo += `   ${i + 2}.${i + 1} ${t}\n`;
      });
      resumo += `\n3. CONCLUSÃO\n`;
      resumo += `   Síntese dos pontos principais.`;
    }
    
    return {
      resumo,
      palavrasChave,
      estatisticas: {
        palavrasOriginal,
        palavrasResumo: contarPalavras(resumo),
        reducao: Math.round((1 - contarPalavras(resumo) / palavrasOriginal) * 100)
      }
    };
  };

  const handleGerar = async () => {
    if (!texto.trim() || contarPalavras(texto) < 50) return;
    
    setIsGenerating(true);
    
    try {
      // Usar IA real do Gemini
      const resultado = await studyLabAI.gerarResumo(texto, estilo, tamanho);
      setResumoGerado(resultado);
    } catch (error) {
      console.error('Erro ao gerar resumo com IA:', error);
      // Fallback para geração simulada
      const resultado = gerarResumoSimulado(texto, estilo, tamanho);
      setResumoGerado(resultado);
    }
    
    setIsGenerating(false);
  };

  const copiarResumo = () => {
    if (resumoGerado) {
      navigator.clipboard.writeText(resumoGerado.resumo);
      alert("Resumo copiado para a área de transferência!");
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/study" style={styles.backButton}>
          ← Voltar
        </a>
        <div style={styles.headerContent}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>📚</span>
          </div>
          <div>
            <h1 style={styles.title}>Gerador de Resumos</h1>
            <p style={styles.subtitle}>Transforme textos em resumos estruturados</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Card de Input */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>📝 Cole seu texto</h2>
            <p style={styles.cardDescription}>
              Mínimo de 50 palavras para gerar um resumo de qualidade
            </p>
          </div>

          <div style={styles.inputGroup}>
            <textarea
              placeholder="Cole aqui o texto que deseja resumir. Pode ser um artigo, capítulo de livro, notícia, ou qualquer conteúdo que você precisa estudar..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              style={styles.textarea}
            />
            <div style={styles.wordCount}>
              {contarPalavras(texto)} palavras
              {contarPalavras(texto) > 0 && contarPalavras(texto) < 50 && (
                <span style={styles.wordCountWarning}> (mínimo: 50)</span>
              )}
            </div>
          </div>

          {/* Estilo do Resumo */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Estilo do Resumo</label>
            <div style={styles.estilosGrid}>
              {ESTILOS_RESUMO.map(e => (
                <button
                  key={e.value}
                  style={{
                    ...styles.estiloButton,
                    ...(estilo === e.value ? styles.estiloButtonActive : {})
                  }}
                  onClick={() => setEstilo(e.value)}
                >
                  <span style={styles.estiloLabel}>{e.label}</span>
                  <span style={styles.estiloDesc}>{e.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamanho */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tamanho do Resumo</label>
            <select
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
              style={styles.select}
            >
              {TAMANHOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Opções */}
          <div style={styles.opcoesGrid}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={incluirPalavrasChave}
                onChange={(e) => setIncluirPalavrasChave(e.target.checked)}
                style={styles.checkbox}
              />
              Incluir palavras-chave
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={incluirConclusao}
                onChange={(e) => setIncluirConclusao(e.target.checked)}
                style={styles.checkbox}
              />
              Incluir conclusão
            </label>
          </div>

          {/* Botão Gerar */}
          <button
            style={{
              ...styles.button,
              ...(isGenerating || contarPalavras(texto) < 50 ? styles.buttonDisabled : {})
            }}
            onClick={handleGerar}
            disabled={isGenerating || contarPalavras(texto) < 50}
          >
            {isGenerating ? "⏳ Gerando resumo..." : "✨ Gerar Resumo"}
          </button>
        </div>

        {/* Resultado */}
        {resumoGerado && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <h2 style={styles.resultTitle}>📋 Seu Resumo</h2>
              <button style={styles.copyButton} onClick={copiarResumo}>
                📋 Copiar
              </button>
            </div>

            {/* Estatísticas */}
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{resumoGerado.estatisticas.palavrasOriginal}</span>
                <span style={styles.statLabel}>Palavras originais</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{resumoGerado.estatisticas.palavrasResumo}</span>
                <span style={styles.statLabel}>Palavras no resumo</span>
              </div>
              <div style={styles.statItem}>
                <span style={{...styles.statNumber, color: "#10b981"}}>{resumoGerado.estatisticas.reducao}%</span>
                <span style={styles.statLabel}>Redução</span>
              </div>
            </div>

            {/* Palavras-chave */}
            {incluirPalavrasChave && resumoGerado.palavrasChave.length > 0 && (
              <div style={styles.keywordsSection}>
                <h3 style={styles.keywordsTitle}>🔑 Palavras-chave</h3>
                <div style={styles.keywordsGrid}>
                  {resumoGerado.palavrasChave.map((palavra, i) => (
                    <span key={i} style={styles.keyword}>{palavra}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo */}
            <div style={styles.resumoBox}>
              <pre style={styles.resumoText}>{resumoGerado.resumo}</pre>
            </div>

            {/* Ações */}
            <div style={styles.actionsGrid}>
              <button style={styles.actionButton} onClick={() => {
                setResumoGerado(null);
                setTexto("");
              }}>
                🔄 Novo Resumo
              </button>
              <button style={styles.actionButtonPrimary} onClick={() => alert("Exportação em PDF em breve!")}>
                📄 Exportar PDF
              </button>
            </div>
          </div>
        )}

        {/* Dicas */}
        <div style={styles.tipsCard}>
          <h3 style={styles.tipsTitle}>💡 Dicas para melhores resumos</h3>
          <ul style={styles.tipsList}>
            <li>Use textos completos, não apenas trechos soltos</li>
            <li>Quanto maior o texto original, melhor a qualidade do resumo</li>
            <li>O estilo "Bullet Points" é ideal para revisão rápida</li>
            <li>O estilo "Fichamento" é perfeito para trabalhos acadêmicos</li>
            <li>Revise sempre o resumo gerado antes de usar</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    padding: "16px 20px",
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  backButton: {
    color: "white",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    display: "inline-block",
    marginBottom: 12
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "linear-gradient(135deg, #f87171, #ef4444)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  icon: {
    fontSize: 24
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "white",
    margin: 0
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    margin: 0
  },
  main: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 16px 48px"
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    marginBottom: 24
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: 24
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 8px"
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748b",
    margin: 0
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8
  },
  textarea: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 15,
    outline: "none",
    minHeight: 200,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
    lineHeight: 1.6
  },
  wordCount: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 8,
    textAlign: "right"
  },
  wordCountWarning: {
    color: "#ef4444"
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    background: "white",
    cursor: "pointer"
  },
  estilosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12
  },
  estiloButton: {
    padding: "14px 12px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s"
  },
  estiloButtonActive: {
    borderColor: "#ef4444",
    background: "#fef2f2"
  },
  estiloLabel: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4
  },
  estiloDesc: {
    display: "block",
    fontSize: 11,
    color: "#64748b"
  },
  opcoesGrid: {
    display: "flex",
    gap: 20,
    marginBottom: 24
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#374151",
    cursor: "pointer"
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer"
  },
  button: {
    width: "100%",
    padding: "16px 24px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(220,38,38,0.3)"
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  resultCard: {
    background: "white",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    marginBottom: 24
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e293b",
    margin: 0
  },
  copyButton: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  statsGrid: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    marginBottom: 24,
    padding: "16px 0",
    borderBottom: "1px solid #e2e8f0"
  },
  statItem: {
    textAlign: "center"
  },
  statNumber: {
    display: "block",
    fontSize: 28,
    fontWeight: 800,
    color: "#1e293b"
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b"
  },
  keywordsSection: {
    marginBottom: 20
  },
  keywordsTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 10
  },
  keywordsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  keyword: {
    padding: "6px 12px",
    borderRadius: 20,
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 600
  },
  resumoBox: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  resumoText: {
    margin: 0,
    fontSize: 15,
    color: "#1e293b",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
    fontFamily: "inherit"
  },
  actionsGrid: {
    display: "flex",
    gap: 12
  },
  actionButton: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  actionButtonPrimary: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  tipsCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 12
  },
  tipsList: {
    margin: 0,
    paddingLeft: 20,
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.8
  }
};
