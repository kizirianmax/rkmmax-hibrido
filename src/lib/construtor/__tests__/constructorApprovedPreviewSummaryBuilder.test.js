import fs from "node:fs";
import { jest } from "@jest/globals";
import { buildConstructorApprovedPreviewSummaryFromStructuredFiles } from "../constructorApprovedPreviewSummaryBuilder.js";
import { selectConstructorApprovedArtifactSnapshotInput } from "../constructorApprovedArtifactPreviewSelector.js";

function createStructuredInput(overrides = {}) {
  return {
    id: "preview-artifact-001",
    version: "1.0.0",
    entrypoint: "index.js",
    files: [
      {
        name: "index.js",
        body: "const { sum } = require('./lib/sum.js');\\nconsole.log(sum([1,2,3]));",
      },
      {
        name: "lib/sum.js",
        body: "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
      },
    ],
    origin: {
      specialist: "hybrid",
      model: "safe-model",
      promptId: "safe-prompt",
    },
    ...overrides,
  };
}

function createPreviewSummaryFromStructuredInput(input) {
  return {
    id: input.id,
    version: input.version,
    entrypoint: input.entrypoint,
    fileContents: Object.fromEntries(input.files.map((file) => [file.name, file.body])),
    ...(Object.prototype.hasOwnProperty.call(input, "origin") ? { origin: input.origin } : {}),
  };
}

