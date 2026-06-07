import { jest } from "@jest/globals";
import { prepareApprovedConstructorArtifactForWebContainer } from "../approvedConstructorArtifactHandoff.js";

function createApprovedArtifact(overrides = {}) {
  return {
    id: "approved-artifact-001",
    version: "1.0.0",
    approval: {
      status: "approved",
      source: "constructor-human-review",
    },
    entrypoint: "index.js",
    files: {
      "index.js": "const { sum } = require('./lib/sum.js');\nconsole.log(sum([1,2,3]));",
      "lib/sum.js": "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
    },
    manifest: {
      origin: {
        specialist: "hybrid",
        model: "safe-model",
        promptId: "safe-prompt",
      },
      contentType: "application/vnd.rkmmax.constructor-approved-artifact+json",
    },
    ...overrides,
  };
}

describe("approvedConstructorArtifactHandoff", () => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  const originalLocalStorage = globalThis.localStorage;
  const originalExecuteArtifact = globalThis.executeArtifact;
  const originalWebContainer = globalThis.WebContainer;
  let sessionStorageGetter;
  let localStorageGetter;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
    globalThis.executeArtifact = jest.fn();
    globalThis.WebContainer = { boot: jest.fn() };
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
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: originalSessionStorage });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalLocalStorage });
    jest.restoreAllMocks();
  });

  test("aceita Approved Constructor Artifact válido e prepara para WebContainer", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact());

    expect(result).toMatchObject({
      ok: true,
      status: "approved-constructor-artifact: prepared-for-webcontainer",
      source: "approved-constructor-artifact",
      available: true,
      entrypoint: "index.js",
      artifactId: "approved-artifact-001",
      artifactVersion: "1.0.0",
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
    expect(result.fileCount).toBe(4);
    expect(result.safeFiles).toEqual(["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"]);
  });

  test("chama fluxo contrato -> adapter -> sanitize indiretamente", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact());

    expect(result.ok).toBe(true);
    expect(result.safeFiles).toContain("package.json");
    expect(result.safeFiles).toContain("artifact-manifest.json");
    expect(result.mountTree).toHaveProperty(["package.json", "file", "contents"]);
    expect(result.mountTree).toHaveProperty(["artifact-manifest.json", "file", "contents"]);
  });

  test("retorna mountTree sanitizado", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact());

    expect(result.ok).toBe(true);
    expect(result.mountTree).toHaveProperty(["package.json", "file", "contents"]);
    expect(result.mountTree).toHaveProperty(["artifact-manifest.json", "file", "contents"]);
    expect(result.mountTree).toHaveProperty(["index.js", "file", "contents"]);
    expect(result.mountTree).toHaveProperty(["lib", "directory", "sum.js", "file", "contents"]);
  });

  test("available: true somente quando tudo passa", () => {
    const success = prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact());
    const failure = prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact({ approval: { status: "pending" } }));

    expect(success.available).toBe(true);
    expect(failure).toMatchObject({ ok: false, available: false });
  });

  test("rejeita artifact sem approval", () => {
    const artifact = createApprovedArtifact();
    delete artifact.approval;

    expect(prepareApprovedConstructorArtifactForWebContainer(artifact)).toMatchObject({
      ok: false,
      reason: "artifact-approval-invalido",
    });
  });

  test("rejeita approval diferente de approved", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({ approval: { status: "pending" } })
    );

    expect(result).toMatchObject({ ok: false, reason: "artifact-nao-aprovado" });
  });

  test.each(["content", "contentPreview", "zipBase64", "user_email"])("rejeita %s", (field) => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({
        [field]: "value",
      })
    );

    expect(result.ok).toBe(false);
    expect(result.available).toBe(false);
  });

  test("rejeita token/secret aninhado", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({ manifest: { origin: { specialist: "hybrid" }, metadata: { token: "secret" } } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "campo-sensivel-nao-permitido",
      path: "manifest.metadata.token",
    });
  });

  test("rejeita /api/", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({
        files: {
          "index.js": "fetch('/api/artifact-preview')",
        },
      })
    );

    expect(result).toMatchObject({
      ok: false,
      path: "index.js",
    });
    expect(result.reason).toMatch(/api|rede|storage/);
  });

  test("rejeita sessionStorage", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({
        files: {
          "index.js": "console.log(sessionStorage.getItem('artifact'))",
        },
      })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "api-ou-storage-nao-permitido",
      path: "index.js",
    });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({ files: { "src/main.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
      path: "src/main.js",
    });
  });

  test("rejeita path traversal", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(
      createApprovedArtifact({ files: { "../index.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "caminho-perigoso",
      path: "../index.js",
    });
  });

  test("não chama fetch, sessionStorage, localStorage, WebContainer nem executeArtifact", () => {
    const run = () => prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact());
    expect(run).not.toThrow();

    const result = run();
    expect(result.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(sessionStorageGetter).not.toHaveBeenCalled();
    expect(localStorageGetter).not.toHaveBeenCalled();
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
  });

  test("status seguro não expõe conteúdo bruto/source code", () => {
    const result = prepareApprovedConstructorArtifactForWebContainer(createApprovedArtifact());
    const safeStatusSerialized = JSON.stringify({
      ok: result.ok,
      status: result.status,
      source: result.source,
      available: result.available,
      entrypoint: result.entrypoint,
      artifactId: result.artifactId,
      artifactVersion: result.artifactVersion,
      fileCount: result.fileCount,
      safeFiles: result.safeFiles,
      rawPayloadAccessed: result.rawPayloadAccessed,
      apiUsed: result.apiUsed,
      storageUsed: result.storageUsed,
      executeArtifactServerSide: result.executeArtifactServerSide,
    });

    expect(result.status).toBe("approved-constructor-artifact: prepared-for-webcontainer");
    expect(safeStatusSerialized).not.toContain("const { sum }");
    expect(safeStatusSerialized).not.toContain("module.exports={sum}");
    expect(safeStatusSerialized).not.toContain("contentPreview");
    expect(safeStatusSerialized).not.toContain("zipBase64");
    expect(safeStatusSerialized).not.toContain("user_email");
  });
});
