import { getApprovedConstructorArtifactBridgeStatus, getWebContainerSpikeEvidence } from "../webcontainerSpikeEvidence.js";

describe("webcontainerSpikeEvidence", () => {
  test("retorna apenas metadados seguros da cadeia candidate -> sanitize", () => {
    const evidence = getWebContainerSpikeEvidence();

    expect(evidence).toEqual({
      ok: true,
      source: "controlled-constructor-artifact",
      adapter: "passed",
      sanitization: "passed",
      entrypoint: "index.js",
      allowedFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
      mountTreeFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
      blockedPayloadPolicy: ["content", "contentPreview", "zipBase64", "user_email", "secrets", "network", "shell"],
      warning: "Fixture controlado; não usa dados reais de usuário.",
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
      status: "approved-constructor-artifact: unavailable",
      available: false,
      activeSource: "controlled-fixture",
      reason: "no-safe-client-side-approved-source",
      rawPayloadAccessed: false,
      apiUsed: false,
      executeArtifactServerSide: "disabled",
      note: "Bridge preparada estruturalmente; ainda não executa artefato real aprovado.",
    });

    const serialized = JSON.stringify(bridgeStatus);
    expect(serialized).not.toContain("content");
    expect(serialized).not.toContain("contentPreview");
    expect(serialized).not.toContain("zipBase64");
    expect(serialized).not.toContain("user_email");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("secret");
  });
});
