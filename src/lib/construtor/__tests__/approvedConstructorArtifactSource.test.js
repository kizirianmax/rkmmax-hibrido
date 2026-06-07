import { jest } from "@jest/globals";
import {
  buildApprovedConstructorArtifactFromSource,
  inspectApprovedConstructorArtifactSource,
} from "../approvedConstructorArtifactSource.js";
import { validateApprovedConstructorArtifact } from "../approvedConstructorArtifactContract.js";

function createApprovedSource(overrides = {}) {
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

describe("approvedConstructorArtifactSource", () => {
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

  test("aceita source client-safe aprovado válido", () => {
    const result = buildApprovedConstructorArtifactFromSource(createApprovedSource());

    expect(result).toMatchObject({
      ok: true,
      status: "approved-constructor-artifact-source: eligible",
      sourceType: "client-safe-approved-source",
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
    expect(validateApprovedConstructorArtifact(result.artifact)).toEqual({ ok: true });
  });

  test("rejeita source sem approval", () => {
    const source = createApprovedSource();
    delete source.approval;

    expect(inspectApprovedConstructorArtifactSource(source)).toMatchObject({
      ok: false,
      status: "approved-constructor-artifact-source: unavailable",
      reason: "artifact-approval-invalido",
    });
  });

  test("rejeita approval diferente de approved", () => {
    expect(inspectApprovedConstructorArtifactSource(createApprovedSource({ approval: { status: "pending" } }))).toMatchObject({
      ok: false,
      reason: "artifact-nao-aprovado",
    });
  });

  test("rejeita entrypoint diferente de index.js", () => {
    expect(inspectApprovedConstructorArtifactSource(createApprovedSource({ entrypoint: "main.js" }))).toMatchObject({
      ok: false,
      reason: "entrypoint-nao-permitido",
    });
  });

  test("rejeita files ausente", () => {
    const source = createApprovedSource();
    delete source.files;

    expect(inspectApprovedConstructorArtifactSource(source)).toMatchObject({
      ok: false,
      reason: "artifact-files-invalido",
    });
  });

  test.each(["content", "contentPreview", "zipBase64", "user_email"])("rejeita %s", (field) => {
    const result = inspectApprovedConstructorArtifactSource(createApprovedSource({ [field]: "raw" }));
    expect(result.ok).toBe(false);
    expect(result.status).toBe("approved-constructor-artifact-source: unavailable");
  });

  test("rejeita agentMessage.content", () => {
    expect(
      inspectApprovedConstructorArtifactSource(
        createApprovedSource({
          agentMessage: { content: "raw sensitive output" },
        })
      )
    ).toMatchObject({
      ok: false,
      reason: "campo-agentmessage-content-nao-permitido",
      path: "agentMessage.content",
    });
  });

  test.each(["rawPayload", "payloadRaw", "realPayload", "payloadBruto"])("rejeita %s", (field) => {
    const result = inspectApprovedConstructorArtifactSource(createApprovedSource({ [field]: "raw" }));
    expect(result).toMatchObject({
      ok: false,
      status: "approved-constructor-artifact-source: unavailable",
    });
  });

  test("rejeita token/secret aninhado", () => {
    const result = inspectApprovedConstructorArtifactSource(
      createApprovedSource({
        manifest: { origin: { specialist: "hybrid" }, metadata: { auth: { token: "secret" } } },
      })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "campo-sensivel-nao-permitido",
      path: "manifest.metadata.auth.token",
    });
  });

  test("rejeita /api/", () => {
    const result = inspectApprovedConstructorArtifactSource(
      createApprovedSource({
        files: {
          "index.js": "fetch('/api/artifact-preview')",
        },
      })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "api-ou-rede-nao-permitida",
      path: "files.index.js",
    });
  });

  test.each(["sessionStorage", "localStorage"])("rejeita %s", (storageName) => {
    const result = inspectApprovedConstructorArtifactSource(
      createApprovedSource({
        files: {
          "index.js": `console.log(${storageName}.getItem('artifact'))`,
        },
      })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita path traversal", () => {
    const result = inspectApprovedConstructorArtifactSource(
      createApprovedSource({ files: { "../index.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "caminho-perigoso",
      path: "../index.js",
    });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = inspectApprovedConstructorArtifactSource(
      createApprovedSource({ files: { "src/main.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
      path: "src/main.js",
    });
  });

  test("não chama fetch, sessionStorage, localStorage, WebContainer.boot nem executeArtifact", () => {
    const run = () => buildApprovedConstructorArtifactFromSource(createApprovedSource());
    expect(run).not.toThrow();

    const result = run();
    expect(result.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(sessionStorageGetter).not.toHaveBeenCalled();
    expect(localStorageGetter).not.toHaveBeenCalled();
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
  });

  test("retorno seguro não expõe source code no status público", () => {
    const result = inspectApprovedConstructorArtifactSource(
      createApprovedSource({
        content: "const superSensitive = 'value';",
      })
    );

    expect(result.status).toBe("approved-constructor-artifact-source: unavailable");
    expect(result.status).not.toContain("superSensitive");
  });

  test("artifact elegível passa em validateApprovedConstructorArtifact", () => {
    const result = buildApprovedConstructorArtifactFromSource(createApprovedSource());

    expect(result.ok).toBe(true);
    expect(validateApprovedConstructorArtifact(result.artifact)).toEqual({ ok: true });
  });
});
