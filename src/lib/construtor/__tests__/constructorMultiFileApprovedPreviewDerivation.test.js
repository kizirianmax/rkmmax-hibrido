import fs from "node:fs";
import { deriveConstructorApprovedPreviewFromMultiFileContent } from "../constructorMultiFileApprovedPreviewDerivation.js";

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

describe("constructorMultiFileApprovedPreviewDerivation", () => {
  test("conteúdo documental realista permanece unavailable sem transformação para runnable", () => {
    const result = deriveConstructorApprovedPreviewFromMultiFileContent({
      rawContent: [
        "--- FILE: content.md ---",
        "# Documento",
        "",
        "--- FILE: index.html ---",
        "<html><body>doc</body></html>",
      ].join("\n"),
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.html",
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("constructor-multifile-approved-preview-derivation: unavailable");
    expect(result.stage).toBe("builder");
    expect(result.reason).toBeTruthy();
  });

  test("conteúdo allowlistado futuro pode chegar a eligible via contratos existentes", () => {
    const result = deriveConstructorApprovedPreviewFromMultiFileContent({
      rawContent: createAllowlistedRawContent(),
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-multifile-approved-preview-derivation: eligible",
      stage: "builder",
    });
    expect(result.artifact).toMatchObject({
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
      files: {
        "index.js": expect.any(String),
        "lib/sum.js": expect.any(String),
      },
    });
  });

  test.each([undefined, 123, {}, []])(
    "entrada inválida (%p) retorna unavailable por validação de input sem parse",
    (rawContent) => {
      const result = deriveConstructorApprovedPreviewFromMultiFileContent({
        rawContent,
        id: "preview-artifact-001",
        version: "1.0.0",
        entrypoint: "index.js",
      });

      expect(result).toMatchObject({
        ok: false,
        status: "constructor-multifile-approved-preview-derivation: unavailable",
        stage: "input",
        reason: "derivation-rawcontent-invalido",
        path: "rawContent",
      });
    }
  );

  test("string sem delimitador multi-file retorna unavailable propagando reason do parser", () => {
    const result = deriveConstructorApprovedPreviewFromMultiFileContent({
      rawContent: "apenas texto corrido",
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-multifile-approved-preview-derivation: unavailable",
      stage: "parser",
      reason: "multifile-sem-delimitadores",
    });
  });

  test("conteúdo perigoso downstream é rejeitado no builder", () => {
    const apiPath = "/" + "api" + "/preview";
    const storageSession = "session" + "Storage";
    const storageLocal = "local" + "Storage";
    const authToken = "bear" + "er";
    const passwordLabel = "pass" + "word";
    const secretLabel = "sec" + "ret";

    const result = deriveConstructorApprovedPreviewFromMultiFileContent({
      rawContent: [
        "--- FILE: index.js ---",
        "fe" + "tch('" + apiPath + "');",
        storageSession + ".getItem('k');",
        storageLocal + ".getItem('k');",
        "const " + authToken + " = 'x';",
        "const " + passwordLabel + " = 'x';",
        "const " + secretLabel + " = 'x';",
      ].join("\n"),
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-multifile-approved-preview-derivation: unavailable",
      stage: "builder",
      reason: "api-ou-rede-nao-permitida",
      path: "files[0].body",
    });
  });

  test("higiene do módulo: fonte não contém tokens proibidos", () => {
    const source = fs.readFileSync(new URL("../constructorMultiFileApprovedPreviewDerivation.js", import.meta.url), "utf8");

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

  test("invariantes de segurança são preservados em unavailable e eligible", () => {
    const unavailable = deriveConstructorApprovedPreviewFromMultiFileContent({
      rawContent: "sem delimitadores",
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
    });

    const eligible = deriveConstructorApprovedPreviewFromMultiFileContent({
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
