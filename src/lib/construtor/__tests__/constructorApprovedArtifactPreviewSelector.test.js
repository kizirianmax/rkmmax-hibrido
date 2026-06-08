import fs from "node:fs";
import { jest } from "@jest/globals";
import { selectConstructorApprovedArtifactSnapshotInput } from "../constructorApprovedArtifactPreviewSelector.js";
import { buildConstructorApprovedArtifactMemorySnapshot } from "../constructorApprovedArtifactMemorySnapshot.js";
import { validateApprovedConstructorArtifact } from "../approvedConstructorArtifactContract.js";

function createApprovedPreviewSummary(overrides = {}) {
  return {
    id: "preview-artifact-001",
    version: "1.0.0",
    entrypoint: "index.js",
    fileContents: {
      "index.js": "const { sum } = require('./lib/sum.js');\\nconsole.log(sum([1,2,3]));",
      "lib/sum.js": "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
    },
    origin: {
      specialist: "hybrid",
      model: "safe-model",
      promptId: "safe-prompt",
    },
    ...overrides,
  };
}

function createEquivalentMemorySnapshotInput(previewSummary) {
  return {
    id: previewSummary.id,
    version: previewSummary.version,
    approval: {
      status: "approved",
      source: "constructor-human-review",
    },
    entrypoint: previewSummary.entrypoint,
    files: previewSummary.fileContents,
    manifest: {
      ...(previewSummary.origin === undefined ? {} : { origin: previewSummary.origin }),
      contentType: "application/vnd.rkmmax.constructor-approved-artifact+json",
    },
  };
}

