// src/components/OptionalSignupBanner.jsx
import React, { useState, useEffect } from "react";
import "./OptionalSignupBanner.css";

export default function OptionalSignupBanner() {
  const [email, setEmail] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Verificar se já cadastrou ou dispensou
    const hasEmail = localStorage.getItem("user_email");
    const dismissed = localStorage.getItem("signup_banner_dismissed");

    if (!hasEmail && !dismissed) {
      // Mostrar banner após 10 segundos de uso
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setMessage("Por favor, insira um e-mail válido");
      return;
    }

    setIsSubmitting(true);

    try {
      // Salvar e-mail no localStorage
      localStorage.setItem("user_email", email);

      // Enviar para o backend
      await fetch("/api/save-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setMessage("✅ E-mail salvo! Você receberá atualizações.");

      // Fechar banner após 2 segundos
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao salvar e-mail:", error);
      setMessage("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("signup_banner_dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="signup-banner">
      <div className="signup-banner-content">
        <button className="signup-banner-close" onClick={handleDismiss} aria-label="Fechar">
          ✕
        </button>

        <div className="signup-banner-icon">📧</div>

        <h3 className="signup-banner-title">Quer receber atualizações?</h3>

        <p className="signup-banner-text">
          Deixe seu e-mail para saber quando lançarmos novos recursos e melhorias!
        </p>

        <form onSubmit={handleSubmit} className="signup-banner-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="signup-banner-input"
            disabled={isSubmitting}
          />
          <button type="submit" className="signup-banner-button" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Cadastrar"}
          </button>
        </form>

        {message && (
          <p className={`signup-banner-message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <button className="signup-banner-skip" onClick={handleDismiss}>
          Agora não
        </button>
      </div>
    </div>
  );
}
