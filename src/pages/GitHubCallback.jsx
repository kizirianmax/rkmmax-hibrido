import { useEffect, useState } from "react";

/**
 * GITHUB OAUTH CALLBACK PAGE
 * Página que recebe o código do GitHub e troca por token
 * Depois redireciona de volta para o chat com o token
 */
export default function GitHubCallback() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Processando autorização...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorParam = urlParams.get("error");

        if (errorParam) {
          setStatus("error");
          setError(errorParam);
          setMessage(`Autorização negada: ${errorParam}`);
          return;
        }

        if (!code) {
          setStatus("error");
          setError("Código não recebido");
          setMessage("Erro: Código de autorização não foi recebido do GitHub");
          return;
        }

        setMessage("Trocando código por token...");

        // Chamar endpoint de callback
        const response = await fetch("/api/github-oauth/callback", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          setStatus("error");
          setError(data.error);
          setMessage(`Erro: ${data.message || "Falha ao processar token"}`);
          return;
        }

        setStatus("success");
        setMessage(`✅ ${data.message}`);

        // Armazenar token localmente
        localStorage.setItem("github_token", data.token);
        localStorage.setItem("github_user", JSON.stringify(data.user));

        // Redirecionar de volta para o chat com token nos parâmetros
        setTimeout(() => {
          const redirectUrl = `/hybrid?github_token=${encodeURIComponent(data.token)}&user_name=${encodeURIComponent(data.user.login)}`;
          window.location.href = redirectUrl;
        }, 2000);
      } catch (error) {
        console.error("❌ Erro no callback:", error);
        setStatus("error");
        setError(error.message);
        setMessage(`Erro: ${error.message}`);
      }
    };

    processCallback();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          padding: "40px",
          borderRadius: "12px",
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
                animation: "spin 1s linear infinite",
              }}
            >
              🔄
            </div>
            <h1 style={{ marginTop: 0 }}>Processando Autorização</h1>
            <p style={{ fontSize: "16px", color: "#8b949e" }}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              ✅
            </div>
            <h1 style={{ marginTop: 0, color: "#3fb950" }}>Sucesso!</h1>
            <p style={{ fontSize: "16px", color: "#8b949e" }}>{message}</p>
            <p style={{ fontSize: "14px", color: "#6e7681", marginTop: "20px" }}>
              Redirecionando para o chat em 2 segundos...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              ❌
            </div>
            <h1 style={{ marginTop: 0, color: "#f85149" }}>Erro na Autorização</h1>
            <p style={{ fontSize: "16px", color: "#8b949e" }}>{message}</p>
            {error && (
              <p style={{ fontSize: "14px", color: "#f85149", marginTop: "20px" }}>
                Detalhes: {error}
              </p>
            )}
            <button
              onClick={() => (window.location.href = "/hybrid")}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#238636",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Voltar ao Chat
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
