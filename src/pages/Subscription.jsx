// src/pages/Subscription.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Subscription.css";

export default function Subscription() {
  const [userEmail, setUserEmail] = useState("");
  // const [plan, setPlan] = useState("premium"); // TODO: Implementar quando integrar com Stripe
  // const [billingCycle, setBillingCycle] = useState("monthly"); // TODO: Implementar quando integrar com Stripe
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const email = localStorage.getItem("user_email") || "";
    setUserEmail(email);

    // Simular carregamento de dados da assinatura
    // Em produção, isso viria do Stripe via API
    setTimeout(() => {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      setNextBillingDate(next.toLocaleDateString("pt-BR"));
      setLoading(false);
    }, 500);
  }, []);

  const handleManageSubscription = () => {
    // Redirecionar para o portal do cliente do Stripe
    alert("Em produção, isso abrirá o portal do cliente do Stripe para gerenciar sua assinatura.");
    // window.open("https://billing.stripe.com/p/login/...", "_blank");
  };

  const handleCancelSubscription = () => {
    if (
      window.confirm(
        "Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos Premium."
      )
    ) {
      alert("Para cancelar, acesse o portal de gerenciamento de assinatura.");
      handleManageSubscription();
    }
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="subscription-container">
          <div className="loading">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-container">
        {/* Header */}
        <div className="subscription-header">
          <h1>Minha Assinatura</h1>
          <p>Gerencie sua assinatura e preferências</p>
        </div>

        {/* Informações do usuário */}
        <section className="subscription-section">
          <h2>👤 Informações Pessoais</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>E-mail</label>
              <div className="info-value">{userEmail || "Não informado"}</div>
            </div>
            <div className="info-item">
              <label>Plano Atual</label>
              <div className="info-value">
                <span className="badge badge-premium">Premium</span>
              </div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div className="info-value">
                <span className="badge badge-active">Ativo</span>
              </div>
            </div>
            <div className="info-item">
              <label>Membro desde</label>
              <div className="info-value">{new Date().toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
        </section>

        {/* Detalhes da assinatura */}
        <section className="subscription-section">
          <h2>💳 Detalhes da Assinatura</h2>

          <div className="subscription-card">
            <div className="subscription-card-header">
              <div>
                <h3>Plano Premium</h3>
                <p>Acesso completo a todos os recursos</p>
              </div>
              <div className="subscription-price">
                <span className="price">R$ 90,00</span>
                <span className="period">/mês</span>
              </div>
            </div>

            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Próxima cobrança:</span>
                <span className="detail-value">{nextBillingDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Método de pagamento:</span>
                <span className="detail-value">•••• •••• •••• 4242</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Renovação automática:</span>
                <span className="detail-value">Ativada</span>
              </div>
            </div>

            <div className="subscription-actions">
              <button onClick={handleManageSubscription} className="btn btn-primary">
                Gerenciar Assinatura
              </button>
              <button onClick={handleCancelSubscription} className="btn btn-danger">
                Cancelar Assinatura
              </button>
            </div>
          </div>
        </section>

        {/* Recursos incluídos */}
        <section className="subscription-section">
          <h2>✨ Recursos Incluídos</h2>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <div>
                <strong>54 Especialistas em IA</strong>
                <p>Acesso ilimitado a todos os agentes</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <div>
                <strong>Serginho - Assistente Pessoal</strong>
                <p>Disponível 24/7 para te ajudar</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <div>
                <strong>Study Lab Premium</strong>
                <p>Formatação ABNT e ferramentas acadêmicas</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div>
                <strong>Processamento Prioritário</strong>
                <p>Respostas mais rápidas</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💎</span>
              <div>
                <strong>Suporte Premium</strong>
                <p>Atendimento prioritário</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <div>
                <strong>Recursos Ilimitados</strong>
                <p>Fair use policy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Uso e estatísticas */}
        <section className="subscription-section">
          <h2>📊 Uso Este Mês</h2>
          <div className="usage-grid">
            <div className="usage-card">
              <div className="usage-icon">💬</div>
              <div className="usage-stats">
                <div className="usage-number">1,234</div>
                <div className="usage-label">Mensagens enviadas</div>
              </div>
            </div>
            <div className="usage-card">
              <div className="usage-icon">🤖</div>
              <div className="usage-stats">
                <div className="usage-number">18</div>
                <div className="usage-label">Especialistas utilizados</div>
              </div>
            </div>
            <div className="usage-card">
              <div className="usage-icon">📚</div>
              <div className="usage-stats">
                <div className="usage-number">7</div>
                <div className="usage-label">Documentos criados</div>
              </div>
            </div>
            <div className="usage-card">
              <div className="usage-icon">⏱️</div>
              <div className="usage-stats">
                <div className="usage-number">12h</div>
                <div className="usage-label">Tempo economizado</div>
              </div>
            </div>
          </div>
        </section>

        {/* Faturas */}
        <section className="subscription-section">
          <h2>🧾 Histórico de Faturas</h2>
          <div className="invoices-table">
            <div className="invoice-row invoice-header">
              <div>Data</div>
              <div>Descrição</div>
              <div>Valor</div>
              <div>Status</div>
              <div>Ação</div>
            </div>
            <div className="invoice-row">
              <div>{new Date().toLocaleDateString("pt-BR")}</div>
              <div>Plano Premium - Mensal</div>
              <div>R$ 90,00</div>
              <div>
                <span className="badge badge-paid">Pago</span>
              </div>
              <div>
                <button
                  onClick={() => alert("Download de PDF em desenvolvimento")}
                  className="link"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Baixar PDF
                </button>
              </div>
            </div>
            <div className="invoice-row">
              <div>
                {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}
              </div>
              <div>Plano Premium - Mensal</div>
              <div>R$ 90,00</div>
              <div>
                <span className="badge badge-paid">Pago</span>
              </div>
              <div>
                <button
                  onClick={() => alert("Download de PDF em desenvolvimento")}
                  className="link"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Baixar PDF
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Ações rápidas */}
        <section className="subscription-section">
          <h2>⚡ Ações Rápidas</h2>
          <div className="quick-actions">
            <Link to="/agents" className="action-card">
              <span className="action-icon">🎯</span>
              <div>
                <strong>Explorar Especialistas</strong>
                <p>Descubra todos os 54 agentes</p>
              </div>
            </Link>
            <Link to="/serginho" className="action-card">
              <span className="action-icon">💬</span>
              <div>
                <strong>Chat com Serginho</strong>
                <p>Converse com seu assistente</p>
              </div>
            </Link>
            <Link to="/study" className="action-card">
              <span className="action-icon">📚</span>
              <div>
                <strong>Study Lab</strong>
                <p>Ferramentas acadêmicas</p>
              </div>
            </Link>
            <Link to="/settings" className="action-card">
              <span className="action-icon">⚙️</span>
              <div>
                <strong>Configurações</strong>
                <p>Personalize sua experiência</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Suporte */}
        <section className="subscription-section">
          <h2>❓ Precisa de Ajuda?</h2>
          <div className="support-card">
            <p>Nossa equipe de suporte está disponível para te ajudar.</p>
            <div className="support-actions">
              <a href="mailto:suporte@kizirianmax.site" className="btn btn-secondary">
                📧 Enviar E-mail
              </a>
              <Link to="/help" className="btn btn-secondary">
                📖 Central de Ajuda
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
