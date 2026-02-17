import { useState, useRef, useEffect } from "react";
import "../styles/HybridAgent.css";

/**
 * RKMMAX HYBRID - VERSÃO KIZI INTELIGENTE
 * Sistema 100% Groq com 3 modelos em cascata:
 * - KIZI Primary (openai/gpt-oss-120b) - Modelo principal
 * - KIZI Speed (llama-3.3-70b-versatile) - Fallback rápido
 * - KIZI Long (mixtral-8x7b-32768) - Contextos longos
 * Modos: Manual (1 crédito) | Otimizado (0.5 crédito)
 */
export default function HybridAgentSimple() {
  const [mode, setMode] = useState("manual");
  const [input, setInput] = useState("");
  // Versão do app para cache busting
  const APP_VERSION = "v3.1.0-kizi";

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      content: `🤖 Bem-vindo ao KIZI Primary - Sistema Inteligente (${APP_VERSION})`,
      timestamp: new Date(),
    },
    {
      id: 2,
      type: "agent",
      agent: "Serginho",
      content:
        "Olá! Sou o KIZI Primary operando como Serginho. Posso ajudar com qualquer tarefa - desde programação até pesquisas complexas. Descreva o que precisa!",
      provider: "kizi-primary",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [githubToken, setGithubToken] = useState(localStorage.getItem("github_token") || null);
  const [githubUser, setGithubUser] = useState(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Helper function to get tier color
  const getTierColor = (tier) => {
    const colors = {
      complex: '#ff6b6b',
      genius: '#ff6b6b',
      medium: '#ffd93d',
      expert: '#ffd93d',
      simple: '#6bcf7f',
      fast: '#6bcf7f',
      optimized: '#4ecdc4',
      fallback: '#95a5a6',
      standard: '#3498db',
      unknown: '#95a5a6',
    };
    return colors[tier] || colors.unknown;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("github_token");
    const userName = urlParams.get("user_name");

    if (token) {
      console.log("Token recebido:", token);
      localStorage.setItem("github_token", token);
      setGithubToken(token);
      setGithubUser(userName);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      console.log(`📤 Enviando para /api/chat (Serginho) - Modo: ${mode}`);

      // Chamar /api/ai com prompts de gênio + otimização
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages
              .filter((msg) => msg.type !== "system")
              .map((msg) => ({
                role: msg.type === "user" ? "user" : "assistant",
                content: msg.content,
              })),
            {
              role: "user",
              content: userInput,
            },
          ],
          type: "genius", // Endpoint unificado
          agentType: "hybrid", // Prompts de gênio do Híbrido
          mode: mode.toUpperCase(), // MANUAL ou OTIMIZADO
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || data.message || "Sem resposta";
      const provider = data.provider || "unknown";
      const tier = data.tier || "standard";
      const complexity = data.complexity || 0;

      console.log(`✅ Resposta recebida de ${provider} (tier: ${tier}, complexity: ${complexity})`);

      // Adicionar resposta do agente
      const agentMessage = {
        id: messages.length + 2,
        type: "agent",
        agent: "Serginho",
        content: aiResponse,
        provider: provider,
        tier: tier,
        complexity: complexity,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);

      // Adicionar mensagem de erro
      const errorMessage = {
        id: messages.length + 2,
        type: "error",
        content: `❌ Erro: ${error.message}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMicrophoneClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: "audio/mp3" });
          await handleAudioUpload(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Erro ao acessar microfone:", error);
        alert("Permissão de microfone negada");
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob) => {
    try {
      console.log("🎤 Enviando áudio para transcrição...", audioBlob);

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.mp3");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      console.log("📥 Resposta recebida:", response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro na transcrição");
      }

      const data = await response.json();
      console.log("✅ Transcrição concluída:", data);

      const transcript = data.transcript || data.text || "";
      if (transcript) {
        setInput(transcript);
        console.log("📝 Texto inserido:", transcript);
      } else {
        console.warn("⚠️ Nenhum texto foi transcrito");
      }
    } catch (error) {
      console.error("❌ Erro ao transcrever áudio:", error);
      alert(`Erro ao transcrever: ${error.message}`);
    }
  };

  const handleImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handleImageUpload(e.target.files[0]);
    input.click();
  };

  const handleImageUpload = async (imageFile) => {
    if (!imageFile) return;

    try {
      console.log("📸 Enviando imagem para análise...", imageFile);

      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro na análise de imagem");
      }

      const data = await response.json();
      console.log("✅ Análise concluída:", data);

      const description = data.description || data.text || "Imagem processada";
      setInput(`[Imagem analisada] ${description}`);
    } catch (error) {
      console.error("❌ Erro ao processar imagem:", error);
      alert(`Erro ao processar imagem: ${error.message}`);
    }
  };

  const handleGitHubOAuth = async () => {
    try {
      console.log("Iniciando autenticacao GitHub...");

      const response = await fetch("/api/github-oauth/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao iniciar autenticacao");
      }

      const data = await response.json();
      console.log("URL de autorizacao gerada:", data.authUrl);

      window.open(data.authUrl, "github-auth", "width=600,height=700");
    } catch (error) {
      console.error("Erro ao iniciar OAuth:", error);
      alert("Erro: " + error.message);
    }
  };

  const handleGitHubClick = () => {
    if (githubToken) {
      window.open("https://github.com/kizirianmax/Rkmmax-app", "_blank");
    } else {
      handleGitHubOAuth();
    }
  };

  return (
    <div className="hybrid-container">
      {/* Header */}
      <div className="hybrid-header">
        <div className="header-left">
          <h1>🤖 RKMMAX Híbrido</h1>
          <p>Sistema Inteligente de Agentes</p>
        </div>

        {/* Controles */}
        <div className="header-controls">
          <div className="mode-selector">
            <label>Modo:</label>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${mode === "manual" ? "active" : ""}`}
                onClick={() => setMode("manual")}
              >
                📋 Manual (1 crédito)
              </button>
              <button
                className={`mode-btn ${mode === "optimized" ? "active" : ""}`}
                onClick={() => setMode("optimized")}
              >
                ⚡ Otimizado (0.5 crédito)
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="info-section">
            <div className="info-box">
              <h3>SISTEMA</h3>
              <p>
                🚀 <strong>Versão 3.0.2</strong>
              </p>
              <p>Serginho - Orquestrador de IA</p>
              <p>
                🧠 <strong>KIZI 2.5 Pro</strong> | 🚀 <strong>Speed</strong> | ⚡{" "}
                <strong>Flash</strong>
              </p>
              <p>💰 Otimização de Custo Ativa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-container">
        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.type}`}>
              {msg.type === "agent" && (
                <div className="message-header">
                  <span className="agent-name">🤖 {msg.agent}</span>
                  {msg.provider && (
                    <span 
                      className="provider-badge"
                      style={{
                        background: getTierColor(msg.tier || 'unknown'),
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#fff',
                        fontWeight: 'bold',
                        marginLeft: '8px',
                      }}
                    >
                      {msg.provider}{msg.tier ? ` (${msg.tier})` : ''}
                    </span>
                  )}
                  <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
              )}
              {msg.type === "user" && (
                <div className="message-header">
                  <span className="user-name">👤 Você</span>
                  <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
              )}
              <div className="message-content">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="message message-loading">
              <div className="loading-spinner">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Serginho está pensando...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-toolbar">
          <button
            onClick={handleGitHubClick}
            className={`toolbar-btn github-btn ${githubToken ? "authorized" : "unauthorized"}`}
            title={githubToken ? "Abrir repositório GitHub" : "Autorizar GitHub"}
          >
            {githubToken ? "🐙✅" : "🐙"}
          </button>
          <button
            onClick={handleMicrophoneClick}
            className={`toolbar-btn mic-btn ${isRecording ? "recording" : ""}`}
            title={isRecording ? "Parar gravação" : "Gravar áudio"}
          >
            {isRecording ? "🔴" : "🎤"}
          </button>
          <button
            onClick={handleImageClick}
            className="toolbar-btn image-btn"
            title="Enviar imagem"
          >
            📸
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Descreva a tarefa que deseja executar..."
          disabled={loading}
          rows="3"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className="send-button"
        >
          {loading ? "⏳ Enviando..." : "📤 Enviar"}
        </button>
      </div>
    </div>
  );
}
