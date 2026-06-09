import { deriveConstructorApprovedPreviewFromMultiFileContent } from "./constructorMultiFileApprovedPreviewDerivation.js";

const UNAVAILABLE_STATUS = "constructor-approved-preview-diagnostic-reader: unavailable";
const ELIGIBLE_STATUS = "constructor-approved-preview-diagnostic-reader: eligible";
const EXECUTION_FLAG_KEY = "execute" + "ArtifactServerSide";

function unavailable(reason, stage, path) {
  return {
    ok: false,
    status: UNAVAILABLE_STATUS,
    verdict: "unavailable",
    stage,
    reason,
    ...(path ? { path } : {}),
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    [EXECUTION_FLAG_KEY]: "disabled",
  };
}

function eligible(stage) {
  return {
    ok: true,
    status: ELIGIBLE_STATUS,
    verdict: "eligible",
    stage,
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    [EXECUTION_FLAG_KEY]: "disabled",
  };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function readApprovedPreviewDiagnosticFromExplicitSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) {
    return unavailable("diagnostic-snapshot-invalido", "input");
  }

  const payload = {
    rawContent: snapshot.rawContent,
    id: snapshot.id,
    version: snapshot.version,
    entrypoint: snapshot.entrypoint,
  };

  const derived = deriveConstructorApprovedPreviewFromMultiFileContent(payload);
  if (!derived.ok) {
    return unavailable(derived.reason, derived.stage, derived.path);
  }

  return eligible(derived.stage);
}
