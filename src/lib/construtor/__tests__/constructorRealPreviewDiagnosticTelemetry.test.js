import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRealPreviewDiagnosticTelemetry } from "../constructorRealPreviewDiagnosticTelemetry.js";

function expectNoPayloadLeak(snapshot) {
  expect(snapshot).not.toHaveProperty("rawContent");
  expect(snapshot).not.toHaveProperty("fileContents");
  expect(snapshot).not.toHaveProperty("contentPreview");
  expect(snapshot).not.toHaveProperty("zipBase64");
  expect(snapshot).not.toHaveProperty("agentMessage");
  expect(snapshot).not.toHaveProperty("artifact");
  expect(snapshot).not.toHaveProperty("files");
  expect(snapshot).not.toHaveProperty("mountTree");
}

describe("constructorRealPreviewDiagnosticTelemetry", () => {
  test("estado inicial começa com todos os contadores zerados", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();

    expect(telemetry.snapshot()).toEqual({
      total: 0,
      eligible: 0,
      unavailable: 0,
      byReason: {},
      byStatus: {},
    });
  });

  test("conta verdict eligible", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();
    telemetry.record({ verdict: "eligible" });

    expect(telemetry.snapshot()).toMatchObject({
      total: 1,
      eligible: 1,
      unavailable: 0,
    });
  });

  test("conta verdict unavailable", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();
    telemetry.record({ verdict: "unavailable" });

    expect(telemetry.snapshot()).toMatchObject({
      total: 1,
      eligible: 0,
      unavailable: 1,
    });
  });

  test("agrupa unavailable por reason quando reason é string não-vazia", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();
    telemetry.record({ verdict: "unavailable", reason: "arquivo-fora-da-allowlist" });
    telemetry.record({ verdict: "unavailable", reason: "arquivo-fora-da-allowlist" });
    telemetry.record({ verdict: "unavailable", reason: "   " });

    expect(telemetry.snapshot().byReason).toEqual({
      "arquivo-fora-da-allowlist": 2,
    });
  });

  test("agrupa por status quando status é string não-vazia", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();
    telemetry.record({ verdict: "eligible", status: "constructor-approved-preview-diagnostic-reader: eligible" });
    telemetry.record({ verdict: "unavailable", status: "constructor-approved-preview-diagnostic-reader: unavailable" });
    telemetry.record({ verdict: "unavailable", status: "" });

    expect(telemetry.snapshot().byStatus).toEqual({
      "constructor-approved-preview-diagnostic-reader: eligible": 1,
      "constructor-approved-preview-diagnostic-reader: unavailable": 1,
    });
  });

  test("múltiplos registros acumulam corretamente", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();
    telemetry.record({ verdict: "eligible", reason: "shape-ok", status: "eligible-status" });
    telemetry.record({ verdict: "unavailable", reason: "shape-ruim", status: "unavailable-status" });
    telemetry.record({ verdict: "unavailable", reason: "shape-ruim", status: "unavailable-status" });

    expect(telemetry.snapshot()).toEqual({
      total: 3,
      eligible: 1,
      unavailable: 2,
      byReason: {
        "shape-ok": 1,
        "shape-ruim": 2,
      },
      byStatus: {
        "eligible-status": 1,
        "unavailable-status": 2,
      },
    });
  });

  test("entradas inválidas não quebram e não contam", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();

    expect(() => {
      telemetry.record(null);
      telemetry.record([]);
      telemetry.record("eligible");
      telemetry.record(123);
      telemetry.record({});
      telemetry.record({ verdict: "desconhecido", reason: "x", status: "y" });
    }).not.toThrow();

    expect(telemetry.snapshot()).toEqual({
      total: 0,
      eligible: 0,
      unavailable: 0,
      byReason: {},
      byStatus: {},
    });
  });

  test("não-vazamento: snapshot nunca expõe payload bruto mesmo com entrada contendo campos proibidos", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();

    telemetry.record({
      verdict: "eligible",
      reason: "shape-ok",
      status: "eligible-status",
      rawContent: "conteúdo cru",
      fileContents: { "index.js": "console.log('x')" },
      contentPreview: "preview cru",
      zipBase64: "UEsDBAoAAAAAA",
      agentMessage: { content: "mensagem crua" },
      artifact: { foo: "bar" },
      files: [{ name: "index.js", body: "x" }],
      mountTree: [{ name: "index.js", path: "/index.js" }],
    });

    const snapshot = telemetry.snapshot();
    expect(snapshot).toEqual({
      total: 1,
      eligible: 1,
      unavailable: 0,
      byReason: { "shape-ok": 1 },
      byStatus: { "eligible-status": 1 },
    });
    expectNoPayloadLeak(snapshot);
  });

  test("snapshot retorna cópia segura sem corromper estado interno ao mutar retorno", () => {
    const telemetry = createRealPreviewDiagnosticTelemetry();
    telemetry.record({
      verdict: "unavailable",
      reason: "motivo-a",
      status: "status-a",
    });

    const firstSnapshot = telemetry.snapshot();
    firstSnapshot.total = 999;
    firstSnapshot.eligible = 999;
    firstSnapshot.unavailable = 999;
    firstSnapshot.byReason["motivo-a"] = 999;
    firstSnapshot.byReason["motivo-novo"] = 123;
    firstSnapshot.byStatus["status-a"] = 999;
    firstSnapshot.byStatus["status-novo"] = 123;

    const secondSnapshot = telemetry.snapshot();
    expect(secondSnapshot).toEqual({
      total: 1,
      eligible: 0,
      unavailable: 1,
      byReason: { "motivo-a": 1 },
      byStatus: { "status-a": 1 },
    });
  });

  test("higiene do módulo: sem fetch/api/storage/execução/UI proibidos", () => {
    const modulePath = fileURLToPath(
      new URL("../constructorRealPreviewDiagnosticTelemetry.js", import.meta.url),
    );
    const moduleSource = fs.readFileSync(modulePath, "utf8");

    expect(moduleSource).not.toContain("fetch");
    expect(moduleSource).not.toContain("/api/");
    expect(moduleSource).not.toContain("sessionStorage");
    expect(moduleSource).not.toContain("localStorage");
    expect(moduleSource).not.toContain("executeArtifact");
    expect(moduleSource).not.toContain("WebContainer.boot");
    expect(moduleSource).not.toContain("mountTree");
    expect(moduleSource).not.toContain("zipBase64");
    expect(moduleSource).not.toContain("contentPreview");
    expect(moduleSource).not.toContain("agentMessage.content");
    expect(moduleSource).not.toMatch(/\bReact\b/);
    expect(moduleSource).not.toContain("<div");
    expect(moduleSource).not.toContain("<span");
    expect(moduleSource).not.toContain("<Fragment");
  });
});
