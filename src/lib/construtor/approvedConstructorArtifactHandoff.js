import { normalizeApprovedConstructorArtifact } from "./approvedConstructorArtifactContract.js";
import { buildWebContainerCandidateFromConstructorArtifact } from "./webcontainerConstructorArtifactAdapter.js";
import { sanitizeWebContainerArtifact } from "./webcontainerArtifactContract.js";

function reject(reason, path) {
  return {
    ok: false,
    status: "approved-constructor-artifact: rejected",
    reason,
    ...(path ? { path } : {}),
    available: false,
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}

export function prepareApprovedConstructorArtifactForWebContainer(candidate) {
  const normalized = normalizeApprovedConstructorArtifact(candidate);
  if (!normalized.ok) {
    return reject(normalized.reason, normalized.path);
  }

  const adapted = buildWebContainerCandidateFromConstructorArtifact(normalized.artifact);
  if (!adapted.ok) {
    return reject(adapted.reason, adapted.path);
  }

  const sanitized = sanitizeWebContainerArtifact(adapted.candidate);
  if (!sanitized.ok) {
    return reject(sanitized.reason, sanitized.path);
  }

  return {
    ok: true,
    status: "approved-constructor-artifact: prepared-for-webcontainer",
    source: "approved-constructor-artifact",
    available: true,
    entrypoint: normalized.artifact.entrypoint,
    artifactId: normalized.artifact.id,
    artifactVersion: normalized.artifact.version,
    fileCount: Object.keys(sanitized.files).length,
    mountTree: sanitized.mountTree,
    safeFiles: Object.keys(sanitized.files),
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}