describe("constructorApprovedPreviewSummaryBuilder", () => {
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
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: originalSessionStorage });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalLocalStorage });
    jest.restoreAllMocks();
  });

  test("aceita arquivos estruturados allowlistados (index.js + lib/*.js)", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-summary-builder: eligible",
      sourceType: "constructor-structured-files-client-safe-source",
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
  });

  test("artifact resultante é coerente com contrato #581", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());

    expect(result.ok).toBe(true);
    expect(result.artifact).toMatchObject({
      id: "preview-artifact-001",
      version: "1.0.0",
      approval: {
        status: "approved",
        source: "constructor-human-review",
      },
      entrypoint: "index.js",
      files: {
        "index.js": expect.any(String),
        "lib/sum.js": expect.any(String),
      },
      manifest: {
        contentType: "application/vnd.rkmmax.constructor-approved-artifact+json",
        origin: {
          specialist: "hybrid",
          model: "safe-model",
          promptId: "safe-prompt",
        },
      },
    });
  });

  test("resultado é consistente com selectConstructorApprovedArtifactSnapshotInput #586", () => {
    const input = createStructuredInput();
    const builderResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles(input);
    const selectorResult = selectConstructorApprovedArtifactSnapshotInput(
      createPreviewSummaryFromStructuredInput(input),
      "approved"
    );

    expect(builderResult.ok).toBe(true);
    expect(selectorResult.ok).toBe(true);
    expect(builderResult.artifact).toEqual(selectorResult.artifact);
  });

  test("rejeita content.md (fora da allowlist)", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "content.md", body: "# documentação" }] })
    );

    expect(result).toMatchObject({ ok: false, reason: "arquivo-fora-da-allowlist" });
  });

  test("rejeita index.html (fora da allowlist)", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "index.html", body: "<html></html>" }] })
    );

    expect(result).toMatchObject({ ok: false, reason: "arquivo-fora-da-allowlist" });
  });

  test("rejeita input sem files", () => {
    const input = createStructuredInput();
    delete input.files;

    expect(buildConstructorApprovedPreviewSummaryFromStructuredFiles(input)).toMatchObject({
      ok: false,
      reason: "structured-input-sem-files",
      path: "files",
    });
  });

  test("rejeita files que não seja array", () => {
    expect(buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ files: {} }))).toMatchObject({
      ok: false,
      reason: "structured-input-files-invalido",
      path: "files",
    });
  });

  test("rejeita arquivo sem name", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ files: [{ body: "module.exports={}" }] }))
    ).toMatchObject({
      ok: false,
      reason: "structured-file-sem-name",
      path: "files[0].name",
    });
  });

  test("rejeita arquivo sem body", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ files: [{ name: "index.js" }] }))
    ).toMatchObject({
      ok: false,
      reason: "structured-file-sem-body",
      path: "files[0].body",
    });
  });

  test("rejeita path traversal", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "../escape.js", body: "console.log('x')" }] })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "caminho-perigoso",
      path: "../escape.js",
    });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "src/main.js", body: "console.log('x')" }] })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
      path: "src/main.js",
    });
  });

  test("rejeita content", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ content: "raw" }))
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "content",
    });
  });

  test("rejeita contentPreview", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ contentPreview: "raw" }))
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "contentPreview",
    });
  });

  test("rejeita zipBase64", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ zipBase64: "raw" }))
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "zipBase64",
    });
  });

  test("rejeita user_email", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ user_email: "safe@example.com" }))
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "user_email",
    });
  });

  test("rejeita agentMessage.content", () => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(
        createStructuredInput({ agentMessage: { content: "raw output" } })
      )
    ).toMatchObject({
      ok: false,
      reason: "campo-agentmessage-content-nao-permitido",
      path: "agentMessage.content",
    });
  });

  test.each(["rawPayload", "payloadRaw", "realPayload", "payloadBruto"])("rejeita %s", (field) => {
    expect(
      buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput({ [field]: "raw" }))
    ).toMatchObject({
      ok: false,
      reason: "payload-bruto-nao-permitido",
      path: field,
    });
  });

  test("rejeita token/secret aninhado", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ origin: { metadata: { auth: { token: "x" } } } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "campo-sensivel-nao-permitido",
      path: "origin.metadata.auth.token",
    });
  });

  test("rejeita /api/ em string", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "index.js", body: "fetch('/api/artifact-preview')" }] })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "api-ou-rede-nao-permitida",
      path: "files[0].body",
    });
  });

  test("rejeita sessionStorage em string/chave", () => {
    const stringResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "index.js", body: "sessionStorage.getItem('x')" }] })
    );
    const keyResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ origin: { sessionStorage: true } })
    );

    expect(stringResult).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
      path: "files[0].body",
    });
    expect(keyResult).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
      path: "origin.sessionStorage",
    });
  });

  test("rejeita localStorage em string/chave", () => {
    const stringResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ files: [{ name: "index.js", body: "localStorage.getItem('x')" }] })
    );
    const keyResult = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ origin: { localStorage: true } })
    );

    expect(stringResult).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
      path: "files[0].body",
    });
    expect(keyResult).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
      path: "origin.localStorage",
    });
  });

  test("rejeita backend", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ origin: { backend: { endpoint: "internal" } } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "dependencia-backend-nao-permitida",
      path: "origin.backend",
    });
  });

  test("rejeita executeArtifact", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ origin: { executeArtifact: true } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "execucao-server-side-nao-permitida",
      path: "origin.executeArtifact",
    });
  });

  test("não chama fetch", () => {
    buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("não acessa sessionStorage", () => {
    buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());
    expect(sessionStorageGetter).not.toHaveBeenCalled();
  });

  test("não acessa localStorage", () => {
    buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());
    expect(localStorageGetter).not.toHaveBeenCalled();
  });

  test("não chama WebContainer.boot", () => {
    buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
  });

  test("não chama executeArtifact", () => {
    buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
  });

  test("não importa/chama handoff #582", () => {
    const builderFile = fs.readFileSync(
      new URL("../constructorApprovedPreviewSummaryBuilder.js", import.meta.url),
      "utf8"
    );

    expect(builderFile).not.toContain("approvedConstructorArtifactHandoff");
    expect(builderFile).not.toContain("prepareApprovedConstructorArtifactForWebContainer");
  });

  test("não gera mountTree", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(createStructuredInput());
    const builderFile = fs.readFileSync(
      new URL("../constructorApprovedPreviewSummaryBuilder.js", import.meta.url),
      "utf8"
    );

    expect(result).not.toHaveProperty("mountTree");
    expect(globalThis.mountTree).not.toHaveBeenCalled();
    expect(builderFile).not.toContain("mountTree");
  });

  test("retorno unavailable não expõe valor sensível", () => {
    const result = buildConstructorApprovedPreviewSummaryFromStructuredFiles(
      createStructuredInput({ content: "const superSensitive='x'" })
    );
    const publicJson = JSON.stringify(result);

    expect(result.ok).toBe(false);
    expect(result.status).toBe("constructor-approved-preview-summary-builder: unavailable");
    expect(result.reason).not.toContain("superSensitive");
    expect(result.status).not.toContain("superSensitive");
    expect(publicJson).not.toContain("superSensitive");
  });
});
