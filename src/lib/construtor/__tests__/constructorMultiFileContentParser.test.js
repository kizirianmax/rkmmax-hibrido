import fs from "node:fs";
import { jest } from "@jest/globals";
import { parseConstructorMultiFileContentToStructuredFiles } from "../constructorMultiFileContentParser.js";
import { buildConstructorApprovedPreviewSummaryFromStructuredFiles } from "../constructorApprovedPreviewSummaryBuilder.js";

function createSafeMultiFileContent() {
  return [
    "--- FILE: index.js ---",
    "const { sum } = require('./lib/sum.js');",
    "console.log(sum([1,2,3]));",
    "",
    "--- FILE: lib/sum.js ---",
    "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
  ].join("\n");
}

describe("constructorMultiFileContentParser", () => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  const originalLocalStorage = globalThis.localStorage;
  const originalExecuteArtifact = globalThis.executeArtifact;
  const originalWebContainer = globalThis.WebContainer;
  const originalMountTree = globalThis.mountTree;
  let sessionStorageGetter;
  let localStorageGetter;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
    globalThis.executeArtifact = jest.fn();
    globalThis.WebContainer = { boot: jest.fn() };
    globalThis.mountTree = jest.fn();
    sessionStorageGetter = jest.fn(() => {
      throw new Error("sessionStorage should not be accessed");
    });
    localStorageGetter = jest.fn(() => {
      throw new Error("localStorage should not be accessed");
    });

    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: sessionStorageGetter,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: localStorageGetter,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.executeArtifact = originalExecuteArtifact;
    globalThis.WebContainer = originalWebContainer;
    globalThis.mountTree = originalMountTree;
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: originalSessionStorage,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    jest.restoreAllMocks();
  });

  test("aceita um único arquivo no formato --- FILE: index.js ---", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-multifile-parser: parsed",
      sourceType: "constructor-multifile-content-client-safe-source",
      fileCount: 1,
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expect(result.files).toEqual([{ name: "index.js", body: "console.log('ok')" }]);
  });

  test("aceita múltiplos arquivos e preserva ordem", () => {
    const input = [
      "--- FILE: index.js ---",
      "console.log('index');",
      "--- FILE: lib/a.js ---",
      "module.exports='a';",
      "--- FILE: lib/b.js ---",
      "module.exports='b';",
    ].join("\n");

    const result = parseConstructorMultiFileContentToStructuredFiles(input);

    expect(result.ok).toBe(true);
    expect(result.files.map((file) => file.name)).toEqual(["index.js", "lib/a.js", "lib/b.js"]);
  });

  test("aceita nomes documentais no parser sem decidir elegibilidade", () => {
    const input = [
      "--- FILE: content.md ---",
      "# Doc",
      "--- FILE: index.html ---",
      "<html></html>",
    ].join("\n");

    const result = parseConstructorMultiFileContentToStructuredFiles(input);

    expect(result.ok).toBe(true);
    expect(result.files).toEqual([
      { name: "content.md", body: "# Doc" },
      { name: "index.html", body: "<html></html>" },
    ]);
  });

  test("downstream: content.md/index.html continuam unavailable no builder #589", () => {
    const parserResult = parseConstructorMultiFileContentToStructuredFiles(
      [
        "--- FILE: content.md ---",
        "# Doc",
        "--- FILE: index.html ---",
        "<html></html>",
      ].join("\n")
    );

    const downstreamResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles({
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
      files: parserResult.files,
      origin: {
        specialist: "hybrid",
        model: "safe-model",
        promptId: "safe-prompt",
      },
    });

    expect(parserResult.ok).toBe(true);
    expect(downstreamResult).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
    });
  });

  test("aceita index.js + lib/sum.js como shape parseado", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles(createSafeMultiFileContent());

    expect(result.ok).toBe(true);
    expect(result.files).toEqual([
      {
        name: "index.js",
        body: "const { sum } = require('./lib/sum.js');\nconsole.log(sum([1,2,3]));",
      },
      {
        name: "lib/sum.js",
        body: "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
      },
    ]);
  });

  test("downstream: index.js + lib/sum.js pode chegar a eligible no builder #589", () => {
    const parserResult = parseConstructorMultiFileContentToStructuredFiles(createSafeMultiFileContent());

    const downstreamResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles({
      id: "preview-artifact-001",
      version: "1.0.0",
      entrypoint: "index.js",
      files: parserResult.files,
      origin: {
        specialist: "hybrid",
        model: "safe-model",
        promptId: "safe-prompt",
      },
    });

    expect(parserResult.ok).toBe(true);
    expect(downstreamResult).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-summary-builder: eligible",
    });
  });

  test.each([123, null, undefined, {}, []])(
    "rejeita input não-string (%p) com multifile-input-invalido",
    (value) => {
      expect(parseConstructorMultiFileContentToStructuredFiles(value)).toMatchObject({
        ok: false,
        reason: "multifile-input-invalido",
      });
    }
  );

  test("rejeita string sem delimitadores FILE", () => {
    expect(parseConstructorMultiFileContentToStructuredFiles("apenas texto")).toMatchObject({
      ok: false,
      reason: "multifile-sem-delimitadores",
    });
  });

  test("rejeita nome vazio", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE:    ---\nconsole.log('x')");

    expect(result).toMatchObject({ ok: false, reason: "multifile-nome-invalido" });
  });

  test("rejeita body vazio", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\n   ");

    expect(result).toMatchObject({ ok: false, reason: "multifile-body-vazio" });
  });

  test("rejeita path traversal com ../", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: ../escape.js ---\nconsole.log('x')");

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "../escape.js" });
  });

  test("rejeita path traversal com segmento ..", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: .. ---\nconsole.log('x')");

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: ".." });
  });

  test("rejeita path absoluto", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: /etc/passwd ---\nroot:x");

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "/etc/passwd" });
  });

  test("rejeita separador duplicado perigoso", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: a//b.js ---\nconsole.log('x')");

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "a//b.js" });
  });

  test("não chama fetch", () => {
    parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("não acessa sessionStorage", () => {
    parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");
    expect(sessionStorageGetter).not.toHaveBeenCalled();
  });

  test("não acessa localStorage", () => {
    parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");
    expect(localStorageGetter).not.toHaveBeenCalled();
  });

  test("não chama WebContainer.boot", () => {
    parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
  });

  test("não chama executeArtifact", () => {
    parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
  });

  test("não importa/chama approvedConstructorArtifactHandoff", () => {
    const parserFile = fs.readFileSync(new URL("../constructorMultiFileContentParser.js", import.meta.url), "utf8");

    expect(parserFile).not.toContain("approvedConstructorArtifactHandoff");
    expect(parserFile).not.toContain("prepareApprovedConstructorArtifactForWebContainer");
  });

  test("não gera mountTree", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles("--- FILE: index.js ---\nconsole.log('ok')");
    const parserFile = fs.readFileSync(new URL("../constructorMultiFileContentParser.js", import.meta.url), "utf8");

    expect(result).not.toHaveProperty("mountTree");
    expect(globalThis.mountTree).not.toHaveBeenCalled();
    expect(parserFile).not.toContain("mountTree");
  });

  test("retorno unavailable não expõe payload sensível desnecessário", () => {
    const result = parseConstructorMultiFileContentToStructuredFiles(
      [
        "--- FILE: index.js ---",
        "const superSensitive='x';",
        "--- FILE: empty.js ---",
        "   ",
      ].join("\n")
    );

    const publicJson = JSON.stringify(result);

    expect(result.ok).toBe(false);
    expect(result.status).toBe("constructor-multifile-parser: unavailable");
    expect(publicJson).not.toContain("superSensitive");
  });

  test("módulo é autocontido e não referencia HybridAgentSimple/React/JSX", () => {
    const parserFile = fs.readFileSync(new URL("../constructorMultiFileContentParser.js", import.meta.url), "utf8");

    expect(parserFile).not.toContain("HybridAgentSimple");
    expect(parserFile).not.toMatch(/^\\s*import\\s/m);
    expect(parserFile).not.toContain("require(");
    expect(parserFile).not.toContain("from \"react\"");
    expect(parserFile).not.toContain("from 'react'");
    expect(parserFile).not.toContain("return <");
  });
});
