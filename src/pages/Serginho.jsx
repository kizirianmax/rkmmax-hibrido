import React, { useState, useRef, useEffect } from "react";
import "./Serginho.css";
import { MANUAL_MODEL_OPTIONS } from "../config/modelPriority.js";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Renders AI response text with basic markdown formatting.
 * Supports: paragraphs (\n\n), line breaks (\n), **bold**, `code`.
 */
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const processInline = (str, keyPrefix) => {
    const regex = /(\*\*[\s\S]+?\*\*|`[^`]+`)/g;
    const parts = str.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${keyPrefix}-b${i}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={`${keyPrefix}-c${i}`}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const paragraphs = text.split(/\n\n+/);
  return (
    <>
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        const content = lines.flatMap((line, li) => {
          const inlined = processInline(line, `p${pi}l${li}`);
          return li < lines.length - 1 ? [...inlined, <br key={`br-${pi}-${li}`} />] : inlined;
        });
        return <p key={pi}>{content}</p>;
      })}
    </>
  );
}

export default function Serginho() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Olá! Sou o KIZI 2.5 Pro operando como Serginho. Posso ajudar com qualquer tarefa - desde programação até pesquisas complexas. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputFocus = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "nearest" });
    });
  };

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Adicionar mensagem do usuário
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Chamar API com Gemini Pro 2.5 (nível ChatGPT-5)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          type: "genius", // Endpoint unificado
          messages: newMessages,
          agentType: "serginho", // Prompts de gênio do Serginho
          mode: "OTIMIZADO", // Otimização de custo ativada
          ...(selectedModel !== 'auto' ? { forceProvider: selectedModel } : {}),
        }),
      });

      if (!response.ok) {
        // Tentar ler o body do erro para mensagem mais precisa
        let errDetail = `${response.status}`;
        try {
          const errBody = await response.json();
          errDetail = errBody?.error?.message || errBody?.message || errDetail;
        } catch (_) { /* ignora parse error */ }
        throw new Error(`Erro na API: ${errDetail}`);
      }

      const data = await response.json();
      const aiResponse = data.response;

      if (!aiResponse || aiResponse.trim() === "") {
        throw new Error("Resposta vazia da IA");
      }

      // Extrair informação do motor ativo para visibilidade no Generalista
      const modelInfo = data.model || {};
      const motorLabel = modelInfo.icon && modelInfo.displayName
        ? `${modelInfo.icon} ${modelInfo.displayName}`
        : modelInfo.displayName || modelInfo.modelId || null;

      // Adicionar resposta da IA
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse,
          motorLabel: motorLabel,
        },
      ]);
    } catch (error) {
      const rawMsg = error?.message || "erro desconhecido";
      // Mensagem amigável quando Gemini não está configurado no ambiente
      const isGeminiEnvError = rawMsg.includes('GEMINI_API_KEY') || rawMsg.includes('not available');
      const errorMsg = isGeminiEnvError
        ? '⚠️ Gemini 2.5 Pro não está disponível: GEMINI_API_KEY não configurada no servidor. Configure a variável no Vercel e faça um novo deploy.'
        : `❌ Erro ao processar: ${rawMsg}. Tente novamente.`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Parar gravação
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      // Verificar se o navegador suporta gravação de áudio
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Seu navegador não suporta gravação de áudio. Tente usar Chrome ou Edge.");
        return;
      }

      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        // Parar todas as tracks do stream
        stream.getTracks().forEach((track) => track.stop());

        // Enviar áudio para API Whisper
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.wav");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Erro na transcrição");
          }

          const { text } = await response.json();

          // Colocar texto transcrito no input
          setInput(text);

          // Mostrar mensagem de sucesso
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `🎤 Áudio transcrito: "${text}"`,
            },
          ]);
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "❌ Erro ao transcrever áudio. Verifique se a API Whisper está configurada.",
            },
          ]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleImageAttach = () => {
    imageInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📎 Arquivo "${file.name}" recebido! O upload de arquivos ainda não está implementado, mas a interface está pronta. Em breve você poderá enviar documentos! 😊`,
        },
      ]);
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target.result;

        // Mostrar imagem enviada
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: `🖼️ Imagem: ${file.name}`,
            image: imageBase64,
          },
        ]);

        // Analisar imagem com GPT-4 Vision
        setIsLoading(true);
        try {
          const response = await fetch("/api/vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 }),
          });

          if (!response.ok) {
            throw new Error("Erro na análise de imagem");
          }

          const { description } = await response.json();

          // Formatar resposta com padrão
          const formatted = `👀 **Análise da imagem:**\n\n${description}`;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: formatted,
            },
          ]);
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "❌ Erro ao analisar imagem. Verifique se a API GPT-4 Vision está configurada.",
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraSelect = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target.result;

        // Mostrar foto capturada
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: `📸 Foto capturada`,
            image: imageBase64,
          },
        ]);

        // Analisar foto com GPT-4 Vision
        setIsLoading(true);
        try {
          const response = await fetch("/api/vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 }),
          });

          if (!response.ok) {
            throw new Error("Erro na análise de foto");
          }

          const { description } = await response.json();

          // Formatar resposta com padrão
          const formatted = `👀 **Análise da foto:**\n\n${description}`;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: formatted,
            },
          ]);
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "❌ Erro ao analisar foto. Verifique se a API GPT-4 Vision está configurada.",
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="serginho-container">
      {/* Header fixo */}
      <div className="serginho-header">
        <div className="header-content">
          <img
            src="/avatars/serginho.png"
            alt="Serginho"
            className="avatar-large"
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <div className="header-info">
            <h1>Serginho</h1>
            <p>Orquestrador de IA • Online</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.65rem",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
              >
                🧠 KIZI 2.5 Pro
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
              >
                🚀 KIZI Speed
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
              >
                ⚡ KIZI Flash
              </span>

            </div>
          </div>
        </div>
      </div>

      {/* Card de boas-vindas - Compacto e fixo */}
      <div className="welcome-container-compact">
        <div className="welcome-card-compact">
          <img src="/avatars/serginho.png" alt="Serginho" className="avatar-compact" />
          <div className="welcome-info-compact">
            <h3>Serginho — Orquestrador</h3>
            <p>Orquestro todos os especialistas para resolver qualquer tarefa 💡</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role === "user" ? "message-user" : "message-assistant"}`}
          >
            {msg.role === "assistant" && (
              <img
                src="/avatars/serginho.png"
                alt="Serginho"
                className="message-avatar"
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <div className="message-bubble">
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Imagem enviada"
                  className="message-image"
                  style={{
                    maxWidth: "100%",
                    borderRadius: "12px",
                    marginBottom: msg.content ? "8px" : "0",
                  }}
                />
              )}
              {msg.role === "assistant" ? (
                <SimpleMarkdown text={msg.content} />
              ) : (
                msg.content
              )}
              {msg.role === "assistant" && msg.motorLabel && (
                <div
                  style={{
                    marginTop: "6px",
                    paddingTop: "4px",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "0.65rem",
                    opacity: 0.7,
                    color: "#a5d8ff",
                  }}
                >
                  {msg.motorLabel}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-assistant">
            <img
              src="/avatars/serginho.png"
              alt="Serginho"
              className="message-avatar"
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
            <div className="message-bubble message-loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input fixo na parte inferior */}
      <div className="input-container">
        <div className="serginho-model-selector">
          <label htmlFor="serginho-model-select">🤖 Motor IA:</label>
          <select
            id="serginho-model-select"
            className={`serginho-model-select ${selectedModel !== "auto" ? "is-manual" : ""}`}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            title="Selecionar modelo de IA"
          >
            {MANUAL_MODEL_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="input-wrapper">
          {/* Botões de ação */}
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={handleCameraCapture}
              disabled={true}
              title="Recurso em desenvolvimento"
            >
              📸
            </button>
            <button
              className="action-btn"
              onClick={handleImageAttach}
              disabled={true}
              title="Recurso em desenvolvimento"
            >
              🗸️
            </button>
            <button className="action-btn" onClick={handleFileAttach} title="Anexar arquivo">
              📎
            </button>
          </div>

          {/* Input de texto */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            onFocus={handleInputFocus}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="message-input"
          />

          {/* Botão de voz - DESATIVADO */}
          <button
            className={`voice-btn ${isRecording ? "recording" : ""}`}
            onClick={handleVoiceInput}
            disabled={true}
            title="Recurso em desenvolvimento"
          >
            🎙
          </button>

          {/* Botão de enviar */}
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="send-btn">
            ↑
          </button>
        </div>
      </div>

      {/* Inputs escondidos para upload */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.xlsx,.csv"
      />
      <input
        ref={imageInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleImageSelect}
        accept="image/*"
      />
      <input
        ref={cameraInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleCameraSelect}
        accept="image/*"
        capture="environment"
      />
    </div>
  );
}