describe("constructorApprovedArtifactPreviewSelector", () => {
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

  test("aceita preview summary futuro client-safe allowlistado + decision approved", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-artifact-preview-selector: eligible",
      sourceType: "constructor-preview-summary-client-safe-source",
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
  });

  test("artifact resultante passa em validateApprovedConstructorArtifact", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");

    expect(result.ok).toBe(true);
    expect(validateApprovedConstructorArtifact(result.artifact)).toEqual({ ok: true });
  });

  test("selector delega ao #585 e mantém artifact consistente", () => {
    const previewSummary = createApprovedPreviewSummary();
    const selectorResult = selectConstructorApprovedArtifactSnapshotInput(previewSummary, "approved");
    const memoryResult = buildConstructorApprovedArtifactMemorySnapshot(
      createEquivalentMemorySnapshotInput(previewSummary)
    );

    expect(selectorResult.ok).toBe(true);
    expect(memoryResult.ok).toBe(true);
    expect(selectorResult.artifact).toEqual(memoryResult.artifact);
  });

  test.each(["pending", "rejected", undefined])("rejeita decision !== approved (%s)", (decision) => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), decision)
    ).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-preview-selector: unavailable",
      reason: "decisao-nao-aprovada",
    });
  });

  test("rejeita preview sem fileContents", () => {
    const previewSummary = createApprovedPreviewSummary();
    delete previewSummary.fileContents;

    expect(selectConstructorApprovedArtifactSnapshotInput(previewSummary, "approved")).toMatchObject({
      ok: false,
      reason: "preview-sem-filecontents",
    });
  });

  test("rejeita preview sem entrypoint", () => {
    const previewSummary = createApprovedPreviewSummary();
    delete previewSummary.entrypoint;

    expect(selectConstructorApprovedArtifactSnapshotInput(previewSummary, "approved")).toMatchObject({
      ok: false,
      reason: "preview-sem-entrypoint",
    });
  });

  test.each([
    { "content.md": "# documentação" },
    { "index.html": "<html><body>preview</body></html>" },
  ])("rejeita preview documental atual (%j)", (fileContents) => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ fileContents }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
    });
  });

  test("rejeita content", () => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary({ content: "raw" }), "approved")
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "content",
    });
  });

  test("rejeita contentPreview", () => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(
        createApprovedPreviewSummary({ contentPreview: "raw" }),
        "approved"
      )
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "contentPreview",
    });
  });

  test("rejeita zipBase64", () => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary({ zipBase64: "raw" }), "approved")
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "zipBase64",
    });
  });

  test("rejeita user_email", () => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(
        createApprovedPreviewSummary({ user_email: "safe@example.com" }),
        "approved"
      )
    ).toMatchObject({
      ok: false,
      reason: "payload-sensivel-nao-permitido",
      path: "user_email",
    });
  });

  test("rejeita agentMessage.content", () => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(
        createApprovedPreviewSummary({ agentMessage: { content: "raw output" } }),
        "approved"
      )
    ).toMatchObject({
      ok: false,
      reason: "campo-agentmessage-content-nao-permitido",
      path: "agentMessage.content",
    });
  });

  test.each(["rawPayload", "payloadRaw", "realPayload", "payloadBruto"])("rejeita %s", (field) => {
    expect(
      selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary({ [field]: "raw" }), "approved")
    ).toMatchObject({
      ok: false,
      reason: "payload-bruto-nao-permitido",
      path: field,
    });
  });

  test("rejeita token/secret aninhado", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ origin: { metadata: { auth: { token: "x" } } } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "campo-sensivel-nao-permitido",
      path: "origin.metadata.auth.token",
    });
  });

  test("rejeita /api/ em conteúdo de arquivo", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ fileContents: { "index.js": "fetch('/api/artifact-preview')" } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "api-ou-rede-nao-permitida",
    });
  });

  test("rejeita sessionStorage em conteúdo de arquivo", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ fileContents: { "index.js": "sessionStorage.getItem('x')" } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita localStorage em conteúdo de arquivo", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ fileContents: { "index.js": "localStorage.getItem('x')" } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita backend aninhado", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ origin: { backend: { endpoint: "internal" } } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "dependencia-backend-nao-permitida",
      path: "origin.backend",
    });
  });

  test("rejeita executeArtifact aninhado", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ origin: { executeArtifact: true } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "execucao-server-side-nao-permitida",
      path: "origin.executeArtifact",
    });
  });

  test("rejeita path traversal", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ fileContents: { "../index.js": "console.log('x')" } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "caminho-perigoso",
      path: "../index.js",
    });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ fileContents: { "src/main.js": "console.log('x')" } }),
      "approved"
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
      path: "src/main.js",
    });
  });

  test("não chama fetch", () => {
    selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("não acessa sessionStorage", () => {
    selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");
    expect(sessionStorageGetter).not.toHaveBeenCalled();
  });

  test("não acessa localStorage", () => {
    selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");
    expect(localStorageGetter).not.toHaveBeenCalled();
  });

  test("não chama WebContainer.boot", () => {
    selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
  });

  test("não chama executeArtifact", () => {
    selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
  });

  test("não importa/chama handoff #582", () => {
    const selectorFile = fs.readFileSync(
      new URL("../constructorApprovedArtifactPreviewSelector.js", import.meta.url),
      "utf8"
    );

    expect(selectorFile).not.toContain("approvedConstructorArtifactHandoff");
  });

  test("não gera mountTree", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(createApprovedPreviewSummary(), "approved");
    const selectorFile = fs.readFileSync(
      new URL("../constructorApprovedArtifactPreviewSelector.js", import.meta.url),
      "utf8"
    );

    expect(result).not.toHaveProperty("mountTree");
    expect(globalThis.mountTree).not.toHaveBeenCalled();
    expect(selectorFile).not.toContain("mountTree");
  });

  test("retorno unavailable não expõe valor sensível", () => {
    const result = selectConstructorApprovedArtifactSnapshotInput(
      createApprovedPreviewSummary({ content: "const superSensitive='x'" }),
      "approved"
    );
    const publicJson = JSON.stringify(result);

    expect(result.ok).toBe(false);
    expect(result.status).toBe("constructor-approved-artifact-preview-selector: unavailable");
    expect(result.reason).not.toContain("superSensitive");
    expect(result.status).not.toContain("superSensitive");
    expect(publicJson).not.toContain("superSensitive");
  });

});
