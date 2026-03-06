// src/pages/MapasMentais.jsx
import React, { useState, useRef } from "react";
import { studyLabAI } from "../lib/StudyLabAI.js";

const CORES_TEMA = [
  { id: "azul", cor: "#3b82f6", nome: "Azul" },
  { id: "verde", cor: "#10b981", nome: "Verde" },
  { id: "roxo", cor: "#8b5cf6", nome: "Roxo" },
  { id: "laranja", cor: "#f97316", nome: "Laranja" },
  { id: "rosa", cor: "#ec4899", nome: "Rosa" },
  { id: "ciano", cor: "#06b6d4", nome: "Ciano" }
];

export default function MapasMentais() {
  const [texto, setTexto] = useState("");
  const [temaCentral, setTemaCentral] = useState("");
  const [corTema, setCorTema] = useState(CORES_TEMA[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapa, setMapa] = useState(null);
  const [modo, setModo] = useState("criar"); // criar, visualizar
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);

  const contarPalavras = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const extrairConceitos = (texto) => {
    const stopWords = ["o", "a", "os", "as", "um", "uma", "de", "da", "do", "das", "dos", 
      "em", "na", "no", "por", "para", "com", "sem", "que", "se", "não", "mais", "mas",
      "como", "quando", "onde", "qual", "quais", "este", "esta", "esse", "essa"];
    
    // Extrair frases significativas
    const frases = texto.split(/[.!?]+/).filter(f => f.trim().length > 15);
    
    // Extrair palavras-chave
    const words = texto.toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    const topWords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    
    // Agrupar conceitos por temas
    const temas = [];
    const usedWords = new Set();
    
    // Criar 4-6 ramos principais
    for (let i = 0; i < Math.min(6, Math.ceil(topWords.length / 3)); i++) {
      const mainWord = topWords.find(w => !usedWords.has(w.toLowerCase()));
      if (!mainWord) break;
      
      usedWords.add(mainWord.toLowerCase());
      
      // Encontrar subtópicos relacionados
      const subtopicos = [];
      const frasesRelacionadas = frases.filter(f => 
        f.toLowerCase().includes(mainWord.toLowerCase())
      );
      
      // Extrair palavras das frases relacionadas
      frasesRelacionadas.slice(0, 2).forEach(frase => {
        const palavrasFrase = frase.split(/\s+/)
          .filter(w => w.length > 4 && !stopWords.includes(w.toLowerCase()) && 
                  !usedWords.has(w.toLowerCase()) && w.toLowerCase() !== mainWord.toLowerCase())
          .slice(0, 2);
        
        palavrasFrase.forEach(p => {
          const clean = p.replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '');
          if (clean.length > 3) {
            subtopicos.push(clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
            usedWords.add(clean.toLowerCase());
          }
        });
      });
      
      // Adicionar palavras próximas como subtópicos
      topWords.slice(i * 3, i * 3 + 3).forEach(w => {
        if (!usedWords.has(w.toLowerCase()) && subtopicos.length < 4) {
          subtopicos.push(w);
          usedWords.add(w.toLowerCase());
        }
      });
      
      temas.push({
        titulo: mainWord,
        subtopicos: subtopicos.slice(0, 4)
      });
    }
    
    return temas;
  };

  const gerarMapa = async () => {
    if (contarPalavras(texto) < 20 || !temaCentral.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Usar IA real do Gemini
      const mapaIA = await studyLabAI.gerarMapaMental(texto, temaCentral);
      setMapa({
        centro: mapaIA.centro || temaCentral,
        cor: corTema.cor,
        ramos: mapaIA.ramos || []
      });
    } catch (error) {
      console.error('Erro ao gerar mapa mental com IA:', error);
      // Fallback para geração local
      const conceitos = extrairConceitos(texto);
      setMapa({
        centro: temaCentral,
        cor: corTema.cor,
        ramos: conceitos
      });
    }
    
    setModo("visualizar");
    setIsGenerating(false);
  };

  const renderMapaVisual = () => {
    if (!mapa) return null;
    
    const centerX = 400;
    const centerY = 300;
    const ramoRadius = 180;
    const subRadius = 80;
    
    return (
      <svg 
        viewBox="0 0 800 600" 
        style={{ 
          width: "100%", 
          maxWidth: 800, 
          height: "auto",
          transform: `scale(${zoom})`,
          transformOrigin: "center"
        }}
      >
        {/* Linhas dos ramos */}
        {mapa.ramos.map((ramo, i) => {
          const angle = (i / mapa.ramos.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + Math.cos(angle) * ramoRadius;
          const y = centerY + Math.sin(angle) * ramoRadius;
          
          return (
            <g key={i}>
              {/* Linha do centro ao ramo */}
              <line
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={mapa.cor}
                strokeWidth="3"
                opacity="0.6"
              />
              
              {/* Linhas dos subtópicos */}
              {ramo.subtopicos.map((sub, j) => {
                const subAngle = angle + ((j - (ramo.subtopicos.length - 1) / 2) * 0.3);
                const subX = x + Math.cos(subAngle) * subRadius;
                const subY = y + Math.sin(subAngle) * subRadius;
                
                return (
                  <line
                    key={j}
                    x1={x}
                    y1={y}
                    x2={subX}
                    y2={subY}
                    stroke={mapa.cor}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                );
              })}
            </g>
          );
        })}
        
        {/* Nó central */}
        <g>
          <ellipse
            cx={centerX}
            cy={centerY}
            rx="90"
            ry="45"
            fill={mapa.cor}
            stroke="white"
            strokeWidth="3"
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
          >
            {mapa.centro.length > 20 ? mapa.centro.slice(0, 20) + "..." : mapa.centro}
          </text>
        </g>
        
        {/* Ramos principais */}
        {mapa.ramos.map((ramo, i) => {
          const angle = (i / mapa.ramos.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + Math.cos(angle) * ramoRadius;
          const y = centerY + Math.sin(angle) * ramoRadius;
          
          return (
            <g key={i}>
              {/* Nó do ramo */}
              <ellipse
                cx={x}
                cy={y}
                rx="70"
                ry="30"
                fill={mapa.cor}
                opacity="0.8"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="13"
                fontWeight="600"
              >
                {ramo.titulo.length > 12 ? ramo.titulo.slice(0, 12) + "..." : ramo.titulo}
              </text>
              
              {/* Subtópicos */}
              {ramo.subtopicos.map((sub, j) => {
                const subAngle = angle + ((j - (ramo.subtopicos.length - 1) / 2) * 0.3);
                const subX = x + Math.cos(subAngle) * subRadius;
                const subY = y + Math.sin(subAngle) * subRadius;
                
                return (
                  <g key={j}>
                    <ellipse
                      cx={subX}
                      cy={subY}
                      rx="50"
                      ry="22"
                      fill="white"
                      stroke={mapa.cor}
                      strokeWidth="2"
                    />
                    <text
                      x={subX}
                      y={subY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#374151"
                      fontSize="11"
                    >
                      {sub.length > 10 ? sub.slice(0, 10) + "..." : sub}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderCriar = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardIcon}>🗺️</div>
        <h2 style={styles.cardTitle}>Criar Mapa Mental</h2>
        <p style={styles.cardDescription}>
          Cole seu material e gere um mapa mental visual automaticamente
        </p>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Tema Central</label>
        <input
          type="text"
          placeholder="Ex: Revolução Industrial, Fotossíntese, Marketing Digital..."
          value={temaCentral}
          onChange={(e) => setTemaCentral(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Cor do Tema</label>
        <div style={styles.coresGrid}>
          {CORES_TEMA.map(cor => (
            <button
              key={cor.id}
              style={{
                ...styles.corButton,
                background: cor.cor,
                ...(corTema.id === cor.id ? styles.corButtonActive : {})
              }}
              onClick={() => setCorTema(cor)}
              title={cor.nome}
            />
          ))}
        </div>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Material de Estudo</label>
        <textarea
          placeholder="Cole aqui o conteúdo que deseja transformar em mapa mental. Pode ser um resumo, anotações, capítulo de livro..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={styles.textarea}
        />
        <div style={styles.wordCount}>
          {contarPalavras(texto)} palavras
          {contarPalavras(texto) > 0 && contarPalavras(texto) < 20 && (
            <span style={styles.wordCountWarning}> (mínimo: 20)</span>
          )}
        </div>
      </div>

      <button
        style={{
          ...styles.button,
          background: `linear-gradient(135deg, ${corTema.cor}, ${corTema.cor}dd)`,
          ...(isGenerating || contarPalavras(texto) < 20 || !temaCentral.trim() ? styles.buttonDisabled : {})
        }}
        onClick={gerarMapa}
        disabled={isGenerating || contarPalavras(texto) < 20 || !temaCentral.trim()}
      >
        {isGenerating ? "⏳ Gerando mapa..." : "🗺️ Gerar Mapa Mental"}
      </button>
    </div>
  );

  const renderVisualizar = () => (
    <div style={styles.visualizarContainer}>
      {/* Controles */}
      <div style={styles.controls}>
        <button 
          style={styles.controlButton}
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
        >
          ➖
        </button>
        <span style={styles.zoomText}>{Math.round(zoom * 100)}%</span>
        <button 
          style={styles.controlButton}
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
        >
          ➕
        </button>
      </div>

      {/* Mapa */}
      <div style={styles.mapaContainer} ref={canvasRef}>
        {renderMapaVisual()}
      </div>

      {/* Legenda */}
      <div style={styles.legenda}>
        <div style={styles.legendaItem}>
          <div style={{...styles.legendaCor, background: mapa?.cor}} />
          <span>Tema Central</span>
        </div>
        <div style={styles.legendaItem}>
          <div style={{...styles.legendaCor, background: mapa?.cor, opacity: 0.8}} />
          <span>Ramos Principais</span>
        </div>
        <div style={styles.legendaItem}>
          <div style={{...styles.legendaCor, background: "white", border: `2px solid ${mapa?.cor}`}} />
          <span>Subtópicos</span>
        </div>
      </div>

      {/* Lista de conceitos */}
      <div style={styles.conceitosCard}>
        <h3 style={styles.conceitosTitle}>📋 Estrutura do Mapa</h3>
        <div style={styles.conceitosList}>
          <div style={styles.conceitoCentro}>
            <strong>🎯 {mapa?.centro}</strong>
          </div>
          {mapa?.ramos.map((ramo, i) => (
            <div key={i} style={styles.conceitoRamo}>
              <div style={{...styles.ramoTitulo, color: mapa?.cor}}>
                ├── {ramo.titulo}
              </div>
              {ramo.subtopicos.map((sub, j) => (
                <div key={j} style={styles.subTopico}>
                  │   └── {sub}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div style={styles.actionsGrid}>
        <button 
          style={styles.actionButton}
          onClick={() => {
            setModo("criar");
            setMapa(null);
          }}
        >
          🔄 Novo Mapa
        </button>
        <button 
          style={{...styles.actionButtonPrimary, background: mapa?.cor}}
          onClick={() => alert("Exportação em breve!")}
        >
          📄 Exportar PNG
        </button>
      </div>
    </div>
  );

  return (
    <div style={{...styles.container, background: `linear-gradient(135deg, ${corTema.cor} 0%, ${corTema.cor}cc 50%, ${corTema.cor}99 100%)`}}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/study" style={styles.backButton}>
          ← Voltar
        </a>
        <div style={styles.headerContent}>
          <div style={{...styles.iconContainer, background: `linear-gradient(135deg, ${corTema.cor}99, ${corTema.cor})`}}>
            <span style={styles.icon}>🗺️</span>
          </div>
          <div>
            <h1 style={styles.title}>Mapas Mentais</h1>
            <p style={styles.subtitle}>Organize conceitos visualmente</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {modo === "criar" && renderCriar()}
        {modo === "visualizar" && renderVisualizar()}

        {/* Dicas */}
        {modo === "criar" && (
          <div style={styles.tipsCard}>
            <h3 style={styles.tipsTitle}>💡 Dicas para Mapas Mentais</h3>
            <ul style={styles.tipsList}>
              <li>Use um tema central claro e específico</li>
              <li>Quanto mais detalhado o texto, melhor o mapa</li>
              <li>Mapas mentais ajudam na memorização visual</li>
              <li>Revise e personalize o mapa gerado</li>
              <li>Use cores diferentes para temas diferentes</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
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
    maxWidth: 900,
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
    fontSize: 48,
    marginBottom: 12
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
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 15,
    outline: "none",
    minHeight: 150,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit"
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
  coresGrid: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },
  corButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "3px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  corButtonActive: {
    border: "3px solid white",
    boxShadow: "0 0 0 2px #374151"
  },
  button: {
    width: "100%",
    padding: "16px 24px",
    borderRadius: 14,
    border: "none",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  visualizarContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    background: "rgba(255,255,255,0.9)",
    padding: "12px 24px",
    borderRadius: 16
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "none",
    background: "#f1f5f9",
    fontSize: 18,
    cursor: "pointer"
  },
  zoomText: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151"
  },
  mapaContainer: {
    background: "white",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    overflow: "auto",
    display: "flex",
    justifyContent: "center"
  },
  legenda: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    padding: "12px 0"
  },
  legendaItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "white",
    fontSize: 13
  },
  legendaCor: {
    width: 20,
    height: 20,
    borderRadius: 6
  },
  conceitosCard: {
    background: "white",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
  },
  conceitosTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 16
  },
  conceitosList: {
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 1.8
  },
  conceitoCentro: {
    marginBottom: 12,
    fontSize: 16
  },
  conceitoRamo: {
    marginBottom: 8
  },
  ramoTitulo: {
    fontWeight: 600
  },
  subTopico: {
    color: "#64748b",
    marginLeft: 8
  },
  actionsGrid: {
    display: "flex",
    gap: 12
  },
  actionButton: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: 12,
    border: "2px solid white",
    background: "transparent",
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  actionButtonPrimary: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
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
