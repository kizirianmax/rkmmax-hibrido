import {
  buildApprovedConstructorArtifactStatus,
  normalizeApprovedConstructorArtifact,
  validateApprovedConstructorArtifact,
} from "../approvedConstructorArtifactContract.js";
import { jest } from "@jest/globals";

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

describe("approvedConstructorArtifactContract", () => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: jest.fn(() => {
        throw new Error("sessionStorage should not be accessed");
      }),
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: jest.fn(() => {
        throw new Error("localStorage should not be accessed");
      }),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: originalSessionStorage });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalLocalStorage });
  });

  test("aceita artifact aprovado mínimo válido", () => {
    const result = validateApprovedConstructorArtifact(createApprovedArtifact());
    expect(result).toEqual({ ok: true });
  });

  test("rejeita artifact sem approval", () => {
    const artifact = createApprovedArtifact();
    delete artifact.approval;
    expect(validateApprovedConstructorArtifact(artifact)).toMatchObject({
      ok: false,
      reason: "artifact-approval-invalido",
    });
  });

  test("rejeita approval diferente de approved", () => {
    const result = validateApprovedConstructorArtifact(
      createApprovedArtifact({ approval: { status: "pending" } })
    );
    expect(result).toMatchObject({ ok: false, reason: "artifact-nao-aprovado" });
  });

  test("rejeita entrypoint diferente de index.js", () => {
    const result = validateApprovedConstructorArtifact(createApprovedArtifact({ entrypoint: "main.js" }));
    expect(result).toMatchObject({ ok: false, reason: "entrypoint-nao-permitido" });
  });

  test("rejeita content", () => {
    const result = validateApprovedConstructorArtifact(createApprovedArtifact({ content: "raw" }));
    expect(result).toMatchObject({ ok: false, reason: "campo-content-nao-permitido", path: "content" });
  });

  test("rejeita contentPreview", () => {
    const result = validateApprovedConstructorArtifact(createApprovedArtifact({ contentPreview: "raw" }));
    expect(result).toMatchObject({
      ok: false,
      reason: "campo-contentpreview-nao-permitido",
      path: "contentPreview",
    });
  });

  test("rejeita zipBase64", () => {
    const result = validateApprovedConstructorArtifact(createApprovedArtifact({ zipBase64: "zip" }));
    expect(result).toMatchObject({ ok: false, reason: "campo-zipbase64-nao-permitido", path: "zipBase64" });
  });

  test("rejeita user_email", () => {
    const result = validateApprovedConstructorArtifact(createApprovedArtifact({ user_email: "x@y.com" }));
    expect(result).toMatchObject({ ok: false, reason: "campo-user-email-nao-permitido", path: "user_email" });
  });

  test("rejeita token/secret aninhado", () => {
    const result = validateApprovedConstructorArtifact(
      createApprovedArtifact({ manifest: { origin: { specialist: "hybrid" }, metadata: { token: "secret" } } })
    );
    expect(result).toMatchObject({ ok: false, reason: "campo-sensivel-nao-permitido", path: "manifest.metadata.token" });
  });

  test("rejeita files inválido", () => {
    expect(validateApprovedConstructorArtifact(createApprovedArtifact({ files: null }))).toMatchObject({
      ok: false,
      reason: "artifact-files-invalido",
    });
  });

  test("rejeita path traversal", () => {
    const result = validateApprovedConstructorArtifact(
      createApprovedArtifact({ files: { "../index.js": "console.log('x')" } })
    );
    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "../index.js" });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = validateApprovedConstructorArtifact(
      createApprovedArtifact({ files: { "src/main.js": "console.log('x')" } })
    );
    expect(result).toMatchObject({ ok: false, reason: "arquivo-fora-da-allowlist", path: "src/main.js" });
  });

  test("rejeita dependência externa em metadata package-like", () => {
    const result = validateApprovedConstructorArtifact(
      createApprovedArtifact({
        manifest: {
          origin: { specialist: "hybrid" },
          dependencies: { react: "^19.0.0" },
        },
      })
    );
    expect(result).toMatchObject({
      ok: false,
      reason: "dependencias-externas-nao-permitidas",
      path: "manifest.dependencies",
    });
  });

  test("rejeita referência a /api/ no conteúdo", () => {
    const result = validateApprovedConstructorArtifact(
      createApprovedArtifact({
        files: {
          "index.js": "fetch('/api/artifact-preview')",
        },
      })
    );

    expect(result.ok).toBe(false);
    expect(result.path).toBe("index.js");
  });

  test("rejeita referência a sessionStorage no conteúdo", () => {
    const result = validateApprovedConstructorArtifact(
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

  test("não chama fetch, /api/ nem storage", () => {
    const status = buildApprovedConstructorArtifactStatus(createApprovedArtifact());
    expect(status.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\//i));
  });

  test("retorna status seguro sem expor conteúdo bruto", () => {
    const status = buildApprovedConstructorArtifactStatus(createApprovedArtifact());
    const serialized = JSON.stringify(status);

    expect(status).toMatchObject({
      ok: true,
      status: "approved-constructor-artifact: valid-contract",
      available: false,
      source: "contract-only",
      apiUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
    });
    expect(serialized).not.toContain("const { sum }");
    expect(serialized).not.toContain("module.exports={sum}");
  });

  test("normaliza para contentType oficial e sem mutar conteúdo", () => {
    const artifact = createApprovedArtifact({
      manifest: { origin: { specialist: "hybrid", model: "m", promptId: "p" }, contentType: "x" },
    });
    const result = normalizeApprovedConstructorArtifact(artifact);

    expect(result.ok).toBe(true);
    expect(result.artifact.manifest.contentType).toBe(
      "application/vnd.rkmmax.constructor-approved-artifact+json"
    );
    expect(result.artifact.files["index.js"]).toContain("const { sum }");
  });
});
