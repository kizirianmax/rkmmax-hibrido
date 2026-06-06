import React, { useMemo, useState } from "react";
import "./WebContainerSpike.css";
import { runWebContainerSpike } from "../lib/construtor/webcontainerSpikeRunner.js";

const STATUS = {
  idle: "idle",
  loading: "carregando módulo",
  booting: "bootando",
  running: "executando",
  success: "sucesso",
  error: "erro",
};

export default function WebContainerSpike() {
  const [status, setStatus] = useState(STATUS.idle);
  const [isRunning, setIsRunning] = useState(false);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [durationMs, setDurationMs] = useState(null);

  const diagnostics = useMemo(
    () => ({
      crossOriginIsolated: Boolean(globalThis.crossOriginIsolated),
      hasSharedArrayBuffer: typeof globalThis.SharedArrayBuffer !== "undefined",
    }),
    []
  );

  async function handleRunSpike() {
    setIsRunning(true);
    setStdout("");
    setStderr("");
    setErrorMessage("");
    setDurationMs(null);
    setStatus(STATUS.loading);

    const result = await runWebContainerSpike({
      onStatusChange: (nextStatus) => setStatus(nextStatus),
    });

    setStdout(result.stdout || "");
    setStderr(result.stderr || "");
    setDurationMs(typeof result.durationMs === "number" ? result.durationMs : null);

    if (result.ok) {
      setStatus(STATUS.success);
      setIsRunning(false);
      return;
    }

    if (result.reason === "cross-origin-isolation-indisponivel") {
      setErrorMessage(
        "A rota não está cross-origin isolated neste ambiente/navegação. Isso é um resultado válido deste spike."
      );
    } else {
      setErrorMessage(result.error || "Falha no spike WebContainers.");
    }
    setStatus(STATUS.error);
    setIsRunning(false);
  }

  return (
    <section className="webcontainer-spike" aria-label="WebContainer Spike">
      <div className="webcontainer-spike__alert">
        Spike experimental client-side. Não executa no servidor. Não representa ainda a demo final.
      </div>

      <div className="webcontainer-spike__card">
        <strong>Diagnóstico inicial</strong>
        <p>crossOriginIsolated: {String(diagnostics.crossOriginIsolated)}</p>
        <p>SharedArrayBuffer disponível: {String(diagnostics.hasSharedArrayBuffer)}</p>
        <p>WebContainers requer COOP/COEP ativos para boot.</p>
      </div>

      <button type="button" className="webcontainer-spike__button" onClick={handleRunSpike} disabled={isRunning}>
        Rodar spike WebContainers
      </button>

      <div className="webcontainer-spike__card">
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Duração aproximada:</strong> {durationMs ?? "--"} ms
        </p>
        {errorMessage ? (
          <p role="alert">
            <strong>Erro amigável:</strong> {errorMessage}
          </p>
        ) : null}
      </div>

      <div className="webcontainer-spike__card">
        <strong>stdout</strong>
        <pre>{stdout || "(vazio)"}</pre>
      </div>

      <div className="webcontainer-spike__card">
        <strong>stderr</strong>
        <pre>{stderr || "(vazio)"}</pre>
      </div>
    </section>
  );
}
