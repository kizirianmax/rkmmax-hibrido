// src/pages/SpecialistChat.jsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { specialists } from "../config/specialists.js";
import { supabase } from "../lib/supabaseClient.js";
import "../pages/Serginho.css";
import "../pages/SpecialistChat.css";

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

export default function SpecialistChat() {
  const { specialistId } = useParams();
  const navigate = useNavigate();
  const specialist = specialists[specialistId];

  // Se especialista não existe, redirecionar
  useEffect(() => {
    if (!specialist) {
      navigate("/specialists");
    }
  }, [specialist, navigate]);

  // Trava o scroll da página enquanto a tela está aberta
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

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `${specialist?.name} pronto. Especialidade: ${specialist?.description}. Descreva sua dúvida ou necessidade dentro deste domínio.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para remover bloco <thinking> das respostas
  const removeThinking = (text) => {
    if (!text) return text;
    return text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Adicionar mensagem do usuário
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Chamar API do especialista via endpoint unificado
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages,
          type: "specialist",
          specialistId: specialistId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao chamar API");
      }

      const data = await response.json();
      const cleanResponse = removeThinking(data.response);

      // Adicionar resposta da IA
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanResponse,
        },
      ]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente. 😔",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!specialist) {
    return null; // Aguardando redirecionamento
  }

  return (
    <div className="specialist-chat-container" role="main" aria-label={`Chat com ${specialist.name}`}>
      {/* Header com info do especialista */}
      <div className="specialist-header">
        <button onClick={() => navigate("/specialists")} className="back-button">
          ← Voltar
        </button>
        <div className="specialist-info">
          <img
            src={`${specialist.avatar || `/avatars/${specialist.id}.png`}?v=2`}
            alt={specialist.name}
            className="specialist-avatar-header"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "inline-block";
            }}
          />
          <span className="specialist-emoji-header" style={{ display: "none", fontSize: "2rem" }}>
            {specialist.emoji}
          </span>
          <div>
            <h1>{specialist.name}</h1>
            <p>{specialist.description}</p>
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

      {/* Área de mensagens */}
      <div className="specialist-messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.role === "assistant" && (
                <span className="assistant-emoji">{specialist.emoji}</span>
              )}
              <div className="message-text">
                {msg.role === "assistant" ? (
                  <SimpleMarkdown text={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <span className="assistant-emoji">{specialist.emoji}</span>
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

      {/* Área de input */}
      <div className="specialist-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Descreva sua dúvida para ${specialist.name}...`}
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="send-button"
          title="Enviar mensagem"
        >
          {isLoading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}
