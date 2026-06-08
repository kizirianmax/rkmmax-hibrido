/*
 * POC/SPIKE técnico: validação mínima de viabilidade client-side com WebContainers.
 * Não representa uso comercial em produção.
 */

import { CONTROLLED_ARTIFACT_ENTRYPOINT, CONTROLLED_ARTIFACT_SANITIZED } from "./webcontainerArtifactFixture.js";
import { isControlledApprovedWebContainerRuntimeInput } from "./constructorApprovedArtifactWebContainerFixture.js";

function normalizeErrorMessage(error) {
  const raw = error?.message || String(error || "erro-desconhecido");
  if (/license|licen[çc]a|commercial|subscription/i.test(raw)) {
    return {
      reason: "licenca-webcontainer-pendente",
      message: "WebContainer não iniciou: licença/comercialização requer validação antes de produção.",
    };
  }
  if (/cross.origin|cross-origin|sharedarraybuffer|coep|coop/i.test(raw)) {
    return {
      reason: "cross-origin-isolation-indisponivel",
      message: "WebContainer não iniciou: este ambiente não está cross-origin isolated (COOP/COEP).",
    };
  }
  return {
    reason: "webcontainer-spike-falhou",
    message: "Falha ao executar o spike WebContainer neste navegador/ambiente.",
  };
}

export async function runWebContainerSpike(options = {}) {
  const startedAt = Date.now();
  const onStatusChange = typeof options?.onStatusChange === "function" ? options.onStatusChange : () => {};
  const trustedRuntimeInput = isControlledApprovedWebContainerRuntimeInput(options?.approvedRuntimeInput)
    ? options.approvedRuntimeInput
    : null;
  const mountTree = trustedRuntimeInput?.mountTree || CONTROLLED_ARTIFACT_SANITIZED.mountTree;
  const entrypoint =
    typeof trustedRuntimeInput?.entrypoint === "string" && trustedRuntimeInput.entrypoint.trim().length > 0
      ? trustedRuntimeInput.entrypoint.trim()
      : CONTROLLED_ARTIFACT_ENTRYPOINT;
  let webcontainer = null;

  if (!globalThis.crossOriginIsolated) {
    return {
      ok: false,
      reason: "cross-origin-isolation-indisponivel",
      crossOriginIsolated: false,
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    onStatusChange("carregando módulo");
    const { WebContainer } = await import("@webcontainer/api");

    onStatusChange("bootando");
    webcontainer = await WebContainer.boot();
    await webcontainer.mount(mountTree);

    onStatusChange("executando");
    const process = await webcontainer.spawn("node", [entrypoint]);
    let stdout = "";

    // A API usada neste spike expõe `process.output` como stream combinado; stderr dedicado fica vazio.
    let decoder = null;
    const reader = process.output.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (typeof value === "string") {
        stdout += value;
      } else {
        decoder ||= new TextDecoder();
        stdout += decoder.decode(value, { stream: true });
      }
    }
    stdout += decoder ? decoder.decode() : "";

    const exitCode = await process.exit;
    const ok = exitCode === 0;
    return {
      ok,
      stdout: stdout.trim(),
      stderr: "",
      exitCode,
      durationMs: Date.now() - startedAt,
      crossOriginIsolated: true,
      ...(ok
        ? {}
        : {
            reason: "artifact-exit-code-nao-zero",
            error: `Artefato controlado terminou com código ${exitCode}.`,
          }),
    };
  } catch (error) {
    const normalized = normalizeErrorMessage(error);
    return {
      ok: false,
      reason: normalized.reason,
      error: normalized.message,
      durationMs: Date.now() - startedAt,
      crossOriginIsolated: true,
    };
  } finally {
    if (webcontainer) {
      await webcontainer.teardown();
    }
  }
}
