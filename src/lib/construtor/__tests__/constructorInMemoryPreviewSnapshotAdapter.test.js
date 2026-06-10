import fs from "node:fs";
import { readApprovedPreviewDiagnosticFromInMemoryPreview } from "../constructorInMemoryPreviewSnapshotAdapter.js";

function createAllowlistedPreview() {
  return {
    fileContents: {
      "index.js": "const { sum } = require('./lib/sum.js');\nconsole.log(sum([1, 2, 3]));",
      "lib/sum.js": "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
    },
    id: "preview-artifact-001",
    version: "1.0.0",
    entrypoint: "index.js",
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
}

describe("constructorInMemoryPreviewSnapshotAdapter", () => {
  test("preview documental realista retorna unavailable sem expor payload bruto", () => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview({
      fileContents: {
        "content.md": "# Documento",
        "index.html": "<html><body>doc</body></html>",
      },
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.html",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: expect.any(String),
      reason: expect.any(String),
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("preview allowlistado futuro pode retornar eligible sem vazamento de payload", () => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview(createAllowlistedPreview());

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("preview sem entrypoint retorna unavailable em stage input", () => {
    const allowlisted = createAllowlistedPreview();
    delete allowlisted.entrypoint;

    const result = readApprovedPreviewDiagnosticFromInMemoryPreview(allowlisted);
    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason: "inmemory-entrypoint-invalido",
      path: "entrypoint",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test.each([
    [null, "inmemory-preview-invalido", undefined],
    [[], "inmemory-preview-invalido", undefined],
    ["x", "inmemory-preview-invalido", undefined],
    [{}, "inmemory-filecontents-invalido", "fileContents"],
  ])("preview inválido (%p) retorna unavailable", (preview, reason, path) => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview(preview);

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason,
      ...(path ? { path } : {}),
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test.each([
    [{ id: "preview-artifact-001", version: "1.0.0", entrypoint: "index.js" }, "inmemory-filecontents-invalido"],
    [{ fileContents: [], id: "preview-artifact-001", version: "1.0.0", entrypoint: "index.js" }, "inmemory-filecontents-invalido"],
    [{ fileContents: "x", id: "preview-artifact-001", version: "1.0.0", entrypoint: "index.js" }, "inmemory-filecontents-invalido"],
    [{ fileContents: {}, id: "preview-artifact-001", version: "1.0.0", entrypoint: "index.js" }, "inmemory-filecontents-vazio"],
  ])("fileContents inválido (%j) retorna unavailable", (preview, reason) => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview(preview);

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason,
      path: "fileContents",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test.each([
    [{ fileContents: { "index.js": "console.log('ok');" }, version: "1.0.0", entrypoint: "index.js" }, "inmemory-id-invalido", "id"],
    [{ fileContents: { "index.js": "console.log('ok');" }, id: "preview-artifact-001", entrypoint: "index.js" }, "inmemory-version-invalido", "version"],
    [{ fileContents: { "index.js": "console.log('ok');" }, id: "preview-artifact-001", version: "1.0.0" }, "inmemory-entrypoint-invalido", "entrypoint"],
  ])("campos inválidos retornam unavailable (%j)", (preview, reason, path) => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview(preview);

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason,
      path,
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("fileContents com valor não-string retorna unavailable sem fabricar conteúdo", () => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview({
      fileContents: {
        "index.js": 123,
      },
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-inmemory-preview-snapshot-adapter: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason: "inmemory-filecontent-nao-string",
      path: "fileContents",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("conteúdo perigoso downstream é rejeitado no builder sem vazar payload", () => {
    const apiPath = "/" + "api" + "/preview";
    const storageSession = "session" + "Storage";
    const storageLocal = "local" + "Storage";
    const authToken = "bear" + "er";
    const tokenLabel = "to" + "ken";
    const passwordLabel = "pass" + "word";
    const secretLabel = "sec" + "ret";
    const apiKeyLabel = "api" + "Key";
    const authorizationLabel = "authoriz" + "ation";

    const result = readApprovedPreviewDiagnosticFromInMemoryPreview({
      fileContents: {
        "index.js": [
          "fe" + "tch('" + apiPath + "');",
          storageSession + ".getItem('k');",
          storageLocal + ".getItem('k');",
          "const " + authToken + " = 'x';",
          "const " + tokenLabel + " = 'x';",
          "const " + secretLabel + " = 'x';",
          "const " + apiKeyLabel + " = 'x';",
          "const " + passwordLabel + " = 'x';",
          "const " + authorizationLabel + " = 'x';",
        ].join("\n"),
      },
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: "builder",
      reason: "api-ou-rede-nao-permitida",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("campos proibidos extras são ignorados e não vazam no retorno", () => {
    const result = readApprovedPreviewDiagnosticFromInMemoryPreview({
      ...createAllowlistedPreview(),
      contentPreview: "preview bruto",
      zipBase64: "UEsDBAoAAAAAA",
      agentMessage: { content: "conteúdo cru" },
      delivery: { mode: "raw" },
      preview: { preview: true },
    });

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
    });
    expect(result).not.toHaveProperty("agentMessage");
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("higiene do novo módulo: fonte não contém tokens proibidos", () => {
    const source = fs.readFileSync(new URL("../constructorInMemoryPreviewSnapshotAdapter.js", import.meta.url), "utf8");

    const forbiddenTokens = [
      "fe" + "tch",
      "/a" + "pi/",
      "session" + "Storage",
      "local" + "Storage",
      "Web" + "Container.boot",
      "execute" + "Artifact",
      "mount" + "Tree",
      "zip" + "Base64",
      "content" + "Preview",
      "agent" + "Message.content",
      "Hybrid" + "AgentSimple",
      "<" + "div",
      "<" + "span",
      "<" + "Fragment",
    ];

    for (const forbidden of forbiddenTokens) {
      expect(source).not.toContain(forbidden);
    }

    expect(source).not.toMatch(/return\s*</);
  });

  test("invariantes de segurança são preservadas em unavailable e eligible", () => {
    const unavailable = readApprovedPreviewDiagnosticFromInMemoryPreview({
      fileContents: {
        "content.md": "# Documento",
      },
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "content.md",
    });

    const eligible = readApprovedPreviewDiagnosticFromInMemoryPreview(createAllowlistedPreview());

    for (const result of [unavailable, eligible]) {
      expect(result.rawPayloadAccessed).toBe(false);
      expect(result.apiUsed).toBe(false);
      expect(result.storageUsed).toBe(false);
      expect(result.executeArtifactServerSide).toBe("disabled");
    }
  });
});
