import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  shouldShowConstructorTelemetryDiagnostics,
  sanitizeConstructorTelemetrySnapshotForDiagnostics,
} from "../constructorTelemetryDiagnosticGate.js";

describe("constructorTelemetryDiagnosticGate", () => {
  test("constructorTelemetry=1 retorna true", () => {
    expect(shouldShowConstructorTelemetryDiagnostics("?constructorTelemetry=1")).toBe(true);
    expect(shouldShowConstructorTelemetryDiagnostics("?foo=bar&constructorTelemetry=1")).toBe(true);
  });

  test("ausência do parâmetro retorna false", () => {
    expect(shouldShowConstructorTelemetryDiagnostics("?foo=bar")).toBe(false);
    expect(shouldShowConstructorTelemetryDiagnostics("")).toBe(false);
  });

  test("valor diferente de 1 retorna false", () => {
    expect(shouldShowConstructorTelemetryDiagnostics("?constructorTelemetry=0")).toBe(false);
    expect(shouldShowConstructorTelemetryDiagnostics("?constructorTelemetry=2")).toBe(false);
    expect(shouldShowConstructorTelemetryDiagnostics("?constructorTelemetry=true")).toBe(false);
  });

  test("query inválida não quebra e retorna false", () => {
    const invalidInputs = [null, undefined, 123, {}, []];

    invalidInputs.forEach((input) => {
      expect(() => shouldShowConstructorTelemetryDiagnostics(input)).not.toThrow();
      expect(shouldShowConstructorTelemetryDiagnostics(input)).toBe(false);
    });
  });

  test("snapshot válido é sanitizado preservando apenas os campos verdict-only", () => {
    const input = {
      total: 10,
      eligible: 3,
      unavailable: 7,
      byReason: {
        "shape-ok": 3,
        "shape-ruim": 7,
      },
      byStatus: {
        eligible: 3,
        unavailable: 7,
      },
    };

    expect(sanitizeConstructorTelemetrySnapshotForDiagnostics(input)).toEqual({
      total: 10,
      eligible: 3,
      unavailable: 7,
      byReason: {
        "shape-ok": 3,
        "shape-ruim": 7,
      },
      byStatus: {
        eligible: 3,
        unavailable: 7,
      },
    });
  });

  test("snapshot inválido retorna zeros", () => {
    const invalidInputs = [null, [], "x", 123];

    invalidInputs.forEach((input) => {
      expect(sanitizeConstructorTelemetrySnapshotForDiagnostics(input)).toEqual({
        total: 0,
        eligible: 0,
        unavailable: 0,
        byReason: {},
        byStatus: {},
      });
    });
  });

  test("campos proibidos não vazam no retorno", () => {
    const input = {
      total: 1,
      eligible: 1,
      unavailable: 0,
      byReason: { "shape-ok": 1 },
      byStatus: { eligible: 1 },
      rawContent: "SEGREDO_BRUTO",
      fileContents: { "index.js": "console.log('segredo')" },
      contentPreview: "preview sensível",
      zipBase64: "UEsDBAoAAAAAA",
      agentMessage: { content: "mensagem sensível" },
      artifact: { id: "artifact-1" },
      files: [{ name: "index.js", body: "dados sensíveis" }],
      mountTree: [{ name: "index.js", path: "/index.js" }],
    };

    const output = sanitizeConstructorTelemetrySnapshotForDiagnostics(input);
    const outputString = JSON.stringify(output);

    expect(output).toEqual({
      total: 1,
      eligible: 1,
      unavailable: 0,
      byReason: { "shape-ok": 1 },
      byStatus: { eligible: 1 },
    });

    [
      "rawContent",
      "fileContents",
      "contentPreview",
      "zipBase64",
      "agentMessage",
      "artifact",
      "files",
      "mountTree",
      "SEGREDO_BRUTO",
      "console.log('segredo')",
      "preview sensível",
      "mensagem sensível",
      "dados sensíveis",
    ].forEach((forbiddenValue) => {
      expect(outputString).not.toContain(forbiddenValue);
    });
  });

  test("sanitização não muta o input e retorna novas referências", () => {
    const input = {
      total: 5,
      eligible: 2,
      unavailable: 3,
      byReason: {
        "shape-ok": 2,
        "shape-ruim": 3,
      },
      byStatus: {
        eligible: 2,
        unavailable: 3,
      },
    };
    const before = JSON.parse(JSON.stringify(input));

    const output = sanitizeConstructorTelemetrySnapshotForDiagnostics(input);

    expect(output).toEqual(before);
    expect(output).not.toBe(input);
    expect(output.byReason).not.toBe(input.byReason);
    expect(output.byStatus).not.toBe(input.byStatus);
    expect(input).toEqual(before);
  });

  test("higiene do módulo: sem fetch/api/storage/execução/UI proibidos", () => {
    const modulePath = fileURLToPath(
      new URL("../constructorTelemetryDiagnosticGate.js", import.meta.url),
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
    expect(moduleSource).not.toMatch(/react/i);
    expect(moduleSource).not.toContain("<div");
    expect(moduleSource).not.toContain("<span");
    expect(moduleSource).not.toContain("<Fragment");
  });
});
