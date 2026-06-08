import {
  CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE,
  getControlledApprovedWebContainerFixturePublicStatus,
  getControlledApprovedWebContainerRuntimeInput,
} from "./constructorApprovedArtifactWebContainerFixture.js";

const BLOCKED_PAYLOAD_POLICY = ["content", "contentPreview", "zipBase64", "user_email", "secrets", "network", "shell"];
export const ARTIFACT_SOURCE = {
  fixture: "controlled-fixture",
  approved: "approved-constructor",
  controlledApprovedFixture: "controlled-approved-fixture",
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
  const mountTreeFiles = flattenMountTreeFiles(CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.mountTree);

  return {
    ok: true,
    source: "controlled-approved-constructor-artifact",
    adapter: "passed",
    sanitization: "passed",
    entrypoint: CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.entrypoint,
    allowedFiles: [...CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.safeFiles],
    mountTreeFiles,
    blockedPayloadPolicy: BLOCKED_PAYLOAD_POLICY,
    warning:
      "Fonte aprovada controlada por fixture allowlistado; ainda não representa artefato real aprovado do Construtor.",
  };
}

export function getApprovedConstructorArtifactBridgeStatus() {
  return getControlledApprovedWebContainerFixturePublicStatus();
}

export function getApprovedConstructorArtifactBridgeRuntimeInput() {
  return getControlledApprovedWebContainerRuntimeInput();
}
