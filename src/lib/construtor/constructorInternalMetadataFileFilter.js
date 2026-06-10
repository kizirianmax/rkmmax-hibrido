function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function shouldRemoveInternalMetadataPath(path) {
  if (typeof path !== "string") {
    return false;
  }

  const normalizedPath = path.trim();
  if (!normalizedPath) {
    return false;
  }

  if (normalizedPath.startsWith("logs/")) {
    return true;
  }

  return normalizedPath === "README.md" || normalizedPath === "manifest.json";
}

export function filterConstructorInternalMetadataFiles(fileContents) {
  if (!isPlainObject(fileContents)) {
    return {};
  }

  return Object.entries(fileContents).reduce((accumulator, [path, content]) => {
    if (!shouldRemoveInternalMetadataPath(path)) {
      accumulator[path] = content;
    }

    return accumulator;
  }, {});
}
