import { useState, useRef, useEffect } from "react";
import "../styles/HybridAgent.css";
import ArtifactPreviewPanel from "../components/construtor/ArtifactPreviewPanel";
import { normalizeVisibleContent } from "../lib/construtor/artifactNormalizer";
import {
  loadInputDraft,
  saveInputDraft,
  clearInputDraft,
} from "../lib/construtor/inputDraftStorage";
import {
  loadReviewCycleState,
  saveReviewCycleState,
  clearReviewCycleState,
} from "../lib/construtor/reviewCycleStorage";
import { HYBRID_ENGINE_OPTIONS, DEFAULT_HYBRID_ENGINE } from "../config/hybridEngines";
import { supabase } from "../lib/supabaseClient";

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

/** Detecta se o conteúdo é formato multi-file (contém pelo menos um --- FILE: --- ). */
const MULTI_FILE_DELIMITER_PATTERN = /^---\s*FILE:\s*.+?---/m;
function isMultiFileContent(text) {
  return typeof text === "string" && MULTI_FILE_DELIMITER_PATTERN.test(text);
}

/**
 * Renderiza conteúdo multi-file como cards visuais separados.
 * Cada bloco --- FILE: nome.ext --- vira um card com header destacado e corpo <pre>.
 * Fallback para <pre> monolítico se o parse falhar.
 */
function MultiFileRenderer({ content }) {
  const FILE_DELIMITER = /^---\s*FILE:\s*(.+?)\s*---\s*$/gm;
  const matches = [...content.matchAll(FILE_DELIMITER)];

  if (matches.length === 0) {
    return <pre className="artifact-code-block">{content}</pre>;
  }

  const files = matches.map((match, i) => {
    const name = match[1].trim();
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    const body = content.slice(start, end).trim();
    return { name, body };
  });

  return (
    <>
      {files.map((file, i) => (
        <div key={`${i}-${file.name}`} className="artifact-file-card">
          <div className="artifact-file-card-header">📄 {file.name}</div>
          <pre className="artifact-file-card-body">{file.body}</pre>
        </div>
      ))}
    </>
  );
}

// PASSO 11 — helpers de persistência do preview atual do artefato em sessionStorage
const ARTIFACT_PREVIEW_STORAGE_KEY = 'construtor_artifact_preview';

