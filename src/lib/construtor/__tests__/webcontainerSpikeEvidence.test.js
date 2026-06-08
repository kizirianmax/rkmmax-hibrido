import {
  getApprovedConstructorArtifactBridgeRuntimeInput,
  getApprovedConstructorArtifactBridgeStatus,
  getWebContainerSpikeEvidence,
} from "../webcontainerSpikeEvidence.js";

describe("webcontainerSpikeEvidence", () => {
  test("retorna apenas metadados seguros da cadeia aprovada controlada", () => {
    const evidence = getWebContainerSpikeEvidence();

    expect(evidence).toEqual({
      ok: true,
      source: "controlled-approved-constructor-artifact",
      adapter: "passed",
      sanitization: "passed",
      entrypoint: "index.js",
      allowedFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
      mountTreeFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
      blockedPayloadPolicy: ["content", "contentPreview", "zipBase64", "user_email", "secrets", "network", "shell"],
      warning: "Fonte aprovada controlada por fixture allowlistado; ainda não representa artefato real aprovado do Construtor.",
    });
  });

  test("não expõe conteúdo bruto de arquivos", () => {
    const serialized = JSON.stringify(getWebContainerSpikeEvidence());

    expect(serialized).not.toContain("const manifest = require");
    expect(serialized).not.toContain("module.exports = { sum }");
  });

  test("expõe status de bridge com metadados seguros e sem payload bruto", () => {
    const bridgeStatus = getApprovedConstructorArtifactBridgeStatus();

    expect(bridgeStatus).toEqual({
      ok: true,
      status: "approved-constructor-artifact: controlled-fixture-ready",
      activeSource: "controlled-approved-fixture",
      sourceType: "controlled-client-safe-approved-source",
      available: true,
      entrypoint: "index.js",
      safeFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
      fileCount: 4,
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
      note: "Fonte aprovada controlada via fixture client-safe; ainda não é artefato real aprovado do Construtor.",
    });

    const serialized = JSON.stringify(bridgeStatus);
    expect(serialized).not.toContain("content");
    expect(serialized).not.toContain("contentPreview");
    expect(serialized).not.toContain("zipBase64");
    expect(serialized).not.toContain("user_email");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("mountTree");
  });

  test("expõe runtime interno apenas para execução client-side", () => {
    const runtime = getApprovedConstructorArtifactBridgeRuntimeInput();

    expect(runtime.entrypoint).toBe("index.js");
    expect(runtime.mountTree).toBeDefined();
  });
});
