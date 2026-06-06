import { getWebContainerSpikeEvidence } from "../webcontainerSpikeEvidence.js";

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
});
