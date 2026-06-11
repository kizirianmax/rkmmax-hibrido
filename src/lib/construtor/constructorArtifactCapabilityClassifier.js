import { filterConstructorInternalMetadataFiles } from "./constructorInternalMetadataFileFilter.js";

const PATH_UNSAFE_REGEX = /(^\/)|(^\/tmp\/)|\\/;
const WINDOWS_ABSOLUTE_PATH_REGEX = /^[A-Za-z]:[\\/]/;
const DOM_ACCESS_REGEX =
  /\b(?:document|window|navigator|location)\b|\b(?:addEventListener|querySelector|getElementById)\b/;
const EXTERNAL_NETWORK_REGEX = /\bfetch\s*\(\s*["'`]\s*(?:https?:)?\/\/|\bhttps?:\/\//i;
const EXTERNAL_IMPORT_REGEX =
  /\bimport\s*\(\s*["'`]\s*(?:https?:)?\/\/|\bimport\s+[\s\S]*?\bfrom\s*["'`]\s*(?:https?:)?\/\/|\brequire\s*\(\s*["'`]\s*(?:https?:)?\/\//i;
const UNSAFE_CODE_REGEX = /\beval\s*\(|\bFunction\s*\(/;
const DYNAMIC_ACCESS_EVASIVE_REGEX = /\b(?:globalThis|self)\b|\[\s*["'`]|\[[^\]]*\+/;
const INLINE_SCRIPT_REGEX = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi;

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeClassifierInput(input) {
  if (isPlainObject(input?.fileContents)) {
    return {
      fileContents: input.fileContents,
      entrypoint: input.entrypoint,
      validation: input.validation,
    };
  }

  if (isPlainObject(input)) {
    return {
      fileContents: input,
      entrypoint: undefined,
      validation: undefined,
    };
  }

  return {
    fileContents: {},
    entrypoint: undefined,
    validation: undefined,
  };
}

function buildFlags(entries) {
  let hasHtml = false;
  let hasCss = false;
  let hasJs = false;
  let hasDomAccess = false;
  let hasDynamicAccess = false;
  let hasExternalNetwork = false;
  let hasExternalImport = false;
  let hasInlineScript = false;
  let hasUnsafePath = false;

  for (const [path, content] of entries) {
    if (typeof path !== "string" || path.trim() !== path || path.length === 0) {
      hasUnsafePath = true;
      continue;
    }

    if (PATH_UNSAFE_REGEX.test(path) || WINDOWS_ABSOLUTE_PATH_REGEX.test(path) || path.split("/").includes("..")) {
      hasUnsafePath = true;
    }

    if (path.endsWith(".html")) {
      hasHtml = true;
      if (typeof content === "string") {
        let inlineScriptMatch = INLINE_SCRIPT_REGEX.exec(content);
        while (inlineScriptMatch) {
          if ((inlineScriptMatch[1] || "").trim().length > 0) {
            hasInlineScript = true;
            break;
          }
          inlineScriptMatch = INLINE_SCRIPT_REGEX.exec(content);
        }
        INLINE_SCRIPT_REGEX.lastIndex = 0;
      }
    }

    if (path.endsWith(".css")) {
      hasCss = true;
    }

    if (typeof content === "string" && EXTERNAL_NETWORK_REGEX.test(content)) {
      hasExternalNetwork = true;
    }

    if (!path.endsWith(".js") || typeof content !== "string") {
      continue;
    }

    hasJs = true;

    if (DOM_ACCESS_REGEX.test(content)) {
      hasDomAccess = true;
    }

    if (DYNAMIC_ACCESS_EVASIVE_REGEX.test(content)) {
      hasDynamicAccess = true;
    }

    if (EXTERNAL_IMPORT_REGEX.test(content)) {
      hasExternalImport = true;
    }
  }

  return {
    hasHtml,
    hasCss,
    hasJs,
    hasDomAccess,
    hasDynamicAccess,
    hasExternalNetwork,
    hasExternalImport,
    hasInlineScript,
    hasUnsafePath,
  };
}

function blockedVerdict(flags, reasons) {
  return {
    capability: "blocked",
    reasons,
    flags,
  };
}

export function classifyConstructorArtifactCapability(input) {
  const normalizedInput = normalizeClassifierInput(input);
  const metadataFilteredFiles = filterConstructorInternalMetadataFiles(normalizedInput.fileContents);
  const entries = Object.entries(metadataFilteredFiles);
  const flags = buildFlags(entries);

  if (flags.hasUnsafePath) {
    return blockedVerdict(flags, ["unsafe-path-detected"]);
  }

  if (isPlainObject(normalizedInput.validation) && normalizedInput.validation.ok === false) {
    return blockedVerdict(flags, ["validation-failed"]);
  }

  const hasUnsafeCode = entries.some(
    ([path, content]) => path.endsWith(".js") && typeof content === "string" && UNSAFE_CODE_REGEX.test(content)
  );
  if (hasUnsafeCode) {
    return blockedVerdict(flags, ["unsafe-code-detected"]);
  }

  if (flags.hasDynamicAccess) {
    return blockedVerdict(flags, ["conteudo-com-acesso-dinamico"]);
  }

  if (flags.hasExternalNetwork) {
    return blockedVerdict(flags, ["external-network-detected"]);
  }

  if (flags.hasExternalImport) {
    return blockedVerdict(flags, ["external-import-detected"]);
  }

  if (flags.hasInlineScript) {
    return blockedVerdict(flags, ["inline-script-detected"]);
  }

  if (flags.hasDomAccess && normalizedInput.entrypoint !== "content.md") {
    if (flags.hasHtml) {
      return {
        capability: "executable-client",
        reasons: ["dom-access-with-html-detected"],
        flags,
      };
    }

    return blockedVerdict(flags, ["dom-access-without-html"]);
  }

  if (flags.hasHtml && flags.hasCss && !flags.hasJs) {
    return {
      capability: "previewable-static",
      reasons: ["html-css-without-javascript"],
      flags,
    };
  }

  if (flags.hasJs) {
    return {
      capability: "exportable",
      reasons: ["javascript-without-dom-access"],
      flags,
    };
  }

  return {
    capability: "exportable",
    reasons: ["read-only-exportable-artifact"],
    flags,
  };
}
