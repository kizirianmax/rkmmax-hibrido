import { readApprovedPreviewDiagnosticFromExplicitSnapshot } from "./constructorApprovedPreviewDiagnosticReader.js";

const UNAVAILABLE_STATUS = "constructor-inmemory-preview-snapshot-adapter: unavailable";
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

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function readApprovedPreviewDiagnosticFromInMemoryPreview(preview) {
  if (!isPlainObject(preview)) {
    return unavailable("inmemory-preview-invalido", "input");
  }

  if (!isPlainObject(preview.fileContents)) {
    return unavailable("inmemory-filecontents-invalido", "input", "fileContents");
  }

  const entries = Object.entries(preview.fileContents);
  if (entries.length === 0) {
    return unavailable("inmemory-filecontents-vazio", "input", "fileContents");
  }

  if (!isNonEmptyString(preview.id)) {
    return unavailable("inmemory-id-invalido", "input", "id");
  }

  if (!isNonEmptyString(preview.version)) {
    return unavailable("inmemory-version-invalido", "input", "version");
  }

  if (!isNonEmptyString(preview.entrypoint)) {
    return unavailable("inmemory-entrypoint-invalido", "input", "entrypoint");
  }

  const blocks = [];
  for (const [path, content] of entries) {
    if (typeof content !== "string") {
      return unavailable("inmemory-filecontent-nao-string", "input", "fileContents");
    }

    blocks.push(`--- FILE: ${path} ---\n${content}`);
  }

  const rawContent = blocks.join("\n\n");
  const verdict = readApprovedPreviewDiagnosticFromExplicitSnapshot({
    rawContent,
    id: preview.id,
    version: preview.version,
    entrypoint: preview.entrypoint,
  });

  return verdict;
}
