import React, { useMemo, useState } from "react";
import "./WebContainerSpike.css";
import { runWebContainerSpike } from "../lib/construtor/webcontainerSpikeRunner.js";
import {
  ARTIFACT_SOURCE,
  getApprovedConstructorArtifactBridgeStatus,
  getWebContainerSpikeEvidence,
} from "../lib/construtor/webcontainerSpikeEvidence.js";

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

  const evidence = useMemo(() => getWebContainerSpikeEvidence(), []);
  const bridgeStatus = useMemo(() => getApprovedConstructorArtifactBridgeStatus(), []);

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
        Spike experimental client-side com bridge segura em preparação. Execução atual usa fixture controlado, não artefato real aprovado.
      </div>

      <div className="webcontainer-spike__card">
        <strong>Diagnóstico inicial</strong>
        <p>crossOriginIsolated: {String(diagnostics.crossOriginIsolated)}</p>
        <p>SharedArrayBuffer disponível: {String(diagnostics.hasSharedArrayBuffer)}</p>
        <p>WebContainers requer COOP/COEP ativos para boot.</p>
      </div>

      <div className="webcontainer-spike__card" aria-label="Evidência segura do fluxo">
        <strong>Evidência segura do fluxo</strong>
        <ul className="webcontainer-spike__list">
          <li>
            Origem ativa do artefato:{" "}
            {bridgeStatus.activeSource === ARTIFACT_SOURCE.fixture ? "fixture controlado" : "artefato aprovado"}
          </li>
          <li>Status bridge approved-constructor: {bridgeStatus.status}</li>
          <li>Bridge disponível no client: {bridgeStatus.available ? "sim" : "não"}</li>
          <li>Motivo bridge indisponível: {bridgeStatus.reason}</li>
          <li>Adapter: {evidence.adapter === "passed" ? "aprovado" : "falhou"}</li>
          <li>Contrato sanitizado: {evidence.sanitization === "passed" ? "aprovado" : "falhou"}</li>
          <li>Execução: client-side / WebContainer</li>
          <li>Leitura de payload bruto: {bridgeStatus.rawPayloadAccessed ? "sim" : "não"}</li>
          <li>Payload bruto: não exibido</li>
          <li>Backend/API: {bridgeStatus.apiUsed ? "usado" : "não usado"}</li>
          <li>
            executeArtifact server-side:{" "}
            {bridgeStatus.executeArtifactServerSide === "disabled" ? "desativado" : bridgeStatus.executeArtifactServerSide}
          </li>
        </ul>
        <p className="webcontainer-spike__warning">{bridgeStatus.note}</p>
        <p>
          <strong>Arquivos permitidos</strong>
        </p>
        <ul className="webcontainer-spike__files" aria-label="Arquivos permitidos">
          {evidence.allowedFiles.map((filePath) => (
            <li key={filePath}>
              <code>{filePath}</code>
            </li>
          ))}
        </ul>
        <p className="webcontainer-spike__warning">Ainda é spike experimental; não é demo final de produção.</p>
      </div>

      <button type="button" className="webcontainer-spike__button" onClick={handleRunSpike} disabled={isRunning}>
        Rodar artefato controlado no WebContainer
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
