import {
  buildWebContainerCandidateFromConstructorArtifact,
} from "../webcontainerConstructorArtifactAdapter.js";
import { sanitizeWebContainerArtifact } from "../webcontainerArtifactContract.js";
import { jest } from "@jest/globals";

function createControlledArtifact(overrides = {}) {
  return {
    id: "controlled-webcontainer-artifact",
    version: "0.0.0-spike",
    entrypoint: "index.js",
    manifest: {
      origin: {
        specialist: "hybrid",
        model: "fixture-controlado",
      },
      contentType: "application/vnd.rkmmax.webcontainer-spike+json",
    },
    files: {
      "index.js": "const { sum } = require('./lib/sum.js');\nconsole.log(sum([12, 30]));\n",
      "lib/sum.js": "function sum(values){return values.reduce((a,b)=>a+b,0);}\nmodule.exports={sum};\n",
    },
    ...overrides,
  };
}

describe("webcontainerConstructorArtifactAdapter", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("aceita candidate controlado válido e converte para arquivos permitidos", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(createControlledArtifact());

    expect(result.ok).toBe(true);
    expect(result.candidate).toHaveProperty(["package.json"]);
    expect(result.candidate).toHaveProperty(["artifact-manifest.json"]);
    expect(result.candidate).toHaveProperty(["index.js"]);
    expect(result.candidate).toHaveProperty(["lib/sum.js"]);

    const sanitized = sanitizeWebContainerArtifact(result.candidate);
    expect(sanitized.ok).toBe(true);
  });

  test("rejeita artifact inválido", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(null);
    expect(result).toMatchObject({ ok: false, reason: "artefato-construtor-invalido" });
  });

  test("rejeita entrypoint diferente de index.js", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(
      createControlledArtifact({ entrypoint: "main.js" })
    );
    expect(result).toMatchObject({ ok: false, reason: "entrypoint-nao-permitido" });
  });

  test("rejeita files ausente", () => {
    const artifact = createControlledArtifact();
    delete artifact.files;
    const result = buildWebContainerCandidateFromConstructorArtifact(artifact);
    expect(result).toMatchObject({ ok: false, reason: "artifact-files-invalido" });
  });

  test.each(["content", "contentPreview", "zipBase64", "user_email"])(
    "rejeita campo proibido no artifact: %s",
    (forbiddenField) => {
      const result = buildWebContainerCandidateFromConstructorArtifact(
        createControlledArtifact({ [forbiddenField]: "valor-proibido" })
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/campo-/);
    }
  );

  test("não chama fetch nem /api durante adaptação", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(createControlledArtifact());

    expect(result.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
