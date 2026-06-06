/*
 * POC/SPIKE técnico: validação mínima de viabilidade client-side com WebContainers.
 * Não representa uso comercial em produção.
 */

const SPIKE_FILE_NAME = "index.js";
const SPIKE_FILE_CONTENT = "console.log('RKMMAX WebContainer spike OK');\n";

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
    await webcontainer.mount({
      [SPIKE_FILE_NAME]: {
        file: {
          contents: SPIKE_FILE_CONTENT,
        },
      },
    });

    onStatusChange("executando");
    const process = await webcontainer.spawn("node", [SPIKE_FILE_NAME]);
    let stdout = "";

    const reader = process.output.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      stdout += value || "";
    }

    const exitCode = await process.exit;
    return {
      ok: true,
      stdout: stdout.trim(),
      stderr: "",
      exitCode,
      durationMs: Date.now() - startedAt,
      crossOriginIsolated: true,
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
