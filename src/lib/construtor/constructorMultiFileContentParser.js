const UNAVAILABLE_STATUS = "constructor-multifile-parser: unavailable";
const PARSED_STATUS = "constructor-multifile-parser: parsed";
const SOURCE_TYPE = "constructor-multifile-content-client-safe-source";

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

function isDangerousPath(name) {
  if (name.includes("\\")) {
    return true;
  }

  if (name.includes("//")) {
    return true;
  }

  if (name.startsWith("/")) {
    return true;
  }

  if (/^[a-zA-Z]:[\\/]/.test(name)) {
    return true;
  }

  if (name.includes("../")) {
    return true;
  }

  const segments = name.split("/");
  return segments.some((segment) => segment === "..");
}

export function parseConstructorMultiFileContentToStructuredFiles(input) {
  if (typeof input !== "string") {
    return unavailable("multifile-input-invalido");
  }

  const fileDelimiter = /^---\s*FILE:\s*(.*?)\s*---\s*$/gm;
  const matches = [...input.matchAll(fileDelimiter)];

  if (matches.length === 0) {
    return unavailable("multifile-sem-delimitadores");
  }

  const files = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const name = match[1].trim();

    if (name.length === 0) {
      return unavailable("multifile-nome-invalido");
    }

    if (isDangerousPath(name)) {
      return unavailable("caminho-perigoso", name);
    }

    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : input.length;
    const body = input.slice(start, end).trim();

    if (body.length === 0) {
      return unavailable("multifile-body-vazio");
    }

    files.push({ name, body });
  }

  return {
    ok: true,
    status: PARSED_STATUS,
    sourceType: SOURCE_TYPE,
    files,
    fileCount: files.length,
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}
