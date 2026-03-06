// src/pages/Flashcards.jsx
import React, { useState } from "react";
import { studyLabAI } from "../lib/StudyLabAI.js";

export default function Flashcards() {
  const [texto, setTexto] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [dificuldade, setDificuldade] = useState("medio");
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [modo, setModo] = useState("criar"); // criar, estudar, revisar
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [cardsRevisados, setCardsRevisados] = useState([]);

  const contarPalavras = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const extrairConceitos = (texto) => {
    // Extrair frases que parecem definições ou conceitos importantes
    const frases = texto.split(/[.!?]+/).filter(f => f.trim().length > 20);
    const conceitos = [];
    
    frases.forEach(frase => {
      const trimmed = frase.trim();
      
      // Detectar padrões de definição
      if (trimmed.includes(" é ") || trimmed.includes(" são ") || 
          trimmed.includes(" significa ") || trimmed.includes(" consiste ") ||
          trimmed.includes(" define-se ") || trimmed.includes(" caracteriza ")) {
        
        const partes = trimmed.split(/\s+(é|são|significa|consiste|define-se|caracteriza)\s+/i);
        if (partes.length >= 2) {
          conceitos.push({
            pergunta: `O que é ${partes[0].trim()}?`,
            resposta: partes.slice(1).join(" ").trim()
          });
        }
      }
      
      // Detectar listas ou enumerações
      if (trimmed.includes(":")) {
        const [titulo, conteudo] = trimmed.split(":");
        if (titulo && conteudo && titulo.length < 100) {
          conceitos.push({
            pergunta: `Explique: ${titulo.trim()}`,
            resposta: conteudo.trim()
          });
        }
      }
    });
    
    // Se não encontrou conceitos estruturados, criar perguntas genéricas
    if (conceitos.length < 3) {
      const palavrasChave = extrairPalavrasChave(texto);
      palavrasChave.forEach(palavra => {
        const fraseRelacionada = frases.find(f => 
          f.toLowerCase().includes(palavra.toLowerCase())
        );
        if (fraseRelacionada) {
          conceitos.push({
            pergunta: `O que você sabe sobre ${palavra}?`,
            resposta: fraseRelacionada.trim()
          });
        }
      });
    }
    
    return conceitos;
  };

  const extrairPalavrasChave = (text) => {
    const stopWords = ["o", "a", "os", "as", "um", "uma", "de", "da", "do", "das", "dos", 
      "em", "na", "no", "por", "para", "com", "sem", "que", "se", "não", "mais", "mas"];
    
    const words = text.toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !stopWords.includes(word));
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  };

  const gerarFlashcards = async () => {
    if (contarPalavras(texto) < 30) return;
    
    setIsGenerating(true);
    
    try {
      // Usar IA real do Gemini
      const cardsIA = await studyLabAI.gerarFlashcards(texto, numCards);
      const cards = cardsIA.map((c, i) => ({
        id: i + 1,
        frente: c.pergunta,
        verso: c.resposta,
        dificuldade: c.dificuldade || dificuldade,
        acertou: null
      }));
      
      setFlashcards(cards);
    } catch (error) {
      console.error('Erro ao gerar flashcards com IA:', error);
      // Fallback para geração local
      const conceitos = extrairConceitos(texto);
      const cards = conceitos.slice(0, numCards).map((c, i) => ({
        id: i + 1,
        frente: c.pergunta,
        verso: c.resposta,
        dificuldade: dificuldade,
        acertou: null
      }));
      
      while (cards.length < Math.min(numCards, 5)) {
        const palavras = extrairPalavrasChave(texto);
        const palavra = palavras[cards.length] || "conceito";
        cards.push({
          id: cards.length + 1,
          frente: `Defina o conceito de ${palavra}`,
          verso: `${palavra} é um conceito importante relacionado ao tema estudado.`,
          dificuldade: dificuldade,
          acertou: null
        });
      }
      
      setFlashcards(cards);
    }
    
    setModo("estudar");
    setCurrentCard(0);
    setIsFlipped(false);
    setAcertos(0);
    setErros(0);
    setCardsRevisados([]);
    setIsGenerating(false);
  };

  const virarCard = () => {
    setIsFlipped(!isFlipped);
  };

  const marcarResposta = (acertou) => {
    const updatedCards = [...flashcards];
    updatedCards[currentCard].acertou = acertou;
    setFlashcards(updatedCards);
    
    if (acertou) {
      setAcertos(acertos + 1);
    } else {
      setErros(erros + 1);
      setCardsRevisados([...cardsRevisados, currentCard]);
    }
    
    // Próximo card
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    } else {
      setModo("resultado");
    }
  };

  const reiniciar = () => {
    setModo("criar");
    setFlashcards([]);
    setCurrentCard(0);
    setIsFlipped(false);
    setAcertos(0);
    setErros(0);
    setCardsRevisados([]);
  };

  const revisarErros = () => {
    if (cardsRevisados.length > 0) {
      const cardsParaRevisar = cardsRevisados.map(i => ({
        ...flashcards[i],
        acertou: null
      }));
      setFlashcards(cardsParaRevisar);
      setCurrentCard(0);
      setIsFlipped(false);
      setModo("estudar");
      setCardsRevisados([]);
    }
  };

  const renderCriar = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardIcon}>🎴</div>
        <h2 style={styles.cardTitle}>Criar Flashcards</h2>
        <p style={styles.cardDescription}>
          Cole seu material de estudo e gere flashcards automaticamente
        </p>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Material de Estudo</label>
        <textarea
          placeholder="Cole aqui o conteúdo que deseja transformar em flashcards. Pode ser um resumo, anotações de aula, capítulo de livro..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={styles.textarea}
        />
        <div style={styles.wordCount}>
          {contarPalavras(texto)} palavras
          {contarPalavras(texto) > 0 && contarPalavras(texto) < 30 && (
            <span style={styles.wordCountWarning}> (mínimo: 30)</span>
          )}
        </div>
      </div>

      <div style={styles.optionsRow}>
        <div style={styles.optionItem}>
          <label style={styles.label}>Quantidade</label>
          <select
            value={numCards}
            onChange={(e) => setNumCards(Number(e.target.value))}
            style={styles.select}
          >
            <option value={5}>5 cards</option>
            <option value={10}>10 cards</option>
            <option value={15}>15 cards</option>
            <option value={20}>20 cards</option>
          </select>
        </div>
        <div style={styles.optionItem}>
          <label style={styles.label}>Dificuldade</label>
          <select
            value={dificuldade}
            onChange={(e) => setDificuldade(e.target.value)}
            style={styles.select}
          >
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
      </div>

      <button
        style={{
          ...styles.button,
          ...(isGenerating || contarPalavras(texto) < 30 ? styles.buttonDisabled : {})
        }}
        onClick={gerarFlashcards}
        disabled={isGenerating || contarPalavras(texto) < 30}
      >
        {isGenerating ? "⏳ Gerando flashcards..." : "✨ Gerar Flashcards"}
      </button>
    </div>
  );

  const renderEstudar = () => (
    <div style={styles.estudarContainer}>
      {/* Progresso */}
      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${((currentCard + 1) / flashcards.length) * 100}%`
          }}
        />
      </div>
      <div style={styles.progressText}>
        Card {currentCard + 1} de {flashcards.length}
      </div>

      {/* Flashcard */}
      <div 
        style={{
          ...styles.flashcard,
          ...(isFlipped ? styles.flashcardFlipped : {})
        }}
        onClick={virarCard}
      >
        <div style={styles.flashcardInner}>
          <div style={styles.flashcardFront}>
            <span style={styles.flashcardLabel}>PERGUNTA</span>
            <p style={styles.flashcardText}>
              {flashcards[currentCard]?.frente}
            </p>
            <span style={styles.tapHint}>Toque para ver a resposta</span>
          </div>
          <div style={styles.flashcardBack}>
            <span style={styles.flashcardLabel}>RESPOSTA</span>
            <p style={styles.flashcardText}>
              {flashcards[currentCard]?.verso}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de resposta */}
      {isFlipped && (
        <div style={styles.respostaButtons}>
          <button 
            style={styles.erroButton}
            onClick={() => marcarResposta(false)}
          >
            ❌ Errei
          </button>
          <button 
            style={styles.acertoButton}
            onClick={() => marcarResposta(true)}
          >
            ✅ Acertei
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div style={styles.statsRow}>
        <span style={styles.statAcertos}>✅ {acertos}</span>
        <span style={styles.statErros}>❌ {erros}</span>
      </div>
    </div>
  );

  const renderResultado = () => (
    <div style={styles.resultadoCard}>
      <div style={styles.resultadoIcon}>
        {acertos >= erros ? "🎉" : "📚"}
      </div>
      <h2 style={styles.resultadoTitle}>
        {acertos >= erros ? "Parabéns!" : "Continue praticando!"}
      </h2>
      
      <div style={styles.resultadoStats}>
        <div style={styles.resultadoStat}>
          <span style={styles.resultadoNumber}>{acertos}</span>
          <span style={styles.resultadoLabel}>Acertos</span>
        </div>
        <div style={styles.resultadoStat}>
          <span style={{...styles.resultadoNumber, color: "#ef4444"}}>{erros}</span>
          <span style={styles.resultadoLabel}>Erros</span>
        </div>
        <div style={styles.resultadoStat}>
          <span style={{...styles.resultadoNumber, color: "#8b5cf6"}}>
            {Math.round((acertos / flashcards.length) * 100)}%
          </span>
          <span style={styles.resultadoLabel}>Aproveitamento</span>
        </div>
      </div>

      <div style={styles.resultadoButtons}>
        {cardsRevisados.length > 0 && (
          <button style={styles.revisarButton} onClick={revisarErros}>
            🔄 Revisar {cardsRevisados.length} erros
          </button>
        )}
        <button style={styles.novoButton} onClick={reiniciar}>
          ✨ Novos Flashcards
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/study" style={styles.backButton}>
          ← Voltar
        </a>
        <div style={styles.headerContent}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>🎴</span>
          </div>
          <div>
            <h1 style={styles.title}>Flashcards Inteligentes</h1>
            <p style={styles.subtitle}>Aprenda com repetição espaçada</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {modo === "criar" && renderCriar()}
        {modo === "estudar" && renderEstudar()}
        {modo === "resultado" && renderResultado()}

        {/* Dicas */}
        {modo === "criar" && (
          <div style={styles.tipsCard}>
            <h3 style={styles.tipsTitle}>💡 Como usar Flashcards</h3>
            <ul style={styles.tipsList}>
              <li>Estude em sessões curtas de 15-20 minutos</li>
              <li>Revise os cards que errou com mais frequência</li>
              <li>Tente responder antes de virar o card</li>
              <li>Use a técnica de repetição espaçada: revise após 1 dia, 3 dias, 7 dias</li>
              <li>Crie seus próprios cards para melhor memorização</li>
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
    background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)",
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
    background: "linear-gradient(135deg, #fdba74, #fb923c)",
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
    maxWidth: 600,
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
  optionsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 24
  },
  optionItem: {
    flex: 1
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
    fontSize: 15,
    outline: "none",
    background: "white",
    cursor: "pointer"
  },
  button: {
    width: "100%",
    padding: "16px 24px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(249,115,22,0.3)"
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  estudarContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  progressBar: {
    width: "100%",
    height: 8,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8
  },
  progressFill: {
    height: "100%",
    background: "white",
    borderRadius: 4,
    transition: "width 0.3s"
  },
  progressText: {
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 24
  },
  flashcard: {
    width: "100%",
    height: 300,
    perspective: "1000px",
    cursor: "pointer",
    marginBottom: 24
  },
  flashcardFlipped: {},
  flashcardInner: {
    position: "relative",
    width: "100%",
    height: "100%",
    transition: "transform 0.6s",
    transformStyle: "preserve-3d"
  },
  flashcardFront: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    background: "white",
    borderRadius: 20,
    padding: 24,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
  },
  flashcardBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    borderRadius: 20,
    padding: 24,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotateY(180deg)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
  },
  flashcardLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 16,
    opacity: 0.6
  },
  flashcardText: {
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    lineHeight: 1.5,
    margin: 0
  },
  tapHint: {
    position: "absolute",
    bottom: 20,
    fontSize: 12,
    color: "#94a3b8"
  },
  respostaButtons: {
    display: "flex",
    gap: 16,
    width: "100%",
    marginBottom: 24
  },
  erroButton: {
    flex: 1,
    padding: "16px",
    borderRadius: 14,
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer"
  },
  acertoButton: {
    flex: 1,
    padding: "16px",
    borderRadius: 14,
    border: "none",
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer"
  },
  statsRow: {
    display: "flex",
    gap: 24
  },
  statAcertos: {
    fontSize: 18,
    fontWeight: 700,
    color: "white"
  },
  statErros: {
    fontSize: 18,
    fontWeight: 700,
    color: "white"
  },
  resultadoCard: {
    background: "white",
    borderRadius: 20,
    padding: 32,
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
  },
  resultadoIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  resultadoTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: 24
  },
  resultadoStats: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    marginBottom: 32
  },
  resultadoStat: {
    textAlign: "center"
  },
  resultadoNumber: {
    display: "block",
    fontSize: 36,
    fontWeight: 800,
    color: "#16a34a"
  },
  resultadoLabel: {
    fontSize: 14,
    color: "#64748b"
  },
  resultadoButtons: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  revisarButton: {
    padding: "16px",
    borderRadius: 14,
    border: "2px solid #f97316",
    background: "white",
    color: "#f97316",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer"
  },
  novoButton: {
    padding: "16px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
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
