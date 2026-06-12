import {
  CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER,
  getConstructorArtifactCapabilityLabel,
} from "../constructorArtifactCapabilityLabels.js";

describe("constructorArtifactCapabilityLabels", () => {
  test("retorna labels esperados para as quatro capabilities conhecidas", () => {
    expect(getConstructorArtifactCapabilityLabel("exportable")).toEqual({
      label: "📦 Exportável agora",
      caption: "Pode baixar como ZIP. Não é execução.",
    });
    expect(getConstructorArtifactCapabilityLabel("previewable-static")).toEqual({
      label: "🖼️ Preview visual estático futuro",
      caption: "HTML/CSS sem JS. Ainda não implementado.",
    });
    expect(getConstructorArtifactCapabilityLabel("executable-client")).toEqual({
      label: "🧩 Execução no navegador futura",
      caption: "Dependeria de WebContainer ou sandbox client-side. Não está ativo.",
    });
    expect(getConstructorArtifactCapabilityLabel("blocked")).toEqual({
      label: "🚫 Bloqueado por segurança",
      caption: "Fora de contrato, allowlist ou padrão seguro.",
    });
  });

  test("retorna fallback para capability desconhecida", () => {
    expect(getConstructorArtifactCapabilityLabel("unknown-capability")).toEqual({
      label: "ℹ️ Capacidade não classificada",
      caption: "Classificação informativa indisponível.",
    });
  });

  test("mantém distinção explícita entre exportable e executable-client", () => {
    const exportable = getConstructorArtifactCapabilityLabel("exportable");
    const executableClient = getConstructorArtifactCapabilityLabel("executable-client");

    expect(exportable.label).not.toBe(executableClient.label);
    expect(exportable.caption).toContain("Não é execução");
    expect(executableClient.caption).toContain("Não está ativo");
  });

  test("disclaimer existe e contém os textos obrigatórios", () => {
    expect(typeof CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER).toBe("string");
    expect(CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER).toContain("Classificação informativa");
    expect(CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER).toContain("Não habilita execução");
    expect(CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER).toContain("WebContainer desativado");
    expect(CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER).toContain("executeArtifact server-side disabled");
    expect(CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER).toContain("Exportável ≠ executável");
  });
});
