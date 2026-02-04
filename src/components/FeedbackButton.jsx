// src/components/FeedbackButton.jsx
import React, { useState } from "react";
import { captureMessage } from "../lib/sentry.js";
import { trackEvent, Events } from "../lib/analytics.js";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [type, setType] = useState("bug");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      alert("Por favor, descreva o problema ou sugestão.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture context
      const context = {
        type,
        feedback: feedback.trim(),
        email: email.trim() || localStorage.getItem("user_email") || "anonymous",
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
      };

      // Send to Sentry
      captureMessage(`[Feedback] ${type}: ${feedback.substring(0, 100)}`, "info", context);

      // Track in analytics
      trackEvent(Events.FEEDBACK_SUBMITTED, {
        type,
        hasEmail: !!email,
      });

      // Send to API (GitHub Issue creation)
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
        });
      } catch (apiError) {
        console.warn("Failed to send feedback to API:", apiError);
        // Don't fail the whole process if API is down
      }

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedback("");
        setEmail("");
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          right: 16,
          padding: "12px 20px",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 24,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          zIndex: 60,
          fontSize: 14,
          minHeight: 48,
          touchAction: "manipulation",
        }}
        aria-label="Reportar problema ou dar feedback"
      >
        🐛 Feedback
      </button>
    );
  }

  return (
    <div
      className="feedback-overlay"
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        right: 16,
        width: 360,
        maxWidth: "calc(100vw - 40px)",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        padding: 20,
        zIndex: 60,
        pointerEvents: "auto",
      }}
    >
      {submitted ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Feedback enviado!</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.7 }}>
            Obrigado pela sua contribuição.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Enviar Feedback</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                padding: 0,
                opacity: 0.6,
              }}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            >
              <option value="bug">🐛 Bug / Erro</option>
              <option value="feature">💡 Sugestão</option>
              <option value="question">❓ Dúvida</option>
              <option value="other">💬 Outro</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Descrição *
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Descreva o problema ou sugestão..."
              required
              rows={4}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              E-mail (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1,
              fontSize: 14,
            }}
          >
            {isSubmitting ? "Enviando..." : "Enviar Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
