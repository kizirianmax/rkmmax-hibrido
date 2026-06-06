import {
  CONTROLLED_ARTIFACT_CANDIDATE,
  CONTROLLED_ARTIFACT_ENTRYPOINT,
  CONTROLLED_ARTIFACT_SANITIZED,
} from "./webcontainerArtifactFixture.js";

const BLOCKED_PAYLOAD_POLICY = ["content", "contentPreview", "zipBase64", "user_email", "secrets", "network", "shell"];
export const ARTIFACT_SOURCE = {
  fixture: "controlled-fixture",
  approved: "approved-constructor",
};

function flattenMountTreeFiles(mountTree, prefix = "") {
  const files = [];

  for (const [name, entry] of Object.entries(mountTree || {})) {
    const path = prefix ? `${prefix}/${name}` : name;

    if (entry?.file) {
      files.push(path);
      continue;
    }

    if (entry?.directory) {
      files.push(...flattenMountTreeFiles(entry.directory, path));
    }
  }

  return files;
}

export function getWebContainerSpikeEvidence() {
  const allowedFiles = Object.keys(CONTROLLED_ARTIFACT_CANDIDATE);
  const mountTreeFiles = flattenMountTreeFiles(CONTROLLED_ARTIFACT_SANITIZED.mountTree);

  return {
    ok: true,
    source: "controlled-constructor-artifact",
    adapter: "passed",
    sanitization: CONTROLLED_ARTIFACT_SANITIZED.ok ? "passed" : "failed",
    entrypoint: CONTROLLED_ARTIFACT_ENTRYPOINT,
    allowedFiles,
    mountTreeFiles,
    blockedPayloadPolicy: BLOCKED_PAYLOAD_POLICY,
    warning: "Fixture controlado; não usa dados reais de usuário.",
  };
}

export function getApprovedConstructorArtifactBridgeStatus() {
  return {
    status: "approved-constructor-artifact: unavailable",
    available: false,
    activeSource: ARTIFACT_SOURCE.fixture,
    reason: "no-safe-client-side-approved-source",
    rawPayloadAccessed: false,
    apiUsed: false,
    executeArtifactServerSide: "disabled",
    note: "Bridge preparada estruturalmente; ainda não executa artefato real aprovado.",
  };
}