const loadArtifactPreview = () => {
  try {
    const raw = sessionStorage.getItem(ARTIFACT_PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* ignorar dados corrompidos */ }
  return null;
};

const saveArtifactPreview = (activeMsgId, preview, delivery, agentMessage) => {
  try {
    sessionStorage.setItem(ARTIFACT_PREVIEW_STORAGE_KEY, JSON.stringify({
      activeMsgId: activeMsgId != null ? Number(activeMsgId) : null,
      preview,
      delivery: delivery || null,
      agentMessage: agentMessage ? {
        id: agentMessage.id,
        type: agentMessage.type,
        agent: agentMessage.agent,
        content: agentMessage.content,
        provider: agentMessage.provider,
        tier: agentMessage.tier,
        isFallback: agentMessage.isFallback,
        complexity: agentMessage.complexity,
        timestamp: agentMessage.timestamp ? (agentMessage.timestamp instanceof Date ? agentMessage.timestamp.toISOString() : agentMessage.timestamp) : new Date().toISOString(),
      } : null,
    }));
  } catch { /* sessionStorage indisponível ou cheio — falhar silenciosamente */ }
};

const clearArtifactPreview = () => {
  try {
    sessionStorage.removeItem(ARTIFACT_PREVIEW_STORAGE_KEY);
  } catch { /* ignorar */ }
};

const getLatestPreviewMessageId = (previewMap) => {
  const msgIds = Object.keys(previewMap || {});
  if (msgIds.length === 0) return null;
  const lastMsgId = msgIds[msgIds.length - 1];
  const numericMsgId = Number(lastMsgId);
  return Number.isInteger(numericMsgId) && numericMsgId > 0 ? numericMsgId : null;
};

const buildInitialReviewHistory = (savedCycle) => {
  if (!savedCycle) return [];
  const events = [];
  if (savedCycle.lastAdjustment) {
    const textParts = [
      savedCycle.lastAdjustment.category,
      savedCycle.lastAdjustment.focusFile,
      savedCycle.lastAdjustment.comment,
    ].filter(Boolean);
    events.push({
      type: 'adjustment_requested',
      text: textParts.join(' · ') || null,
      timestamp: new Date(savedCycle.updatedAt || Date.now()).toISOString(),
    });
  }
  if (savedCycle.decision === 'approved' || savedCycle.decision === 'rejected') {
    events.push({
      type: savedCycle.decision,
      text: null,
      timestamp: new Date(savedCycle.updatedAt || Date.now()).toISOString(),
    });
  }
  return events;
};

// PASSO 12 — helpers de persistência importados de src/lib/construtor/inputDraftStorage.js

/**
 * RKMMAX HYBRID - CONSTRUTOR (KIZI)
 * Agente Construtor: geração e entrega de artefatos via orquestrador KIZI.
 * Roteamento adaptativo multi-provedor (KIZI 2.5 Pro, Speed, Flash).
 * Sem seleção direta de especialista — orquestração é responsabilidade do Serginho.
 */
export default function HybridAgentSimple() {
  const [selectedEngine, setSelectedEngine] = useState(DEFAULT_HYBRID_ENGINE);
  // PASSO 12 — restaurar rascunho salvo ao montar o componente
  const [input, setInput] = useState(() => loadInputDraft());
  // Versão do app para cache busting
  const APP_VERSION = "v3.1.0";

  // PASSO 11 — carregar uma única vez para todos os lazy initializers
  const savedArtifactPreview = loadArtifactPreview();
  const _parsedMsgId = savedArtifactPreview?.activeMsgId != null
    ? Number(savedArtifactPreview.activeMsgId)
    : null;
  const restoredMsgId = (_parsedMsgId != null && !isNaN(_parsedMsgId) && _parsedMsgId > 0)
    ? _parsedMsgId
    : null;

  const [messages, setMessages] = useState(() => {
    const initialMessages = [
      {
        id: 1,
        type: "system",
        content: `⚙️ Construtor inicializado (${APP_VERSION})`,
        timestamp: new Date(),
      },
      {
        id: 2,
        type: "agent",
        agent: "Construtor",
        content:
          "Construtor pronto. Descreva o artefato ou tarefa que deseja gerar.",
        provider: "kizi-primary",
        timestamp: new Date(),
      },
    ];
    // PASSO 11 — restaurar mensagem do agente que gerou o artefato persistido
    if (savedArtifactPreview?.agentMessage && restoredMsgId && restoredMsgId > 2) {
      const restored = {
        ...savedArtifactPreview.agentMessage,
        id: restoredMsgId,
        timestamp: (() => {
          const d = new Date(savedArtifactPreview.agentMessage.timestamp || Date.now());
          return isNaN(d.getTime()) ? new Date() : d;
        })(),
      };
      initialMessages.push(restored);
    }
    return initialMessages;
  });
  const [loading, setLoading] = useState(false);
  const [githubToken, setGithubToken] = useState(localStorage.getItem("github_token") || null);
  // Fase 2D — estado de preview por mensagem
  const [previews, setPreviews] = useState(() => {
    if (restoredMsgId && savedArtifactPreview?.preview) {
      return { [restoredMsgId]: savedArtifactPreview.preview };
    }
    return {};
  });
  const [previewLoading, setPreviewLoading] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});
  const [deliveryData, setDeliveryData] = useState(() => {
    if (restoredMsgId && savedArtifactPreview?.delivery) {
      return { [restoredMsgId]: savedArtifactPreview.delivery };
    }
    return {};
  });
  // Carregar ciclo salvo (F3-03) apenas quando há artefato atual compatível
  const savedCycle = restoredMsgId
    ? loadReviewCycleState({ currentMessageKey: restoredMsgId })
    : null;

  // PASSO 5 — último ajuste solicitado (para continuidade visual)
  const [lastAdjustment, setLastAdjustment] = useState(savedCycle?.lastAdjustment ?? null);
  // PASSO 6 — histórico local de revisão global (array linear, independente de msgId)
  const [reviewHistory, setReviewHistory] = useState(() => buildInitialReviewHistory(savedCycle));
  // PASSO 8 — versão do artefato no ciclo de revisão
  const [artifactVersion, setArtifactVersion] = useState(savedCycle?.lastAdjustment ? 2 : 1);
  // PASSO 6 — sinaliza que o próximo preview é continuação de uma revisão (preservar histórico)
  const revisionPendingRef = useRef(false);
  const messagesEndRef = useRef(null);

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

  const handleInputFocus = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "nearest" });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lock body scroll while this page is mounted so Android Chrome cannot
  // auto-scroll the document when the virtual keyboard opens/closes.
  // This eliminates the "step jump" on /hibrido on focus/blur of the textarea.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("github_token");

    if (token) {
      localStorage.setItem("github_token", token);
      setGithubToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // F3-03 — persistir ciclo mínimo de revisão em sessionStorage
  useEffect(() => {
    const activeMsgId = getLatestPreviewMessageId(previews);
    const activeDecision = activeMsgId != null ? previews[activeMsgId]?.decision : null;

    if (!activeMsgId || activeDecision === 'approved' || activeDecision === 'rejected') {
      clearReviewCycleState();
      return;
    }

    saveReviewCycleState({
      messageKey: activeMsgId,
      lastAdjustment,
      decision: activeDecision || 'pending',
      updatedAt: Date.now(),
    });
  }, [previews, lastAdjustment]);

  // PASSO 11 — persistir preview atual no sessionStorage
  useEffect(() => {
    const msgIds = Object.keys(previews);
    if (msgIds.length === 0) {
      clearArtifactPreview();
      return;
    }
    // Persistir apenas o último preview ativo (artefato mais recente)
    const lastMsgId = msgIds[msgIds.length - 1];
    const numericMsgId = Number(lastMsgId);
    const activePreview = previews[lastMsgId];
    const activeDelivery = deliveryData[lastMsgId] || deliveryData[numericMsgId] || null;
    // Encontrar a mensagem do agente correspondente para persistir junto
    const agentMsg = messages.find((m) => m.id === numericMsgId);
    if (activePreview) {
      saveArtifactPreview(numericMsgId, activePreview, activeDelivery, agentMsg || null);
    }
  }, [previews, deliveryData, messages]);

  // PASSO 12 — persistir rascunho do campo de entrada em sessionStorage
  useEffect(() => {
    saveInputDraft(input);
  }, [input]);

  // Fase 2D — gerar preview de um artefato (mensagem do agente)
  const handleGeneratePreview = async (msg) => {
    const msgId = msg.id;
    // PASSO 6 — resetar histórico ao abrir preview de artefato novo (não revisão)
    if (!revisionPendingRef.current) {
      setReviewHistory([]);
      setArtifactVersion(1);     // PASSO 8 — artefato novo → versão 1
      setLastAdjustment(null);   // garantir reset completo
      clearReviewCycleState();   // F3-03 — limpar estado mínimo salvo ao iniciar artefato novo
      clearArtifactPreview();    // PASSO 11 — limpar preview anterior ao gerar novo artefato
    } else {
      setArtifactVersion((v) => v + 1);  // PASSO 8 — revisão → incrementa versão
    }
    revisionPendingRef.current = false;
    setPreviewLoading((prev) => ({ ...prev, [msgId]: true }));
    setPreviewErrors((prev) => { const updated = { ...prev }; delete updated[msgId]; return updated; });
    try {
      // Fase 2 — Contenção P0: endpoints de artefato exigem JWT autenticado
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const response = await fetch("/api/artifact-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          content: msg.content,
          metadata: {
            model: msg.provider,
            tier: msg.tier,
            complexity: msg.complexity,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`Preview API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.preview) {
        setPreviews((prev) => ({ ...prev, [msgId]: data.preview }));
      }
    } catch (err) {
      console.error("❌ Erro ao gerar preview:", err);
      setPreviewErrors((prev) => ({ ...prev, [msgId]: "⚠️ Não foi possível gerar o preview. Tente novamente." }));
    } finally {
      setPreviewLoading((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  // PASSO 6 — helper para append imutável de evento no histórico de revisão (array global)
  const addReviewEvent = (event) => {
    setReviewHistory((prev) => [...prev, event]);
  };

  // PASSO 10 — encerrar/limpar o ciclo de revisão atual
  const handleClearReviewCycle = () => {
    setReviewHistory([]);
    setArtifactVersion(1);
    setLastAdjustment(null);
    clearReviewCycleState();
    revisionPendingRef.current = false;
    // PASSO 11 — limpar preview persistido ao encerrar ciclo
    setPreviews({});
    setDeliveryData({});
    clearArtifactPreview();
    // PASSO 12 — limpar rascunho ao encerrar ciclo
    setInput("");
    clearInputDraft();
  };

  // Fase 2D — aplicar decisão (aprovação/rejeição) ao preview
  const handlePreviewDecision = async (msgId, decision, feedback, content) => {
    const currentPreview = previews[msgId];
    if (!currentPreview) return;
    try {
      const body = { preview: currentPreview, decision, feedback };
      if (decision === 'approved' && content) body.content = content;
      // Fase 2 — Contenção P0: endpoints de artefato exigem JWT autenticado
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const response = await fetch("/api/artifact-preview", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Preview API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.preview) {
        setPreviews((prev) => ({ ...prev, [msgId]: data.preview }));
        if (data.zipBase64) {
          setDeliveryData((prev) => ({ ...prev, [msgId]: { zipBase64: data.zipBase64 } }));
        }
        // PASSO 6 — registrar evento de aprovação ou rejeição no histórico
        if (decision === 'approved') {
          addReviewEvent({ type: 'approved', text: null, timestamp: new Date().toISOString() });
        } else if (decision === 'rejected') {
          addReviewEvent({ type: 'rejected', text: feedback || null, timestamp: new Date().toISOString() });
        }
        if (decision === 'approved' || decision === 'rejected') {
          clearReviewCycleState();
        }
      }
    } catch (err) {
      console.error("❌ Erro ao aplicar decisão:", err);
      setPreviewErrors((prev) => ({ ...prev, [msgId]: "⚠️ Erro ao registrar decisão. Tente novamente." }));
    }
  };

  // Fase 2D — solicitar revisão após rejeição (PASSO 4: suporte a objeto estruturado)
  const handleRequestRevision = (msgId, feedbackFromPanel) => {
    let revisionText;

    // PASSO 5 — helper para criar o objeto lastAdjustment com timestamp
    const buildLastAdjustment = (category, focusFile, comment) => ({
      category: category || null,
      focusFile: focusFile || null,
      comment: comment || null,
      timestamp: new Date().toISOString(),
    });

    if (feedbackFromPanel && typeof feedbackFromPanel === 'object' && !Array.isArray(feedbackFromPanel)) {
      // PASSO 4 — feedback estruturado {category, focusFile, comment}
      const parts = ['[Revisão solicitada]'];
      if (feedbackFromPanel.category) parts.push(`Tipo: ${feedbackFromPanel.category}.`);
      if (feedbackFromPanel.focusFile) parts.push(`Arquivo-foco: ${feedbackFromPanel.focusFile}.`);
      if (feedbackFromPanel.comment) parts.push(`Observação: ${feedbackFromPanel.comment}.`);
      parts.push('Por favor, revise e gere uma nova versão do artefato.');
      revisionText = parts.join(' ');
      // PASSO 5 — preservar último ajuste para continuidade visual
      setLastAdjustment(buildLastAdjustment(feedbackFromPanel.category, feedbackFromPanel.focusFile, feedbackFromPanel.comment));
      // PASSO 6 — registrar evento de ajuste solicitado no histórico
      const eventParts = [];
      if (feedbackFromPanel.category) eventParts.push(feedbackFromPanel.category);
      if (feedbackFromPanel.focusFile) eventParts.push(feedbackFromPanel.focusFile);
      if (feedbackFromPanel.comment) eventParts.push(feedbackFromPanel.comment);
      addReviewEvent({ type: 'adjustment_requested', text: eventParts.join(' · ') || null, timestamp: new Date().toISOString() });
    } else {
      // Compatibilidade com feedback string simples (legado)
      const currentPreview = previews[msgId];
      const feedback = feedbackFromPanel ?? currentPreview?.feedback;
      revisionText = feedback
        ? `[Revisão solicitada] Feedback: ${feedback}. Por favor, revise e gere uma nova versão do artefato.`
        : "[Revisão solicitada] Por favor, revise e gere uma nova versão do artefato.";
      // PASSO 5 — preservar apenas quando o usuário passou string explícita (não fallback do preview)
      if (typeof feedbackFromPanel === 'string' && feedbackFromPanel.trim()) {
        setLastAdjustment(buildLastAdjustment(null, null, feedbackFromPanel));
        // PASSO 6 — registrar evento de ajuste solicitado no histórico (string simples)
        addReviewEvent({ type: 'adjustment_requested', text: feedbackFromPanel, timestamp: new Date().toISOString() });
      }
    }
    setPreviews((prev) => { const updated = { ...prev }; delete updated[msgId]; return updated; });
    setPreviewErrors((prev) => { const updated = { ...prev }; delete updated[msgId]; return updated; });
    // PASSO 6 — sinalizar que o próximo preview é continuação desta revisão
    revisionPendingRef.current = true;
    setInput(revisionText);
  };

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
    clearInputDraft(); // PASSO 12 — limpar rascunho salvo ao enviar
    setLoading(true);

    try {

      const conversationMessages = messages
        .filter((msg) => msg.type !== "system")
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      // Construtor sempre usa o fluxo genius/hybrid — Serginho é o orquestrador soberano
      const body = {
        type: "genius",
        messages: [
          ...conversationMessages,
          { role: "user", content: userInput },
        ],
        agentType: "hybrid",
      };

      // Seleção manual de motor para teste controlado
      const engineOption = HYBRID_ENGINE_OPTIONS.find(e => e.id === selectedEngine);
      if (engineOption && engineOption.providerName) {
        body.forceProvider = engineOption.providerName;
      }

      // Obter token JWT do Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = normalizeVisibleContent(data.text || data.response || data.message || "Sem resposta");

      // Extrair informação do motor ativo (120B vs 70B) e status de fallback
      const modelInfo = data.model || {};
      const execution = data.execution || {};
      const isFallback = (execution.fallbackLevel || 0) > 0;
      const isManualEngine = !!execution.manualEngine;
      const motorLabel = modelInfo.icon && modelInfo.displayName
        ? `${modelInfo.icon} ${modelInfo.displayName}`
        : modelInfo.displayName || modelInfo.modelId || data.provider || "Construtor";
      const tier = data.routing?.selectedTier || modelInfo.logicalTier || data.tier || "standard";
      const complexity = data.routing?.analyzedComplexity || data.complexity || 0;

      const agentName = "Construtor";

      // Adicionar resposta do agente
      const agentMessage = {
        id: messages.length + 2,
        type: "agent",
        agent: agentName,
        content: aiResponse,
        provider: motorLabel,
        tier: tier,
        isFallback: isFallback,
        isManualEngine: isManualEngine,
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

  const handleGitHubOAuth = async () => {
    try {

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
          <h1>⚙️ Construtor</h1>
          <p>Construção e entrega de artefatos</p>
        </div>

        {/* Controles */}
        <div className="header-controls">
          {/* Seletor de motor para teste controlado */}
          <div className="mode-selector engine-selector">
            <label htmlFor="engine-select">🔬 Motor:</label>
            <select
              id="engine-select"
              className="engine-select"
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
            >
              {HYBRID_ENGINE_OPTIONS.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.icon} {engine.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="info-section">
            <div className="info-box">
              <h3>SISTEMA</h3>
              <p>
                🚀 <strong>Versão 3.1.0</strong>
              </p>
              <p>Construtor — Sistema automatizado</p>
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
                        background: msg.isFallback ? '#e67e22' : getTierColor(msg.tier || 'unknown'),
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#fff',
                        fontWeight: 'bold',
                        marginLeft: '8px',
                      }}
                      title={msg.isFallback ? 'Motor fallback ativo (120B indisponível)' : msg.isManualEngine ? 'Motor selecionado manualmente para teste' : 'Motor principal ativo'}
                    >
                      {msg.provider}{msg.isFallback ? ' ⚠️ fallback' : ''}{msg.isManualEngine ? ' 🔬 teste' : ''}
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
              <div className="message-content">
                {msg.type === "agent" ? (
                  isMultiFileContent(msg.content) ? (
                    <MultiFileRenderer content={msg.content} />
                  ) : (
                    <SimpleMarkdown text={msg.content} />
                  )
                ) : (
                  msg.content
                )}
              </div>
              {/* Fase 2D — botão de preview e painel */}
              {msg.type === "agent" && (
                <div>
                  {!previews[msg.id] && (
                    <div className="artifact-preview-entry">
                      <button
                        className="artifact-preview-trigger-btn"
                        onClick={() => handleGeneratePreview(msg)}
                        disabled={previewLoading[msg.id]}
                      >
                        {previewLoading[msg.id] ? "⏳ Gerando preview..." : "🔍 Revisar artefato"}
                      </button>
                      {!previewLoading[msg.id] && (
                        <span className="artifact-preview-entry-hint">Revisar · Aprovar · Solicitar ajuste</span>
                      )}
                    </div>
                  )}
                  {previewErrors[msg.id] && !previews[msg.id] && (
                    <p className="artifact-preview-error">{previewErrors[msg.id]}</p>
                  )}
                  {previews[msg.id] && (
                    <ArtifactPreviewPanel
                      preview={previews[msg.id]}
                      loading={previewLoading[msg.id]}
                      onDecision={(decision, feedback) =>
                        handlePreviewDecision(msg.id, decision, feedback, msg.content)
                      }
                      onRevision={(fb) => handleRequestRevision(msg.id, fb)}
                      delivery={deliveryData[msg.id]}
                      lastAdjustment={lastAdjustment}
                      reviewHistory={reviewHistory}
                      artifactVersion={artifactVersion}
                      onClearCycle={handleClearReviewCycle}
                    />
                  )}
                  {previewErrors[msg.id] && previews[msg.id] && (
                    <p className="artifact-preview-error">{previewErrors[msg.id]}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message message-loading">
              <div className="loading-spinner">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Construtor processando...</p>
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
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
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
