import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  inferEntrypointFromFileContents,
  observeConstructorRealPreviewDiagnostic,
} from "../constructorRealPreviewDiagnosticObservation.js";

function createPreviewSummary(overrides = {}) {
  return {
    id: "preview-artifact-001",
    version: "1.0.0",
    fileContents: {
      "index.js": "const { sum } = require('./lib/sum.js');\nconsole.log(sum([1, 2, 3]));",
      "lib/sum.js": "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
    },
    ...overrides,
  };
}

function createPreview(summaryOverrides = {}) {
  return {
    summary: createPreviewSummary(summaryOverrides),
  };
}

function expectVerdictOnlyWithoutPayloadLeak(result) {
  expect(result).not.toHaveProperty("rawContent");
  expect(result).not.toHaveProperty("fileContents");
  expect(result).not.toHaveProperty("artifact");
  expect(result).not.toHaveProperty("files");
  expect(result).not.toHaveProperty("contentPreview");
  expect(result).not.toHaveProperty("zipBase64");
  expect(result).not.toHaveProperty("agentMessage");
  expect(result).not.toHaveProperty("mountTree");
}

describe("constructorRealPreviewDiagnosticObservation", () => {
  test("summary documental com content.md + index.html infere index.html e retorna unavailable", () => {
    const fileContents = {
      "content.md": "# Documento",
      "index.html": "<html><body>preview</body></html>",
    };

    expect(inferEntrypointFromFileContents(fileContents)).toBe("index.html");

    const result = observeConstructorRealPreviewDiagnostic(
      createPreview({ fileContents }),
    );

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: expect.any(String),
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("summary allowlistado com index.js + lib/sum.js infere index.js e retorna eligible", () => {
    const fileContents = {
      "lib/sum.js": "module.exports = { sum: (values) => values.reduce((a, b) => a + b, 0) };",
      "index.js": "const { sum } = require('./lib/sum.js'); console.log(sum([1,2,3]));",
    };

    expect(inferEntrypointFromFileContents(fileContents)).toBe("index.js");

    const result = observeConstructorRealPreviewDiagnostic(createPreview({ fileContents }));

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("filtra metadados internos no caminho verdict-only antes do reader", () => {
    const fileContents = {
      "index.html": "<html><body>ok</body></html>",
      "styles.css": "body{margin:0;}",
      "script.js": "console.log('ok')",
      "README.md": "# metadata",
      "manifest.json": '{"generated":true}',
      "logs/generation.log": "generated",
      "logs/structure.log": "structure",
    };

    const result = observeConstructorRealPreviewDiagnostic(createPreview({ fileContents }));

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "static-contract",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("content.md com marcador textual de FILE permanece unavailable", () => {
    const fileContents = {
      "content.md":
        "--- FILE: index.html ---\n<html><body>fake file marker</body></html>\n--- FILE: script.js ---\nconsole.log('x')",
    };

    const result = observeConstructorRealPreviewDiagnostic(createPreview({ fileContents }));

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("ordem de inferência segue index.js, index.mjs, index.html, content.md e fallback para primeira chave", () => {
    expect(
      inferEntrypointFromFileContents({
        "content.md": "# doc",
        "index.html": "<html></html>",
        "index.mjs": "export {}",
        "index.js": "console.log('ok')",
      }),
    ).toBe("index.js");

    expect(
      inferEntrypointFromFileContents({
        "content.md": "# doc",
        "index.html": "<html></html>",
        "index.mjs": "export {}",
      }),
    ).toBe("index.mjs");

    expect(
      inferEntrypointFromFileContents({
        "content.md": "# doc",
        "index.html": "<html></html>",
      }),
    ).toBe("index.html");

    expect(
      inferEntrypointFromFileContents({
        "content.md": "# doc",
        "docs/extra.md": "aux",
      }),
    ).toBe("content.md");

    expect(
      inferEntrypointFromFileContents({
        "lib/first.js": "module.exports = 1",
        "z-last.js": "module.exports = 2",
      }),
    ).toBe("lib/first.js");
  });

  test("summary inválido retorna unavailable do observador", () => {
    const result = observeConstructorRealPreviewDiagnostic({});

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-real-preview-diagnostic-observation: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason: "real-preview-summary-invalido",
      path: "summary",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("fileContents inválido, ausente ou vazio retorna unavailable", () => {
    expect(
      observeConstructorRealPreviewDiagnostic(createPreview({ fileContents: null })),
    ).toMatchObject({
      ok: false,
      status: "constructor-real-preview-diagnostic-observation: unavailable",
      verdict: "unavailable",
      reason: "real-preview-filecontents-invalido",
      path: "summary.fileContents",
    });

    expect(
      observeConstructorRealPreviewDiagnostic({
        summary: { id: "preview-artifact-001", version: "1.0.0" },
      }),
    ).toMatchObject({
      ok: false,
      status: "constructor-real-preview-diagnostic-observation: unavailable",
      verdict: "unavailable",
      reason: "real-preview-filecontents-invalido",
      path: "summary.fileContents",
    });

    expect(
      observeConstructorRealPreviewDiagnostic(createPreview({ fileContents: {} })),
    ).toMatchObject({
      ok: false,
      status: "constructor-real-preview-diagnostic-observation: unavailable",
      verdict: "unavailable",
      reason: "real-preview-filecontents-vazio",
      path: "summary.fileContents",
    });
  });

  test("id inválido retorna unavailable via adaptador in-memory", () => {
    const result = observeConstructorRealPreviewDiagnostic(createPreview({ id: "   " }));

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason: "inmemory-id-invalido",
      path: "id",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("version inválido retorna unavailable via adaptador in-memory", () => {
    const result = observeConstructorRealPreviewDiagnostic(
      createPreview({ version: "   " }),
    );

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason: "inmemory-version-invalido",
      path: "version",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("campos proibidos extras são ignorados e não vazam no retorno", () => {
    const result = observeConstructorRealPreviewDiagnostic({
      contentPreview: "conteúdo bruto",
      zipBase64: "UEsDBAoAAAAAA",
      agentMessage: { content: "payload cru" },
      delivery: { preview: "bruto" },
      preview: { raw: true },
      summary: createPreviewSummary({
        files: [{ path: "content.md" }],
        entrypoint: "content.md",
        fileContents: {
          "index.js": "console.log('ok')",
          "lib/sum.js": "module.exports = { sum: () => 1 }",
        },
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("higiene do módulo: sem fetch/api/storage/execução/UI proibidos", () => {
    const modulePath = fileURLToPath(
      new URL("../constructorRealPreviewDiagnosticObservation.js", import.meta.url),
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
    expect(moduleSource).not.toContain(".jsx");
  });
});
