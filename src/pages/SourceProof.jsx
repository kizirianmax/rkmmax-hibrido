// src/pages/SourceProof.jsx
import React, { useState } from "react";
import { studyLabAI } from "../lib/StudyLabAI.js";

// Domínios acadêmicos confiáveis
const DOMINIOS_CONFIAVEIS = [
  "scielo.br", "scielo.org",
  "scholar.google.com",
  "pubmed.ncbi.nlm.nih.gov",
  "researchgate.net",
  "academia.edu",
  "jstor.org",
  "springer.com",
  "nature.com",
  "science.org",
  "ieee.org",
  "acm.org",
  "gov.br",
  "edu.br",
  ".edu",
  ".gov",
  "periodicos.capes.gov.br",
  "bdtd.ibict.br"
];

// Domínios de baixa credibilidade
const DOMINIOS_BAIXA_CREDIBILIDADE = [
  "wikipedia.org",
  "blogspot.com",
  "wordpress.com",
  "medium.com",
  "yahoo.com",
  "answers.yahoo.com",
  "brainly.com.br",
  "trabalhosfeitos.com",
  "monografias.com",
  "passeidireto.com"
];

export default function SourceProof() {
  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [modoAnalise, setModoAnalise] = useState("url");

  const extrairURLsDoTexto = (texto) => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    const matches = texto.match(urlRegex) || [];
    return [...new Set(matches)];
  };

  const analisarFonte = (urlFonte) => {
    const motivos = [];
    const sugestoes = [];
    let credibilidade = "desconhecida";
    let tipo = "desconhecido";

    // Extrair domínio
    let dominio = "";
    try {
      const urlObj = new URL(urlFonte);
      dominio = urlObj.hostname.replace("www.", "");
    } catch {
      dominio = urlFonte;
    }

    // Verificar domínios confiáveis
    const ehConfiavel = DOMINIOS_CONFIAVEIS.some(d => dominio.includes(d));
    const ehBaixaCredibilidade = DOMINIOS_BAIXA_CREDIBILIDADE.some(d => dominio.includes(d));

    if (ehConfiavel) {
      credibilidade = "alta";
      motivos.push("Fonte de domínio acadêmico/governamental reconhecido");
      
      if (dominio.includes("scielo")) {
        tipo = "artigo";
        motivos.push("SciELO é uma biblioteca eletrônica de periódicos científicos");
      } else if (dominio.includes("scholar.google")) {
        tipo = "artigo";
        motivos.push("Google Scholar indexa literatura acadêmica revisada por pares");
      } else if (dominio.includes("pubmed")) {
        tipo = "artigo";
        motivos.push("PubMed é referência em publicações biomédicas");
      } else if (dominio.includes(".gov")) {
        tipo = "site";
        motivos.push("Fonte governamental oficial");
      } else if (dominio.includes(".edu")) {
        tipo = "site";
        motivos.push("Fonte de instituição educacional");
      }
    } else if (ehBaixaCredibilidade) {
      credibilidade = "baixa";
      
      if (dominio.includes("wikipedia")) {
        tipo = "site";
        motivos.push("Wikipedia não é aceita como fonte acadêmica primária");
        sugestoes.push("Use a Wikipedia apenas como ponto de partida e busque as referências originais citadas");
      } else if (dominio.includes("brainly") || dominio.includes("passeidireto")) {
        tipo = "site";
        motivos.push("Sites de compartilhamento de respostas não são fontes confiáveis");
        sugestoes.push("Busque artigos científicos ou livros sobre o tema");
      } else if (dominio.includes("blogspot") || dominio.includes("wordpress") || dominio.includes("medium")) {
        tipo = "site";
        motivos.push("Blogs pessoais não passam por revisão por pares");
        sugestoes.push("Verifique se o autor é especialista na área e busque fontes primárias");
      } else {
        motivos.push("Fonte de baixa credibilidade acadêmica");
        sugestoes.push("Substitua por fontes acadêmicas revisadas por pares");
      }
    } else {
      credibilidade = "media";
      tipo = "site";
      motivos.push("Fonte não reconhecida automaticamente");
      sugestoes.push("Verifique manualmente a credibilidade do autor e da publicação");
      sugestoes.push("Prefira fontes com revisão por pares quando possível");
    }

    // Verificar extensões de arquivo
    if (urlFonte.includes(".pdf")) {
      motivos.push("Documento em PDF (pode ser artigo ou relatório)");
    }

    return {
      url: urlFonte,
      tipo,
      credibilidade,
      motivos,
      sugestoes,
      dominio
    };
  };

  const handleAnalisar = async () => {
    setIsAnalyzing(true);
    setResultados([]);

    let urls = [];
    
    if (modoAnalise === "url") {
      if (url.trim()) {
        urls = [url.trim()];
      }
    } else {
      urls = extrairURLsDoTexto(texto);
    }

    // Tentar usar IA para análise mais profunda
    try {
      const analiseIA = await studyLabAI.analisarFontes(urls);
      if (analiseIA && analiseIA.length > 0) {
        setResultados(analiseIA);
        setIsAnalyzing(false);
        return;
      }
    } catch (error) {
      console.error('Erro na análise com IA, usando fallback:', error);
    }

    if (urls.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    const analises = urls.map(u => analisarFonte(u));
    setResultados(analises);
    setIsAnalyzing(false);
  };

  const getCredibilidadeColor = (credibilidade) => {
    switch (credibilidade) {
      case "alta": return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
      case "media": return { bg: "#fef9c3", text: "#854d0e", border: "#fde047" };
      case "baixa": return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
      default: return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  const contarCredibilidade = () => {
    const alta = resultados.filter(r => r.credibilidade === "alta").length;
    const media = resultados.filter(r => r.credibilidade === "media").length;
    const baixa = resultados.filter(r => r.credibilidade === "baixa").length;
    return { alta, media, baixa };
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
            <span style={styles.icon}>🔍</span>
          </div>
          <div>
            <h1 style={styles.title}>Source-Proof</h1>
            <p style={styles.subtitle}>Validador de Fontes Acadêmicas</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Card de Análise */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>🔍</div>
            <h2 style={styles.cardTitle}>Verifique suas Fontes</h2>
            <p style={styles.cardDescription}>
              Cole uma URL ou um texto com referências para analisar a credibilidade
            </p>
          </div>

          {/* Seletor de Modo */}
          <div style={styles.modeSelector}>
            <button
              style={{
                ...styles.modeButton,
                ...(modoAnalise === "url" ? styles.modeButtonActive : {})
              }}
              onClick={() => setModoAnalise("url")}
            >
              🌐 URL Única
            </button>
            <button
              style={{
                ...styles.modeButton,
                ...(modoAnalise === "texto" ? styles.modeButtonActive : {})
              }}
              onClick={() => setModoAnalise("texto")}
            >
              📄 Texto com URLs
            </button>
          </div>

          {/* Input */}
          {modoAnalise === "url" ? (
            <div style={styles.inputGroup}>
              <label style={styles.label}>URL da Fonte</label>
              <input
                type="url"
                placeholder="https://exemplo.com/artigo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={styles.input}
              />
            </div>
          ) : (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Cole seu texto com referências</label>
              <textarea
                placeholder="Cole aqui o texto do seu trabalho ou lista de referências. O sistema irá extrair e analisar todas as URLs encontradas."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                style={styles.textarea}
              />
              {texto && (
                <p style={styles.urlCount}>
                  {extrairURLsDoTexto(texto).length} URL(s) encontrada(s) no texto
                </p>
              )}
            </div>
          )}

          {/* Botão Analisar */}
          <button
            style={{
              ...styles.analyzeButton,
              ...(isAnalyzing || (modoAnalise === "url" ? !url : !texto) ? styles.analyzeButtonDisabled : {})
            }}
            onClick={handleAnalisar}
            disabled={isAnalyzing || (modoAnalise === "url" ? !url : !texto)}
          >
            {isAnalyzing ? (
              <>⏳ Analisando...</>
            ) : (
              <>🔍 Analisar Credibilidade</>
            )}
          </button>
        </div>

        {/* Resumo dos Resultados */}
        {resultados.length > 0 && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryIcon, background: "#dcfce7" }}>
                  ✅
                </div>
                <p style={{ ...styles.summaryNumber, color: "#166534" }}>{contarCredibilidade().alta}</p>
                <p style={styles.summaryLabel}>Alta</p>
              </div>
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryIcon, background: "#fef9c3" }}>
                  ⚠️
                </div>
                <p style={{ ...styles.summaryNumber, color: "#854d0e" }}>{contarCredibilidade().media}</p>
                <p style={styles.summaryLabel}>Média</p>
              </div>
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryIcon, background: "#fee2e2" }}>
                  ❌
                </div>
                <p style={{ ...styles.summaryNumber, color: "#991b1b" }}>{contarCredibilidade().baixa}</p>
                <p style={styles.summaryLabel}>Baixa</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        {resultados.length > 0 && (
          <div style={styles.resultsSection}>
            <h2 style={styles.resultsTitle}>Resultados da Análise</h2>
            
            {resultados.map((resultado, index) => {
              const colors = getCredibilidadeColor(resultado.credibilidade);
              return (
                <div key={index} style={styles.resultCard}>
                  <div style={{ ...styles.resultBar, background: colors.border }} />
                  <div style={styles.resultContent}>
                    <div style={styles.resultHeader}>
                      <span style={{
                        ...styles.badge,
                        background: colors.bg,
                        color: colors.text,
                        borderColor: colors.border
                      }}>
                        {resultado.credibilidade === "alta" ? "✅" : resultado.credibilidade === "media" ? "⚠️" : "❌"}{" "}
                        Credibilidade {resultado.credibilidade.charAt(0).toUpperCase() + resultado.credibilidade.slice(1)}
                      </span>
                      <span style={styles.typeBadge}>
                        {resultado.tipo === "artigo" ? "📄" : "🌐"} {resultado.tipo.charAt(0).toUpperCase() + resultado.tipo.slice(1)}
                      </span>
                    </div>
                    
                    <a 
                      href={resultado.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={styles.resultUrl}
                    >
                      {resultado.url.length > 60 ? resultado.url.substring(0, 60) + "..." : resultado.url} ↗
                    </a>

                    {resultado.dominio && (
                      <p style={styles.domainText}>
                        Domínio: {resultado.dominio}
                      </p>
                    )}

                    {/* Motivos */}
                    <div style={styles.motivosSection}>
                      {resultado.motivos.map((motivo, i) => (
                        <p key={i} style={styles.motivoItem}>
                          <span style={styles.bullet}>•</span>
                          {motivo}
                        </p>
                      ))}
                    </div>

                    {/* Sugestões */}
                    {resultado.sugestoes.length > 0 && (
                      <div style={styles.sugestoesSection}>
                        <p style={styles.sugestoesTitle}>Sugestões</p>
                        {resultado.sugestoes.map((sugestao, i) => (
                          <p key={i} style={styles.sugestaoItem}>
                            <span style={styles.arrow}>→</span>
                            {sugestao}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dicas */}
        <div style={styles.tipsCard}>
          <h3 style={styles.tipsTitle}>
            📚 Dicas para Fontes Acadêmicas
          </h3>
          <div style={styles.tipsList}>
            <div style={styles.tipItem}>
              <span style={styles.tipIcon}>✅</span>
              <p style={styles.tipText}>
                <strong>Prefira fontes revisadas por pares:</strong> Artigos de periódicos científicos passam por revisão de especialistas.
              </p>
            </div>
            <div style={styles.tipItem}>
              <span style={styles.tipIcon}>✅</span>
              <p style={styles.tipText}>
                <strong>Use bases de dados acadêmicas:</strong> SciELO, Google Scholar, PubMed, CAPES Periódicos.
              </p>
            </div>
            <div style={styles.tipItem}>
              <span style={styles.tipIcon}>✅</span>
              <p style={styles.tipText}>
                <strong>Verifique a data de publicação:</strong> Fontes recentes são geralmente mais relevantes.
              </p>
            </div>
            <div style={styles.tipItem}>
              <span style={styles.tipIcon}>⚠️</span>
              <p style={styles.tipText}>
                <strong>Evite Wikipedia como fonte primária:</strong> Use-a apenas para encontrar referências originais.
              </p>
            </div>
            <div style={styles.tipItem}>
              <span style={styles.tipIcon}>❌</span>
              <p style={styles.tipText}>
                <strong>Não use sites de respostas:</strong> Brainly, Yahoo Respostas e similares não são fontes acadêmicas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
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
    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
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
  cardIcon: {
    width: 64,
    height: 64,
    margin: "0 auto 16px",
    borderRadius: 20,
    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 8px"
  },
  cardDescription: {
    fontSize: 15,
    color: "#64748b",
    margin: 0
  },
  modeSelector: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginBottom: 24
  },
  modeButton: {
    padding: "12px 20px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  modeButtonActive: {
    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
    color: "white",
    borderColor: "#14b8a6"
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
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    minHeight: 150,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit"
  },
  urlCount: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 8
  },
  analyzeButton: {
    width: "100%",
    padding: "16px 24px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(20,184,166,0.3)"
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  summaryCard: {
    background: "white",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    marginBottom: 24
  },
  summaryGrid: {
    display: "flex",
    justifyContent: "center",
    gap: 40
  },
  summaryItem: {
    textAlign: "center"
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    margin: "0 auto 8px"
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
    margin: 0
  },
  resultsSection: {
    marginBottom: 24
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "white",
    marginBottom: 16
  },
  resultCard: {
    background: "white",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
  },
  resultBar: {
    height: 4
  },
  resultContent: {
    padding: 20
  },
  resultHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  badge: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid"
  },
  typeBadge: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#475569"
  },
  resultUrl: {
    display: "block",
    fontSize: 14,
    color: "#0d9488",
    textDecoration: "none",
    marginBottom: 8,
    wordBreak: "break-all"
  },
  domainText: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12
  },
  motivosSection: {
    marginBottom: 12
  },
  motivoItem: {
    fontSize: 14,
    color: "#374151",
    margin: "4px 0",
    display: "flex",
    alignItems: "flex-start",
    gap: 8
  },
  bullet: {
    color: "#94a3b8"
  },
  sugestoesSection: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginTop: 12
  },
  sugestoesTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8
  },
  sugestaoItem: {
    fontSize: 14,
    color: "#475569",
    margin: "4px 0",
    display: "flex",
    alignItems: "flex-start",
    gap: 8
  },
  arrow: {
    color: "#14b8a6"
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
    color: "#0f172a",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12
  },
  tipIcon: {
    fontSize: 18,
    flexShrink: 0
  },
  tipText: {
    fontSize: 14,
    color: "#374151",
    margin: 0,
    lineHeight: 1.5
  }
};
