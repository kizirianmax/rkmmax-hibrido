import { selectConstructorApprovedArtifactSnapshotInput } from "./constructorApprovedArtifactPreviewSelector.js";

const UNAVAILABLE_STATUS = "constructor-approved-preview-summary-builder: unavailable";
const ELIGIBLE_STATUS = "constructor-approved-preview-summary-builder: eligible";

function unavailable(reason, path) {
  return {
    ok: false,
    status: UNAVAILABLE_STATUS,
    reason,
    ...(path ? { path } : {}),
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}

function eligible(artifact) {
  return {
    ok: true,
    status: ELIGIBLE_STATUS,
    sourceType: "constructor-structured-files-client-safe-source",
    artifact,
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwnProperty(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function inspectForbiddenStructuredInput(value, path = "") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = inspectForbiddenStructuredInput(value[index], `${path}[${index}]`);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (typeof value === "string") {
    if (/\/api\//i.test(value)) {
      return { reason: "api-ou-rede-nao-permitida", path: path || "value" };
    }
    if (/\b(?:sessionStorage|localStorage)\b/i.test(value)) {
      return { reason: "fonte-storage-nao-permitida", path: path || "value" };
    }
    if (/\bbackend\b/i.test(value)) {
      return { reason: "dependencia-backend-nao-permitida", path: path || "value" };
    }
    if (/\bexecuteArtifact\b/i.test(value)) {
      return { reason: "execucao-server-side-nao-permitida", path: path || "value" };
    }
    if (/\bagentMessage\.content\b/i.test(value)) {
      return { reason: "campo-agentmessage-content-nao-permitido", path: path || "value" };
    }
    if (/\b(?:rawPayload|payloadRaw|realPayload|payloadBruto)\b/i.test(value)) {
      return { reason: "payload-bruto-nao-permitido", path: path || "value" };
    }
    if (/\b(?:token|secret|apiKey|password|authorization|bearer)\b/i.test(value)) {
      return { reason: "campo-sensivel-nao-permitido", path: path || "value" };
    }
    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;

    if (key === "agentMessage" && isPlainObject(nestedValue) && hasOwnProperty(nestedValue, "content")) {
      return { reason: "campo-agentmessage-content-nao-permitido", path: `${nextPath}.content` };
    }

    if (/^agentMessage\.content$/i.test(key)) {
      return { reason: "campo-agentmessage-content-nao-permitido", path: nextPath };
    }

    if (/^(content|contentPreview|zipBase64|user_email)$/i.test(key)) {
      return { reason: "payload-sensivel-nao-permitido", path: nextPath };
    }

    if (/^(rawPayload|payloadRaw|realPayload|payloadBruto)$/i.test(key)) {
      return { reason: "payload-bruto-nao-permitido", path: nextPath };
    }

    if (/^(token|secret|apiKey|password|authorization|bearer)$/i.test(key)) {
      return { reason: "campo-sensivel-nao-permitido", path: nextPath };
    }

    if (/^backend$/i.test(key)) {
      return { reason: "dependencia-backend-nao-permitida", path: nextPath };
    }

    if (/^executeArtifact$/i.test(key)) {
      return { reason: "execucao-server-side-nao-permitida", path: nextPath };
    }

    if (/^(sessionStorage|localStorage)$/i.test(key)) {
      return { reason: "fonte-storage-nao-permitida", path: nextPath };
    }

    if (/^\/api\/$/i.test(key)) {
      return { reason: "api-ou-rede-nao-permitida", path: nextPath };
    }

    const nested = inspectForbiddenStructuredInput(nestedValue, nextPath);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function buildPreviewSummaryFromStructuredFiles(input) {
  const fileContents = {};

  for (let index = 0; index < input.files.length; index += 1) {
    const file = input.files[index];

    if (!isPlainObject(file)) {
      return unavailable("structured-file-invalido", `files[${index}]`);
    }

    if (typeof file.name !== "string" || file.name.trim().length === 0) {
      return unavailable("structured-file-sem-name", `files[${index}].name`);
    }

    if (typeof file.body !== "string") {
      return unavailable("structured-file-sem-body", `files[${index}].body`);
    }

    fileContents[file.name] = file.body;
  }

  return {
    id: input.id,
    version: input.version,
    entrypoint: input.entrypoint,
    fileContents,
    ...(hasOwnProperty(input, "origin") ? { origin: input.origin } : {}),
  };
}

export function buildConstructorApprovedPreviewSummaryFromStructuredFiles(input) {
  if (!isPlainObject(input)) {
    return unavailable("structured-input-invalido");
  }

  const forbidden = inspectForbiddenStructuredInput(input);
  if (forbidden) {
    return unavailable(forbidden.reason, forbidden.path);
  }

  if (typeof input.id !== "string" || input.id.trim().length === 0) {
    return unavailable("structured-input-sem-id", "id");
  }

  if (typeof input.version !== "string" || input.version.trim().length === 0) {
    return unavailable("structured-input-sem-version", "version");
  }

  if (typeof input.entrypoint !== "string" || input.entrypoint.trim().length === 0) {
    return unavailable("structured-input-sem-entrypoint", "entrypoint");
  }

  if (!hasOwnProperty(input, "files")) {
    return unavailable("structured-input-sem-files", "files");
  }

  if (!Array.isArray(input.files)) {
    return unavailable("structured-input-files-invalido", "files");
  }

  const previewSummary = buildPreviewSummaryFromStructuredFiles(input);
  if (!previewSummary.ok && previewSummary.status === UNAVAILABLE_STATUS) {
    return previewSummary;
  }

  const selectorResult = selectConstructorApprovedArtifactSnapshotInput(previewSummary, "approved");

  if (!selectorResult.ok) {
    return unavailable(selectorResult.reason, selectorResult.path);
  }

  return eligible(selectorResult.artifact);
}
