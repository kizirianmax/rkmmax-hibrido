// src/ErrorBoundary.jsx
import React from "react";
import { captureError } from "./lib/sentry.js";
import { trackEvent, Events } from "./lib/analytics.js";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crash:", error, info);

    // Send to Sentry
    captureError(error, {
      componentStack: info.componentStack,
      url: window.location.href,
    });

    // Track in analytics
    trackEvent(Events.ERROR_OCCURRED, {
      error: error.message,
      url: window.location.href,
    });
  }

  reset = () => this.setState({ error: null });
  reload = () => typeof window !== "undefined" && window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const showDebug =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "1";

    return (
      <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
        <h1 style={{ marginBottom: 8 }}>Algo deu errado</h1>

        {!showDebug ? (
          <>
            <p>Tente atualizar a página.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button onClick={this.reset} style={btn}>
                Tentar novamente
              </button>
              <a href="/" style={btnLink}>
                Ir para a Home
              </a>
              <button onClick={this.reload} style={btn}>
                Recarregar
              </button>
            </div>
            <p style={{ marginTop: 12 }}>
              Precisa de detalhes? <a href="?debug=1">abrir com ?debug=1</a>.
            </p>
          </>
        ) : (
          <>
            <h2>Detalhes</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.message || error)}</pre>
            {error?.stack && (
              <>
                <h3>Stack</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
              </>
            )}
          </>
        )}
      </div>
    );
  }
}

const btn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ccc",
  background: "#f2f2f2",
  cursor: "pointer",
  fontWeight: 600,
};
const btnLink = {
  ...btn,
  background: "transparent",
  textDecoration: "none",
  display: "inline-block",
};
