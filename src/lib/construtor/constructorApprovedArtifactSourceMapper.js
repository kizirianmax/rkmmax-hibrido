import { buildApprovedConstructorArtifactFromSource } from "./approvedConstructorArtifactSource.js";

const UNAVAILABLE_STATUS = "constructor-approved-artifact-source: unavailable";
const ELIGIBLE_STATUS = "constructor-approved-artifact-source: eligible";

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
    sourceType: "constructor-memory-client-safe-source",
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

function inspectMapperForbiddenFields(value, path = "") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = inspectMapperForbiddenFields(value[index], `${path}[${index}]`);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;

    if (/^backend$/i.test(key)) {
      return { reason: "dependencia-backend-nao-permitida", path: nextPath };
    }

    if (/^executeArtifact$/i.test(key)) {
      return { reason: "execucao-server-side-nao-permitida", path: nextPath };
    }

    if (key === "agentMessage" && isPlainObject(nestedValue) && hasOwnProperty(nestedValue, "content")) {
      return { reason: "campo-agentmessage-content-nao-permitido", path: `${nextPath}.content` };
    }

    const nested = inspectMapperForbiddenFields(nestedValue, nextPath);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function mapSnapshotToSource(snapshot) {
  return {
    ...snapshot,
    id: snapshot.id,
    version: snapshot.version,
    approval: snapshot.approval,
    entrypoint: snapshot.entrypoint,
    files: snapshot.files,
    ...(snapshot.manifest === undefined ? {} : { manifest: snapshot.manifest }),
  };
}

export function mapConstructorStateToApprovedArtifactSource(snapshot) {
  if (!isPlainObject(snapshot)) {
    return unavailable("constructor-snapshot-invalido");
  }

  const forbidden = inspectMapperForbiddenFields(snapshot);
  if (forbidden) {
    return unavailable(forbidden.reason, forbidden.path);
  }

  const source = mapSnapshotToSource(snapshot);
  const gatedArtifact = buildApprovedConstructorArtifactFromSource(source);

  if (!gatedArtifact.ok) {
    return unavailable(gatedArtifact.reason, gatedArtifact.path);
  }

  return eligible(gatedArtifact.artifact);
}
