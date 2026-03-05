import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Regulamento() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/" style={styles.backButton}>
          ← Voltar
        </Link>
        <h1 style={styles.title}>📜 Regulamento do Projeto</h1>
        <p style={styles.subtitle}>RKMMAX INFINITY MATRIX/STUDY</p>
      </div>

      <div style={styles.content}>
        {/* ✅ CONFORMIDADE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>✅ Conformidade</h2>
          <div style={styles.cardGrid}>
            <div style={styles.card}>
              <div style={styles.cardIcon}>🇪🇺</div>
              <h3 style={styles.cardTitle}>GDPR</h3>
              <p style={styles.cardText}>
                Regulamento Geral de Proteção de Dados da União Europeia. Todos os dados pessoais
                são tratados com consentimento explícito e transparência total.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeGreen }}>✓ Conforme</span>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🇧🇷</div>
              <h3 style={styles.cardTitle}>LGPD</h3>
              <p style={styles.cardText}>
                Lei Geral de Proteção de Dados do Brasil (Lei nº 13.709/2018). Direitos dos
                titulares garantidos: acesso, correção, exclusão e portabilidade.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeGreen }}>✓ Conforme</span>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>📱</div>
              <h3 style={styles.cardTitle}>Google Play</h3>
              <p style={styles.cardText}>
                Políticas de Privacidade e Segurança da Google Play Store. Aplicativo em
                conformidade com as diretrizes de proteção de dados para aplicativos Android.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeGreen }}>✓ Conforme</span>
            </div>
          </div>
        </section>

        {/* 🔒 SEGURANÇA */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔒 Segurança</h2>
          <div style={styles.cardGrid}>
            <div style={styles.card}>
              <div style={styles.cardIcon}>🔐</div>
              <h3 style={styles.cardTitle}>SSL/TLS</h3>
              <p style={styles.cardText}>
                Todas as comunicações são criptografadas com SSL/TLS. Seus dados trafegam com
                segurança de ponta a ponta.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeBlue }}>Ativo</span>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>💳</div>
              <h3 style={styles.cardTitle}>Stripe</h3>
              <p style={styles.cardText}>
                Pagamentos processados pelo Stripe, líder mundial em segurança de transações
                financeiras. Nenhum dado de cartão é armazenado em nossos servidores.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeBlue }}>PCI DSS</span>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🐙</div>
              <h3 style={styles.cardTitle}>GitHub OAuth</h3>
              <p style={styles.cardText}>
                Autenticação via GitHub OAuth 2.0. Acesso seguro sem necessidade de criar nova
                senha. Seus repositórios permanecem privados.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeBlue }}>OAuth 2.0</span>
            </div>

            <div style={styles.card}>
              <div style={styles.cardIcon}>🛡️</div>
              <h3 style={styles.cardTitle}>Dados Protegidos</h3>
              <p style={styles.cardText}>
                Banco de dados Supabase com Row Level Security (RLS). Cada usuário acessa apenas
                seus próprios dados.
              </p>
              <span style={{ ...styles.badge, ...styles.badgeBlue }}>RLS Ativo</span>
            </div>
          </div>
        </section>

        {/* 📋 TERMOS DE USO */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Termos de Uso</h2>
          <div style={styles.policyCard}>
            <p style={styles.policyText}>
              Ao usar o RKMMAX, você concorda com nossos termos de uso. O serviço é fornecido para
              uso pessoal e educacional. É proibido usar a plataforma para fins ilegais, spam ou
              violação de direitos autorais. Reservamos o direito de suspender contas que violem
              estes termos.
            </p>
            <Link to="/terms" style={styles.policyLink}>
              📄 Ler Termos de Uso completos →
            </Link>
          </div>
        </section>

        {/* 🔐 PRIVACIDADE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔐 Privacidade</h2>
          <div style={styles.policyCard}>
            <p style={styles.policyText}>
              Coletamos apenas dados necessários para fornecer o serviço: email de autenticação e
              histórico de uso. Não vendemos seus dados a terceiros. Você pode solicitar exclusão
              completa de seus dados a qualquer momento pelo email de suporte.
            </p>
            <Link to="/privacy" style={styles.policyLink}>
              🔒 Ler Política de Privacidade completa →
            </Link>
          </div>
        </section>

        {/* 💰 POLÍTICA DE REEMBOLSO */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Política de Reembolso</h2>
          <div style={styles.policyCard}>
            <p style={styles.policyText}>
              Garantia de 7 dias para todos os planos. Se não estiver satisfeito, entre em contato
              dentro do período de garantia para reembolso integral. Cancelamentos após 7 dias não
              são elegíveis para reembolso, mas você mantém acesso até o fim do período pago.
            </p>
            <Link to="/refund" style={styles.policyLink}>
              💳 Ler Política de Reembolso completa →
            </Link>
          </div>
        </section>

        {/* 🏢 INFORMAÇÕES DA EMPRESA */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🏢 Informações da Empresa</h2>
          <div style={styles.companyCard}>
            <div style={styles.companyInfo}>
              <div style={styles.companyRow}>
                <span style={styles.companyLabel}>Razão Social:</span>
                <span style={styles.companyValue}>RKMMAX INFINITY MATRIX/STUDY</span>
              </div>
              <div style={styles.companyRow}>
                <span style={styles.companyLabel}>CNPJ:</span>
                <span style={styles.companyValue}>63.492.481/0001-10</span>
              </div>
              <div style={styles.companyRow}>
                <span style={styles.companyLabel}>Email:</span>
                <a href="mailto:suporte@kizirianmax.site" style={styles.companyLink}>
                  suporte@kizirianmax.site
                </a>
              </div>
              <div style={styles.companyRow}>
                <span style={styles.companyLabel}>GitHub:</span>
                <a
                  href="https://github.com/kizirianmax"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.companyLink}
                >
                  github.com/kizirianmax
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer — exclusivo desta página */}
      <footer style={styles.footerWrapper}>
        <div style={styles.footerGrid}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerSectionTitle}>RKMMAX</h3>
            <p style={styles.footerSectionText}>
              Plataforma de IA especializada com 54 especialistas
            </p>
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerSectionTitle}>POLÍTICAS</h3>
            <ul style={styles.footerList}>
              <li>
                <Link to="/privacy" style={styles.footerLink}>
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/terms" style={styles.footerLink}>
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/refund" style={styles.footerLink}>
                  Política de Reembolso
                </Link>
              </li>
            </ul>
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerSectionTitle}>SUPORTE</h3>
            <ul style={styles.footerList}>
              <li>
                <Link to="/help" style={styles.footerLink}>
                  Ajuda
                </Link>
              </li>
              <li>
                <a href="mailto:suporte@kizirianmax.site" style={styles.footerLink}>
                  Contato
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/kizirianmax"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.footerLink}
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerSectionTitle}>CONFORMIDADE</h3>
            <ul style={styles.footerList}>
              <li>
                <span style={styles.footerText}>✓ GDPR (UE)</span>
              </li>
              <li>
                <span style={styles.footerText}>✓ LGPD (Brasil)</span>
              </li>
              <li>
                <span style={styles.footerText}>✓ Google Play Store</span>
              </li>
            </ul>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <p style={styles.footerBottomText}>
            &copy; {new Date().getFullYear()} RKMMAX. Todos os direitos reservados.
          </p>
          <p style={styles.footerBottomText}>CNPJ: 63.492.481/0001-10</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    color: "#fff",
    padding: "32px 24px 28px",
    textAlign: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    color: "#93c5fd",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid rgba(147,197,253,0.4)",
    background: "rgba(255,255,255,0.08)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "#93c5fd",
    fontWeight: 500,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  content: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 20px",
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e3a8a",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: "2px solid #e2e8f0",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
  },
  cardText: {
    margin: 0,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
    flex: 1,
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    alignSelf: "flex-start",
  },
  badgeGreen: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeBlue: {
    background: "#dbeafe",
    color: "#1e40af",
  },
  policyCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  policyText: {
    margin: "0 0 16px",
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.7,
  },
  policyLink: {
    color: "#1e40af",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: 8,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  companyCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  companyInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  companyRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    fontSize: 14,
  },
  companyLabel: {
    fontWeight: 700,
    color: "#475569",
    minWidth: 120,
  },
  companyValue: {
    color: "#1e293b",
  },
  companyLink: {
    color: "#1e40af",
    textDecoration: "none",
    fontWeight: 600,
  },
  /* Footer styles */
  footerWrapper: {
    background: "#0f172a",
    color: "#fff",
    padding: "40px 20px 20px",
    marginTop: 20,
    borderTop: "1px solid #1e293b",
  },
  footerGrid: {
    maxWidth: 1200,
    margin: "0 auto 30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 30,
    background: "#1e3a8a",
    padding: 30,
    borderRadius: 8,
  },
  footerSection: {},
  footerSectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: 0,
  },
  footerSectionText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 1.6,
    margin: 0,
  },
  footerList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  footerLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontSize: 14,
  },
  footerText: {
    color: "#93c5fd",
    fontSize: 14,
  },
  footerBottom: {
    maxWidth: 1200,
    margin: "0 auto",
    textAlign: "center",
    paddingTop: 20,
    borderTop: "1px solid #1e293b",
  },
  footerBottomText: {
    color: "#94a3b8",
    fontSize: 13,
    margin: "4px 0",
  },
};
