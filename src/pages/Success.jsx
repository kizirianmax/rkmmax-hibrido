// src/pages/Success.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./Success.css";

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Esconder confetti após 5 segundos
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="success-page">
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ["#22d3ee", "#6366f1", "#ec4899", "#f59e0b"][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      )}

      <div className="success-container">
        {/* Ícone de sucesso animado */}
        <div className="success-icon">
          <svg viewBox="0 0 100 100" className="checkmark">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="4" />
            <path
              d="M25 50 L40 65 L75 35"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Título principal */}
        <h1 className="success-title">Bem-vindo ao RKMMAX Premium! 🎉</h1>

        <p className="success-subtitle">
          Sua assinatura foi ativada com sucesso. Agora você tem acesso completo a todos os recursos
          premium da plataforma.
        </p>

        {/* Benefícios */}
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🤖</div>
            <h3>47 Especialistas em IA</h3>
            <p>Acesso ilimitado a todos os agentes especializados</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">💬</div>
            <h3>Serginho - Assistente Pessoal</h3>
            <p>Seu copiloto inteligente disponível 24/7</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📚</div>
            <h3>Study Lab Premium</h3>
            <p>Formatação ABNT, cronogramas e fontes verificadas</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🚀</div>
            <h3>Recursos Ilimitados</h3>
            <p>Uso estendido com fair use policy</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h3>Processamento Prioritário</h3>
            <p>Respostas mais rápidas e prioridade na fila</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">💎</div>
            <h3>Suporte Premium</h3>
            <p>Atendimento prioritário e suporte dedicado</p>
          </div>
        </div>

        {/* Próximos passos */}
        <div className="next-steps">
          <h2>Comece agora mesmo:</h2>

          <div className="cta-buttons">
            <Link to="/agents" className="cta-primary">
              <span className="cta-icon">🎯</span>
              <div className="cta-content">
                <strong>Explorar Especialistas</strong>
                <small>Descubra os 54 agentes especializados</small>
              </div>
            </Link>

            <Link to="/serginho" className="cta-secondary">
              <span className="cta-icon">💬</span>
              <div className="cta-content">
                <strong>Conversar com Serginho</strong>
                <small>Seu assistente pessoal está te esperando</small>
              </div>
            </Link>

            <Link to="/study" className="cta-secondary">
              <span className="cta-icon">📚</span>
              <div className="cta-content">
                <strong>Acessar Study Lab</strong>
                <small>Ferramentas acadêmicas profissionais</small>
              </div>
            </Link>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="additional-info">
          <div className="info-card">
            <h4>📧 Confirmação por E-mail</h4>
            <p>Enviamos um e-mail com todos os detalhes da sua assinatura e próximos passos.</p>
          </div>

          <div className="info-card">
            <h4>💳 Gerenciar Assinatura</h4>
            <p>
              Acesse <Link to="/subscription">Minha Assinatura</Link> para gerenciar sua assinatura,
              método de pagamento e faturas.
            </p>
          </div>

          <div className="info-card">
            <h4>❓ Precisa de Ajuda?</h4>
            <p>
              Nossa equipe está disponível em{" "}
              <a href="mailto:suporte@kizirianmax.site">suporte@kizirianmax.site</a>
            </p>
          </div>
        </div>

        {/* Session ID (debug) */}
        {sessionId && (
          <p className="session-id">
            ID da sessão: <code>{sessionId}</code>
          </p>
        )}

        {/* Voltar para home */}
        <Link to="/" className="back-home">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
