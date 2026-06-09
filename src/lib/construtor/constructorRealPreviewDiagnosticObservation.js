import { readApprovedPreviewDiagnosticFromInMemoryPreview } from "./constructorInMemoryPreviewSnapshotAdapter.js";

const UNAVAILABLE_STATUS = "constructor-real-preview-diagnostic-observation: unavailable";
const EXECUTION_FLAG_KEY = "execute" + "ArtifactServerSide";

function unavailable(reason, path) {
  return {
    ok: false,
    status: UNAVAILABLE_STATUS,
    verdict: "unavailable",
    stage: "input",
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

export function inferEntrypointFromFileContents(fileContents) {
  const filePaths = Object.keys(fileContents)
    .filter(isNonEmptyString)
    .map((value) => value.trim());
  const preferred = ["index.js", "index.mjs", "index.html", "content.md"];

  for (const path of preferred) {
    if (filePaths.includes(path)) {
      return path;
    }
  }

  return filePaths[0] || "";
}

export function observeConstructorRealPreviewDiagnostic(preview) {
  if (!isPlainObject(preview)) {
    return unavailable("real-preview-invalido", "preview");
  }

  if (!isPlainObject(preview.summary)) {
    return unavailable("real-preview-summary-invalido", "summary");
  }

  if (!isPlainObject(preview.summary.fileContents)) {
    return unavailable("real-preview-filecontents-invalido", "summary.fileContents");
  }

  const entrypoint = inferEntrypointFromFileContents(preview.summary.fileContents);
  if (!isNonEmptyString(entrypoint)) {
    return unavailable("real-preview-filecontents-vazio", "summary.fileContents");
  }

  return readApprovedPreviewDiagnosticFromInMemoryPreview({
    fileContents: preview.summary.fileContents,
    id: preview.summary.id,
    version: preview.summary.version,
    entrypoint,
  });
}
