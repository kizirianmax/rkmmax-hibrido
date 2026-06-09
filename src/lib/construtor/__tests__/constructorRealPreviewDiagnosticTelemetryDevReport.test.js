import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { formatRealPreviewDiagnosticTelemetrySnapshotForDev } from "../constructorRealPreviewDiagnosticTelemetryDevReport.js";

describe("constructorRealPreviewDiagnosticTelemetryDevReport", () => {
  test("snapshot zerado gera string segura com contadores zero", () => {
    const output = formatRealPreviewDiagnosticTelemetrySnapshotForDev({
      total: 0,
      eligible: 0,
      unavailable: 0,
      byReason: {},
      byStatus: {},
    });

    expect(output).toContain("total=0");
    expect(output).toContain("eligible=0");
    expect(output).toContain("unavailable=0");
    expect(output).toContain("byReason={}");
    expect(output).toContain("byStatus={}");
  });

  test("snapshot com contagens reflete total/eligible/unavailable/byReason/byStatus", () => {
    const output = formatRealPreviewDiagnosticTelemetrySnapshotForDev({
      total: 3,
      eligible: 1,
      unavailable: 2,
      byReason: {
        "shape-ruim": 2,
      },
      byStatus: {
        "constructor-approved-preview-diagnostic-reader: unavailable": 2,
      },
    });

    expect(output).toContain("total=3");
    expect(output).toContain("eligible=1");
    expect(output).toContain("unavailable=2");
    expect(output).toContain('byReason={"shape-ruim":2}');
    expect(output).toContain('byStatus={"constructor-approved-preview-diagnostic-reader: unavailable":2}');
  });

  test("entrada inválida não quebra e retorna string segura", () => {
    const invalidInputs = [null, [], "texto", 123, {}];

    invalidInputs.forEach((input) => {
      expect(() => formatRealPreviewDiagnosticTelemetrySnapshotForDev(input)).not.toThrow();
      const output = formatRealPreviewDiagnosticTelemetrySnapshotForDev(input);

      expect(output).toContain("total=0");
      expect(output).toContain("eligible=0");
      expect(output).toContain("unavailable=0");
      expect(output).toContain("byReason={}");
      expect(output).toContain("byStatus={}");
    });
  });

  test("não-vazamento: nunca inclui nomes/campos proibidos nem valores brutos", () => {
    const output = formatRealPreviewDiagnosticTelemetrySnapshotForDev({
      total: 1,
      eligible: 1,
      unavailable: 0,
      byReason: {
        "shape-ok": 1,
      },
      byStatus: {
        "eligible-status": 1,
      },
      rawContent: "SEGREDO_BRUTO",
      fileContents: { "index.js": "console.log('segredo')" },
      contentPreview: "preview sensível",
      zipBase64: "UEsDBAoAAAAAA",
      agentMessage: { content: "mensagem sensível" },
      artifact: { id: "artifact-1" },
      files: [{ name: "index.js", body: "dados sensíveis" }],
      mountTree: [{ name: "index.js", path: "/index.js" }],
    });

    expect(output).not.toContain("rawContent");
    expect(output).not.toContain("fileContents");
    expect(output).not.toContain("contentPreview");
    expect(output).not.toContain("zipBase64");
    expect(output).not.toContain("agentMessage");
    expect(output).not.toContain("artifact");
    expect(output).not.toContain("files");
    expect(output).not.toContain("mountTree");
    expect(output).not.toContain("SEGREDO_BRUTO");
    expect(output).not.toContain("console.log('segredo')");
    expect(output).not.toContain("mensagem sensível");
    expect(output).not.toContain("dados sensíveis");
  });

  test("pureza: não muta snapshot recebido", () => {
    const snapshot = {
      total: 2,
      eligible: 1,
      unavailable: 1,
      byReason: {
        "shape-ok": 1,
        "shape-ruim": 1,
      },
      byStatus: {
        "eligible-status": 1,
        "unavailable-status": 1,
      },
    };
    const before = JSON.parse(JSON.stringify(snapshot));

    const output = formatRealPreviewDiagnosticTelemetrySnapshotForDev(snapshot);

    expect(output).toContain("total=2");
    expect(snapshot).toEqual(before);
    expect(snapshot.byReason).toEqual(before.byReason);
    expect(snapshot.byStatus).toEqual(before.byStatus);
  });

  test("higiene do módulo: sem fetch/api/storage/execução/UI proibidos", () => {
    const modulePath = fileURLToPath(
      new URL("../constructorRealPreviewDiagnosticTelemetryDevReport.js", import.meta.url),
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
