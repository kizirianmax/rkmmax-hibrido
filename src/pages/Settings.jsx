// src/pages/Settings.jsx
import React, { useState } from "react";
import SpecialistVisibilityManager from "../components/SpecialistVisibilityManager.jsx";

export default function Settings() {
  const [connections, setConnections] = useState({
    github: false,
    gmail: false,
    googleAgenda: false,
  });

  const handleConnect = (service) => {
    // TODO: Implementar OAuth real
    alert(`Conectando com ${service}... (em desenvolvimento)`);
    setConnections((prev) => ({ ...prev, [service]: !prev[service] }));
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>⚙️ Configurações</h1>
        <p style={styles.subtitle}>
          Conecte suas ferramentas favoritas para o Serginho ter acesso completo
        </p>
      </header>

      {/* Integrações */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔌 Integrações</h2>
        <p style={styles.sectionDesc}>
          Conecte serviços externos para expandir as capacidades do Serginho
        </p>

        <div style={styles.integrationsList}>
          {/* GitHub */}
          <div style={styles.integrationCard}>
            <div style={styles.integrationHeader}>
              <div style={styles.integrationIcon}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </div>
              <div style={styles.integrationInfo}>
                <h3 style={styles.integrationName}>GitHub</h3>
                <p style={styles.integrationDesc}>
                  Acesse repositórios, crie issues e faça commits
                </p>
              </div>
              <button
                onClick={() => handleConnect("github")}
                style={{
                  ...styles.connectButton,
                  ...(connections.github ? styles.connectedButton : {}),
                }}
              >
                {connections.github ? "✓ Conectado" : "Conectar"}
              </button>
            </div>
          </div>

          {/* Gmail */}
          <div style={styles.integrationCard}>
            <div style={styles.integrationHeader}>
              <div style={{ ...styles.integrationIcon, background: "#EA4335" }}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
              </div>
              <div style={styles.integrationInfo}>
                <h3 style={styles.integrationName}>Gmail</h3>
                <p style={styles.integrationDesc}>Leia, envie e organize seus emails</p>
              </div>
              <button
                onClick={() => handleConnect("gmail")}
                style={{
                  ...styles.connectButton,
                  ...(connections.gmail ? styles.connectedButton : {}),
                }}
              >
                {connections.gmail ? "✓ Conectado" : "Conectar"}
              </button>
            </div>
          </div>

          {/* Google Agenda */}
          <div style={styles.integrationCard}>
            <div style={styles.integrationHeader}>
              <div style={{ ...styles.integrationIcon, background: "#4285F4" }}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                </svg>
              </div>
              <div style={styles.integrationInfo}>
                <h3 style={styles.integrationName}>Google Agenda</h3>
                <p style={styles.integrationDesc}>Crie eventos e gerencie sua agenda</p>
              </div>
              <button
                onClick={() => handleConnect("googleAgenda")}
                style={{
                  ...styles.connectButton,
                  ...(connections.googleAgenda ? styles.connectedButton : {}),
                }}
              >
                {connections.googleAgenda ? "✓ Conectado" : "Conectar"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visibilidade dos Especialistas */}
      <section style={styles.section}>
        <SpecialistVisibilityManager />
      </section>

      {/* Gerenciar Conectores */}
      <section style={styles.section}>
        <button style={styles.manageButton}>🔧 Gerenciar conectores</button>
        <button style={styles.addButton}>+ Adicionar conectores</button>
      </section>

      {/* Informações */}
      <section style={styles.infoSection}>
        <p style={styles.infoText}>
          💡 <strong>Dica:</strong> Conecte suas ferramentas para o Serginho ter acesso completo aos
          seus dados e poder executar tarefas complexas automaticamente.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    paddingBottom: "80px",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 900,
    margin: "0 0 8px",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    margin: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#1e293b",
  },
  sectionDesc: {
    fontSize: 14,
    color: "#64748b",
    margin: "0 0 16px",
  },
  integrationsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  integrationCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  integrationHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 4px",
    color: "#1e293b",
  },
  integrationDesc: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  },
  connectButton: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #3b82f6",
    background: "#3b82f6",
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
    minWidth: 100,
  },
  connectedButton: {
    background: "#10b981",
    borderColor: "#10b981",
  },
  manageButton: {
    padding: "12px 24px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#475569",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginRight: 12,
    marginBottom: 12,
  },
  addButton: {
    padding: "12px 24px",
    borderRadius: 10,
    border: "1px solid #3b82f6",
    background: "#3b82f6",
    color: "white",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 12,
  },
  infoSection: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#1e40af",
    margin: 0,
    lineHeight: 1.6,
  },
};
