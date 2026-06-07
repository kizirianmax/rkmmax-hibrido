import fs from "node:fs";
import { jest } from "@jest/globals";
import { mapConstructorStateToApprovedArtifactSource } from "../constructorApprovedArtifactSourceMapper.js";
import { validateApprovedConstructorArtifact } from "../approvedConstructorArtifactContract.js";

function createSnapshot(overrides = {}) {
  return {
    id: "approved-artifact-001",
    version: "1.0.0",
    approval: {
      status: "approved",
      source: "constructor-human-review",
    },
    entrypoint: "index.js",
    files: {
      "index.js": "const { sum } = require('./lib/sum.js');\\nconsole.log(sum([1,2,3]));",
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

describe("constructorApprovedArtifactSourceMapper", () => {
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

  test("aceita snapshot client-safe aprovado válido", () => {
    const result = mapConstructorStateToApprovedArtifactSource(createSnapshot());

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-artifact-source: eligible",
      sourceType: "constructor-memory-client-safe-source",
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
  });

  test("artifact resultante passa em validateApprovedConstructorArtifact", () => {
    const result = mapConstructorStateToApprovedArtifactSource(createSnapshot());

    expect(result.ok).toBe(true);
    expect(validateApprovedConstructorArtifact(result.artifact)).toEqual({ ok: true });
  });

  test("rejeita snapshot sem approval", () => {
    const snapshot = createSnapshot();
    delete snapshot.approval;

    expect(mapConstructorStateToApprovedArtifactSource(snapshot)).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-source: unavailable",
      reason: "artifact-approval-invalido",
    });
  });

  test("rejeita approval diferente de approved", () => {
    expect(
      mapConstructorStateToApprovedArtifactSource(createSnapshot({ approval: { status: "pending" } }))
    ).toMatchObject({
      ok: false,
      reason: "artifact-nao-aprovado",
    });
  });

  test("rejeita entrypoint diferente de index.js", () => {
    expect(mapConstructorStateToApprovedArtifactSource(createSnapshot({ entrypoint: "main.js" }))).toMatchObject({
      ok: false,
      reason: "entrypoint-nao-permitido",
    });
  });

  test("rejeita files ausente", () => {
    const snapshot = createSnapshot();
    delete snapshot.files;

    expect(mapConstructorStateToApprovedArtifactSource(snapshot)).toMatchObject({
      ok: false,
      reason: "artifact-files-invalido",
    });
  });

  test.each(["content", "contentPreview", "zipBase64", "user_email"])("rejeita %s", (field) => {
    expect(mapConstructorStateToApprovedArtifactSource(createSnapshot({ [field]: "raw" }))).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-source: unavailable",
    });
  });

  test("rejeita agentMessage.content", () => {
    expect(
      mapConstructorStateToApprovedArtifactSource(
        createSnapshot({
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
    expect(mapConstructorStateToApprovedArtifactSource(createSnapshot({ [field]: "raw" }))).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-source: unavailable",
    });
  });

  test("rejeita token/secret aninhado", () => {
    const result = mapConstructorStateToApprovedArtifactSource(
      createSnapshot({
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
    expect(
      mapConstructorStateToApprovedArtifactSource(
        createSnapshot({
          files: {
            "index.js": "fetch('/api/artifact-preview')",
          },
        })
      )
    ).toMatchObject({
      ok: false,
      reason: "api-ou-rede-nao-permitida",
      path: "files.index.js",
    });
  });

  test("rejeita sessionStorage", () => {
    expect(
      mapConstructorStateToApprovedArtifactSource(
        createSnapshot({ files: { "index.js": "console.log(sessionStorage.getItem('artifact'))" } })
      )
    ).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita localStorage", () => {
    expect(
      mapConstructorStateToApprovedArtifactSource(
        createSnapshot({ files: { "index.js": "console.log(localStorage.getItem('artifact'))" } })
      )
    ).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita backend", () => {
    expect(
      mapConstructorStateToApprovedArtifactSource(
        createSnapshot({
          backend: {
            endpoint: "https://internal.example",
          },
        })
      )
    ).toMatchObject({
      ok: false,
      reason: "dependencia-backend-nao-permitida",
      path: "backend",
    });
  });

  test("rejeita executeArtifact", () => {
    expect(
      mapConstructorStateToApprovedArtifactSource(
        createSnapshot({
          executeArtifact: true,
        })
      )
    ).toMatchObject({
      ok: false,
      reason: "execucao-server-side-nao-permitida",
      path: "executeArtifact",
    });
  });

  test("rejeita path traversal", () => {
    const result = mapConstructorStateToApprovedArtifactSource(
      createSnapshot({ files: { "../index.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "caminho-perigoso",
      path: "../index.js",
    });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = mapConstructorStateToApprovedArtifactSource(
      createSnapshot({ files: { "src/main.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
      path: "src/main.js",
    });
  });

  test("não chama fetch, sessionStorage, localStorage, WebContainer.boot, executeArtifact nem mountTree", () => {
    const run = () => mapConstructorStateToApprovedArtifactSource(createSnapshot());
    expect(run).not.toThrow();

    const result = run();
    expect(result.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(sessionStorageGetter).not.toHaveBeenCalled();
    expect(localStorageGetter).not.toHaveBeenCalled();
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
    expect(globalThis.mountTree).not.toHaveBeenCalled();
    expect(result).not.toHaveProperty("mountTree");
  });

  test("não importa handoff #582", () => {
    const mapperFile = fs.readFileSync(
      new URL("../constructorApprovedArtifactSourceMapper.js", import.meta.url),
      "utf8"
    );

    expect(mapperFile).not.toContain("approvedConstructorArtifactHandoff");
  });

  test("retorno público não expõe source code bruto", () => {
    const result = mapConstructorStateToApprovedArtifactSource(
      createSnapshot({
        content: "const superSensitive = 'value';",
      })
    );

    expect(result.status).toBe("constructor-approved-artifact-source: unavailable");
    expect(result.status).not.toContain("superSensitive");
  });
});
