import { deriveConstructorApprovedPreviewFromMultiFileContent } from "./constructorMultiFileApprovedPreviewDerivation.js";
import { parseConstructorMultiFileContentToStructuredFiles } from "./constructorMultiFileContentParser.js";
import { validateStaticClientArtifact } from "./constructorStaticClientArtifactContract.js";

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

function isRequiredNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateDiagnosticPayload(payload) {
  if (typeof payload.rawContent !== "string") {
    return unavailable("derivation-rawcontent-invalido", "input", "rawContent");
  }

  if (!isRequiredNonEmptyString(payload.id)) {
    return unavailable("derivation-id-invalido", "input", "id");
  }

  if (!isRequiredNonEmptyString(payload.version)) {
    return unavailable("derivation-version-invalido", "input", "version");
  }

  if (!isRequiredNonEmptyString(payload.entrypoint)) {
    return unavailable("derivation-entrypoint-invalido", "input", "entrypoint");
  }

  return null;
}

function mapStructuredFilesToArtifact(files) {
  return files.reduce((accumulator, file) => {
    accumulator[file.name] = file.body;
    return accumulator;
  }, {});
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

  const payloadValidation = validateDiagnosticPayload(payload);
  if (payloadValidation) {
    return payloadValidation;
  }

  if (payload.entrypoint === "index.html") {
    const parsed = parseConstructorMultiFileContentToStructuredFiles(payload.rawContent);
    if (!parsed.ok) {
      return unavailable(parsed.reason, "parser", parsed.path);
    }

    const staticValidation = validateStaticClientArtifact(mapStructuredFilesToArtifact(parsed.files));
    if (!staticValidation.ok) {
      return unavailable(staticValidation.reason, "static-contract", staticValidation.path);
    }

    return eligible("static-contract");
  }

  const derived = deriveConstructorApprovedPreviewFromMultiFileContent(payload);
  if (!derived.ok) {
    return unavailable(derived.reason, derived.stage, derived.path);
  }

  return eligible(derived.stage);
}
