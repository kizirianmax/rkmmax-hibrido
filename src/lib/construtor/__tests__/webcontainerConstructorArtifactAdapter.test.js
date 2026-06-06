import { jest } from "@jest/globals";
import { buildWebContainerCandidateFromConstructorArtifact } from "../webcontainerConstructorArtifactAdapter.js";
import { sanitizeWebContainerArtifact } from "../webcontainerArtifactContract.js";
import {
  CONTROLLED_ARTIFACT_CANDIDATE,
  CONTROLLED_CONSTRUCTOR_ARTIFACT,
} from "../webcontainerArtifactFixture.js";

function artifactWith(overrides) {
  return {
    ...CONTROLLED_CONSTRUCTOR_ARTIFACT,
    ...overrides,
    manifest: {
      ...CONTROLLED_CONSTRUCTOR_ARTIFACT.manifest,
      ...(overrides?.manifest || {}),
    },
    files: {
      ...CONTROLLED_CONSTRUCTOR_ARTIFACT.files,
      ...(overrides?.files || {}),
    },
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

  test("aceita candidate controlado válido", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(CONTROLLED_CONSTRUCTOR_ARTIFACT);

    expect(result.ok).toBe(true);
    expect(result.candidate).toEqual(CONTROLLED_ARTIFACT_CANDIDATE);
    expect(result.candidate).toHaveProperty(["package.json"]);
    expect(result.candidate).toHaveProperty(["artifact-manifest.json"]);
    expect(result.candidate).toHaveProperty(["index.js"]);
    expect(result.candidate).toHaveProperty(["lib/sum.js"]);
  });

  test("rejeita artifact inválido", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(null);

    expect(result).toMatchObject({ ok: false, reason: "artifact-invalido" });
  });

  test("rejeita entrypoint diferente de index.js", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(artifactWith({ entrypoint: "main.js" }));

    expect(result).toMatchObject({ ok: false, reason: "entrypoint-nao-permitido", path: "main.js" });
  });

  test("rejeita files ausente", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact({
      ...CONTROLLED_CONSTRUCTOR_ARTIFACT,
      files: undefined,
    });

    expect(result).toMatchObject({ ok: false, reason: "files-invalido" });
  });

  test("rejeita campos proibidos no artifact", () => {
    const withContent = buildWebContainerCandidateFromConstructorArtifact(artifactWith({ content: "payload" }));
    const withContentPreview = buildWebContainerCandidateFromConstructorArtifact(
      artifactWith({ manifest: { contentPreview: "preview" } })
    );
    const withZip = buildWebContainerCandidateFromConstructorArtifact(artifactWith({ zipBase64: "UEsDBA==" }));
    const withUserEmail = buildWebContainerCandidateFromConstructorArtifact(
      artifactWith({ manifest: { user_email: "x@example.test" } })
    );

    expect(withContent).toMatchObject({ ok: false, reason: "artifact-campo-proibido", path: "content" });
    expect(withContentPreview).toMatchObject({ ok: false, reason: "artifact-campo-proibido", path: "contentPreview" });
    expect(withZip).toMatchObject({ ok: false, reason: "artifact-campo-proibido", path: "zipBase64" });
    expect(withUserEmail).toMatchObject({ ok: false, reason: "artifact-campo-proibido", path: "user_email" });
  });

  test("não chama fetch nem /api", () => {
    const result = buildWebContainerCandidateFromConstructorArtifact(CONTROLLED_CONSTRUCTOR_ARTIFACT);

    expect(result.ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("fixture passa por adapter e sanitize", () => {
    const adapted = buildWebContainerCandidateFromConstructorArtifact(CONTROLLED_CONSTRUCTOR_ARTIFACT);

    expect(adapted.ok).toBe(true);
    const sanitized = sanitizeWebContainerArtifact(adapted.candidate);
    expect(sanitized.ok).toBe(true);
    expect(sanitized.mountTree).toHaveProperty(["package.json", "file", "contents"]);
    expect(sanitized.mountTree).toHaveProperty(["index.js", "file", "contents"]);
  });
});
