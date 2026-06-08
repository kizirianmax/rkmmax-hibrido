import { parseConstructorMultiFileContentToStructuredFiles } from "./constructorMultiFileContentParser.js";
import { buildConstructorApprovedPreviewSummaryFromStructuredFiles } from "./constructorApprovedPreviewSummaryBuilder.js";

const UNAVAILABLE_STATUS = "constructor-multifile-approved-preview-derivation: unavailable";
const ELIGIBLE_STATUS = "constructor-multifile-approved-preview-derivation: eligible";
const EXECUTION_FLAG_KEY = "execute" + "ArtifactServerSide";

function unavailable(reason, stage, path) {
  return {
    ok: false,
    status: UNAVAILABLE_STATUS,
    reason,
    stage,
    ...(path ? { path } : {}),
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    [EXECUTION_FLAG_KEY]: "disabled",
  };
}

function eligible(artifact) {
  return {
    ok: true,
    status: ELIGIBLE_STATUS,
    stage: "builder",
    artifact,
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    [EXECUTION_FLAG_KEY]: "disabled",
  };
}

function isRequiredNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function deriveConstructorApprovedPreviewFromMultiFileContent(input) {
  const payload = input && typeof input === "object" && !Array.isArray(input) ? input : {};

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

  const parsed = parseConstructorMultiFileContentToStructuredFiles(payload.rawContent);
  if (!parsed.ok) {
    return unavailable(parsed.reason, "parser", parsed.path);
  }

  const built = buildConstructorApprovedPreviewSummaryFromStructuredFiles({
    id: payload.id,
    version: payload.version,
    entrypoint: payload.entrypoint,
    files: parsed.files,
  });

  if (!built.ok) {
    return unavailable(built.reason, "builder", built.path);
  }

  return eligible(built.artifact);
}
