import fs from "node:fs";
import { readApprovedPreviewDiagnosticFromExplicitSnapshot } from "../constructorApprovedPreviewDiagnosticReader.js";

function createAllowlistedRawContent() {
  return [
    "--- FILE: index.js ---",
    "const { sum } = require('./lib/sum.js');",
    "console.log(sum([1,2,3]));",
    "",
    "--- FILE: lib/sum.js ---",
    "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
  ].join("\n");
}

function expectVerdictOnlyWithoutPayloadLeak(result) {
  expect(result).not.toHaveProperty("rawContent");
  expect(result).not.toHaveProperty("artifact");
  expect(result).not.toHaveProperty("files");
}

describe("constructorApprovedPreviewDiagnosticReader", () => {
  describe("caracterização PR #601 (reader/allowlist/entrypoint)", () => {
    test("Caso A — HTML/CSS/JS simples permanece unavailable por entrypoint não permitido no contrato atual", () => {
      const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
        rawContent: [
          "--- FILE: index.html ---",
          "<html><head><link rel='stylesheet' href='styles.css'></head><body><script src='script.js'></script></body></html>",
          "--- FILE: styles.css ---",
          "body{font-family:sans-serif;}",
          "--- FILE: script.js ---",
          "console.log('ok');",
        ].join("\n"),
        id: "preview-artifact-601-a",
        version: "1.0.0",
        entrypoint: "index.html",
      });

      expect(result).toMatchObject({
        ok: false,
        status: "constructor-approved-preview-diagnostic-reader: unavailable",
        verdict: "unavailable",
        stage: "builder",
        reason: "entrypoint-nao-permitido",
      });
      expectVerdictOnlyWithoutPayloadLeak(result);
    });

    test("Caso B — JS puro (index.js) é elegível sem package.json obrigatório", () => {
      const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
        rawContent: ["--- FILE: index.js ---", "console.log('ok');"].join("\n"),
        id: "preview-artifact-601-b",
        version: "1.0.0",
        entrypoint: "index.js",
      });

      expect(result).toMatchObject({
        ok: true,
        status: "constructor-approved-preview-diagnostic-reader: eligible",
        verdict: "eligible",
        stage: "builder",
      });
      expectVerdictOnlyWithoutPayloadLeak(result);
    });

    test("Caso C — JS com auxiliar (index.js + lib/helpers.js) é elegível", () => {
      const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
        rawContent: [
          "--- FILE: index.js ---",
          "const { sum } = require('./lib/helpers.js');",
          "console.log(sum(1,2));",
          "--- FILE: lib/helpers.js ---",
          "function sum(a,b){return a+b;}module.exports={sum};",
        ].join("\n"),
        id: "preview-artifact-601-c",
        version: "1.0.0",
        entrypoint: "index.js",
      });

      expect(result).toMatchObject({
        ok: true,
        status: "constructor-approved-preview-diagnostic-reader: eligible",
        verdict: "eligible",
        stage: "builder",
      });
      expectVerdictOnlyWithoutPayloadLeak(result);
    });

    test("Caso D — package.json com dependência externa continua unavailable", () => {
      const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
        rawContent: [
          "--- FILE: package.json ---",
          JSON.stringify({
            name: "express-app",
            version: "1.0.0",
            dependencies: { express: "^4.19.2" },
          }),
          "--- FILE: index.js ---",
          "const express = require('express');",
          "--- FILE: lib/utils.js ---",
          "module.exports={ok:true};",
        ].join("\n"),
        id: "preview-artifact-601-d",
        version: "1.0.0",
        entrypoint: "index.js",
      });

      expect(result).toMatchObject({
        ok: false,
        status: "constructor-approved-preview-diagnostic-reader: unavailable",
        verdict: "unavailable",
        stage: "builder",
        reason: "dependencias-externas-nao-permitidas",
      });
      expectVerdictOnlyWithoutPayloadLeak(result);
    });

    test("Caso E — conteúdo preso em content.md com marcador textual não mascara eligible", () => {
      const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
        rawContent: [
          "--- FILE: content.md ---",
          "# Exemplo",
          "```txt",
          " --- FILE: index.js ---",
          " console.log('x');",
          "```",
        ].join("\n"),
        id: "preview-artifact-601-e",
        version: "1.0.0",
        entrypoint: "index.js",
      });

      expect(result).toMatchObject({
        ok: false,
        status: "constructor-approved-preview-diagnostic-reader: unavailable",
        verdict: "unavailable",
        stage: "builder",
        reason: "arquivo-fora-da-allowlist",
      });
      expectVerdictOnlyWithoutPayloadLeak(result);
    });
  });

  test("snapshot documental realista retorna unavailable sem expor payload bruto", () => {
    const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
      rawContent: ["--- FILE: content.md ---", "# Documento", "", "--- FILE: index.html ---", "<html><body>doc</body></html>"].join(
        "\n"
      ),
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.html",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: "builder",
      reason: expect.any(String),
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("snapshot allowlistado futuro pode retornar eligible sem expor artifact/files/rawContent", () => {
    const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
      rawContent: createAllowlistedRawContent(),
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test.each([
    [null, "diagnostic-snapshot-invalido"],
    [[], "diagnostic-snapshot-invalido"],
    ["x", "diagnostic-snapshot-invalido"],
    [{}, "derivation-rawcontent-invalido"],
  ])("snapshot inválido (%p) retorna unavailable em stage input", (snapshot, reason) => {
    const result = readApprovedPreviewDiagnosticFromExplicitSnapshot(snapshot);

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason,
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test.each([
    [{ id: "preview-artifact-001", version: "1.0.0", entrypoint: "index.js" }, "derivation-rawcontent-invalido", "rawContent"],
    [{ rawContent: 123, id: "preview-artifact-001", version: "1.0.0", entrypoint: "index.js" }, "derivation-rawcontent-invalido", "rawContent"],
    [{ rawContent: createAllowlistedRawContent(), version: "1.0.0", entrypoint: "index.js" }, "derivation-id-invalido", "id"],
    [{ rawContent: createAllowlistedRawContent(), id: "preview-artifact-001", entrypoint: "index.js" }, "derivation-version-invalido", "version"],
    [{ rawContent: createAllowlistedRawContent(), id: "preview-artifact-001", version: "1.0.0" }, "derivation-entrypoint-invalido", "entrypoint"],
  ])("campos inválidos propagam reason do derivador (%s)", (snapshot, reason, path) => {
    const result = readApprovedPreviewDiagnosticFromExplicitSnapshot(snapshot);

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason,
      path,
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("conteúdo sem delimitador multi-file retorna unavailable com reason do parser", () => {
    const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
      rawContent: "apenas texto corrido",
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-approved-preview-diagnostic-reader: unavailable",
      verdict: "unavailable",
      stage: "parser",
      reason: "multifile-sem-delimitadores",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("conteúdo perigoso downstream é rejeitado no builder sem vazar payload", () => {
    const apiPath = "/" + "api" + "/preview";
    const storageSession = "session" + "Storage";
    const storageLocal = "local" + "Storage";
    const authToken = "bear" + "er";
    const passwordLabel = "pass" + "word";
    const secretLabel = "sec" + "ret";
    const apiKeyLabel = "api" + "Key";
    const authorizationLabel = "authoriz" + "ation";

    const result = readApprovedPreviewDiagnosticFromExplicitSnapshot({
      rawContent: [
        "--- FILE: index.js ---",
        "fe" + "tch('" + apiPath + "');",
        storageSession + ".getItem('k');",
        storageLocal + ".getItem('k');",
        "const " + authToken + " = 'x';",
        "const " + passwordLabel + " = 'x';",
        "const " + secretLabel + " = 'x';",
        "const " + apiKeyLabel + " = 'x';",
        "const " + authorizationLabel + " = 'x';",
      ].join("\n"),
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

  test("higiene do novo módulo: fonte não contém tokens proibidos", () => {
    const source = fs.readFileSync(new URL("../constructorApprovedPreviewDiagnosticReader.js", import.meta.url), "utf8");

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
    const unavailable = readApprovedPreviewDiagnosticFromExplicitSnapshot({
      rawContent: "sem delimitadores",
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    const eligible = readApprovedPreviewDiagnosticFromExplicitSnapshot({
      rawContent: createAllowlistedRawContent(),
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    for (const result of [unavailable, eligible]) {
      expect(result.rawPayloadAccessed).toBe(false);
      expect(result.apiUsed).toBe(false);
      expect(result.storageUsed).toBe(false);
      expect(result.executeArtifactServerSide).toBe("disabled");
    }
  });
});
