const CAPABILITY_LABELS = {
  exportable: {
    label: "📦 Exportável agora",
    caption: "Pode baixar como ZIP. Não é execução.",
  },
  "previewable-static": {
    label: "🖼️ Preview visual estático futuro",
    caption: "HTML/CSS sem JS. Ainda não implementado.",
  },
  "executable-client": {
    label: "🧩 Execução no navegador futura",
    caption: "Dependeria de WebContainer ou sandbox client-side. Não está ativo.",
  },
  blocked: {
    label: "🚫 Bloqueado por segurança",
    caption: "Fora de contrato, allowlist ou padrão seguro.",
  },
};

const FALLBACK_CAPABILITY_LABEL = {
  label: "ℹ️ Capacidade não classificada",
  caption: "Classificação informativa indisponível.",
};

export const CONSTRUCTOR_ARTIFACT_CAPABILITY_DISCLAIMER =
  "Classificação informativa. Não habilita execução. WebContainer desativado. executeArtifact server-side disabled. Exportável ≠ executável.";

export function getConstructorArtifactCapabilityLabel(capability) {
  if (typeof capability !== "string") {
    return FALLBACK_CAPABILITY_LABEL;
  }

  return CAPABILITY_LABELS[capability] || FALLBACK_CAPABILITY_LABEL;
}
