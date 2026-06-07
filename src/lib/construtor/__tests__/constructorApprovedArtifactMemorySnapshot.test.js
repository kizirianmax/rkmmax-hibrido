import fs from "node:fs";
import { jest } from "@jest/globals";
import { buildConstructorApprovedArtifactMemorySnapshot } from "../constructorApprovedArtifactMemorySnapshot.js";
import { mapConstructorStateToApprovedArtifactSource } from "../constructorApprovedArtifactSourceMapper.js";
import { validateApprovedConstructorArtifact } from "../approvedConstructorArtifactContract.js";

function createInput(overrides = {}) {
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

describe("constructorApprovedArtifactMemorySnapshot", () => {
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

  test("aceita snapshot explícito client-safe aprovado válido", () => {
    const result = buildConstructorApprovedArtifactMemorySnapshot(createInput());

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-artifact-memory-snapshot: eligible",
      sourceType: "constructor-memory-client-safe-source",
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
  });

  test("artifact resultante mantém consistência com mapper #584", () => {
    const memoryResult = buildConstructorApprovedArtifactMemorySnapshot(createInput());
    const mapperResult = mapConstructorStateToApprovedArtifactSource(createInput());

    expect(memoryResult.ok).toBe(true);
    expect(mapperResult.ok).toBe(true);
    expect(memoryResult.artifact).toEqual(mapperResult.artifact);
  });

  test("artifact resultante passa em validateApprovedConstructorArtifact", () => {
    const result = buildConstructorApprovedArtifactMemorySnapshot(createInput());

    expect(result.ok).toBe(true);
    expect(validateApprovedConstructorArtifact(result.artifact)).toEqual({ ok: true });
  });

  test("rejeita snapshot sem approval", () => {
    const input = createInput();
    delete input.approval;

    expect(buildConstructorApprovedArtifactMemorySnapshot(input)).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-memory-snapshot: unavailable",
      reason: "artifact-approval-invalido",
    });
  });

  test("rejeita approval.status diferente de approved", () => {
    expect(
      buildConstructorApprovedArtifactMemorySnapshot(createInput({ approval: { status: "pending" } }))
    ).toMatchObject({
      ok: false,
      reason: "artifact-nao-aprovado",
    });
  });

  test("rejeita entrypoint diferente de index.js", () => {
    expect(buildConstructorApprovedArtifactMemorySnapshot(createInput({ entrypoint: "main.js" }))).toMatchObject({
      ok: false,
      reason: "entrypoint-nao-permitido",
    });
  });

  test("rejeita files ausente", () => {
    const input = createInput();
    delete input.files;

    expect(buildConstructorApprovedArtifactMemorySnapshot(input)).toMatchObject({
      ok: false,
      reason: "artifact-files-invalido",
    });
  });

  test.each(["content", "contentPreview", "zipBase64", "user_email"])("rejeita %s", (field) => {
    expect(buildConstructorApprovedArtifactMemorySnapshot(createInput({ [field]: "raw" }))).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-memory-snapshot: unavailable",
    });
  });

  test("rejeita agentMessage.content", () => {
    expect(
      buildConstructorApprovedArtifactMemorySnapshot(
        createInput({
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
    expect(buildConstructorApprovedArtifactMemorySnapshot(createInput({ [field]: "raw" }))).toMatchObject({
      ok: false,
      status: "constructor-approved-artifact-memory-snapshot: unavailable",
    });
  });

  test("rejeita token/secret aninhado", () => {
    const result = buildConstructorApprovedArtifactMemorySnapshot(
      createInput({
        manifest: { origin: { specialist: "hybrid" }, metadata: { auth: { token: "secret" } } },
      })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "campo-sensivel-nao-permitido",
      path: "manifest.metadata.auth.token",
    });
  });

  test("rejeita /api/ em conteúdo de arquivo", () => {
    expect(
      buildConstructorApprovedArtifactMemorySnapshot(
        createInput({
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

  test("rejeita sessionStorage em conteúdo de arquivo", () => {
    expect(
      buildConstructorApprovedArtifactMemorySnapshot(
        createInput({ files: { "index.js": "console.log(sessionStorage.getItem('artifact'))" } })
      )
    ).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita localStorage em conteúdo de arquivo", () => {
    expect(
      buildConstructorApprovedArtifactMemorySnapshot(
        createInput({ files: { "index.js": "console.log(localStorage.getItem('artifact'))" } })
      )
    ).toMatchObject({
      ok: false,
      reason: "fonte-storage-nao-permitida",
    });
  });

  test("rejeita backend", () => {
    expect(
      buildConstructorApprovedArtifactMemorySnapshot(
        createInput({
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
      buildConstructorApprovedArtifactMemorySnapshot(
        createInput({
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
    const result = buildConstructorApprovedArtifactMemorySnapshot(
      createInput({ files: { "../index.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "caminho-perigoso",
      path: "../index.js",
    });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = buildConstructorApprovedArtifactMemorySnapshot(
      createInput({ files: { "src/main.js": "console.log('x')" } })
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "arquivo-fora-da-allowlist",
      path: "src/main.js",
    });
  });

  test("não chama fetch/sessionStorage/localStorage/WebContainer.boot/executeArtifact", () => {
    const run = () => buildConstructorApprovedArtifactMemorySnapshot(createInput());
    expect(run).not.toThrow();

    const result = run();
    expect(result.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(sessionStorageGetter).not.toHaveBeenCalled();
    expect(localStorageGetter).not.toHaveBeenCalled();
    expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
    expect(globalThis.executeArtifact).not.toHaveBeenCalled();
    expect(globalThis.mountTree).not.toHaveBeenCalled();
  });

  test("não importa/chama handoff #582", () => {
    const helperFile = fs.readFileSync(
      new URL("../constructorApprovedArtifactMemorySnapshot.js", import.meta.url),
      "utf8"
    );

    expect(helperFile).not.toContain("approvedConstructorArtifactHandoff");
  });

  test("não gera mountTree no resultado", () => {
    const result = buildConstructorApprovedArtifactMemorySnapshot(createInput());

    expect(result).not.toHaveProperty("mountTree");
  });

  test("retorno público unavailable não expõe valor sensível", () => {
    const result = buildConstructorApprovedArtifactMemorySnapshot(
      createInput({
        content: "const superSensitive = 'value';",
      })
    );

    expect(result.status).toBe("constructor-approved-artifact-memory-snapshot: unavailable");
    expect(result.status).not.toContain("superSensitive");
  });
});
