function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toSafeCount(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}

function sanitizeCountMap(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.entries(value).reduce((safeMap, [key, count]) => {
    if (typeof key !== "string" || key.trim().length === 0) {
      return safeMap;
    }

    const normalizedCount = Number(count);
    if (!Number.isFinite(normalizedCount)) {
      return safeMap;
    }

    safeMap[key] = normalizedCount;
    return safeMap;
  }, {});
}

export function shouldShowConstructorTelemetryDiagnostics(search) {
  if (typeof search !== "string") {
    return false;
  }

  try {
    const normalizedSearch = search.replace(/^[?&]+/, "");
    if (normalizedSearch.length === 0) {
      return false;
    }

    const params = new URLSearchParams(normalizedSearch);
    return params.get("constructorTelemetry") === "1";
  } catch {
    return false;
  }
}

export function sanitizeConstructorTelemetrySnapshotForDiagnostics(snapshot) {
  if (!isPlainObject(snapshot)) {
    return {
      total: 0,
      eligible: 0,
      unavailable: 0,
      byReason: {},
      byStatus: {},
    };
  }

  return {
    total: toSafeCount(snapshot.total),
    eligible: toSafeCount(snapshot.eligible),
    unavailable: toSafeCount(snapshot.unavailable),
    byReason: sanitizeCountMap(snapshot.byReason),
    byStatus: sanitizeCountMap(snapshot.byStatus),
  };
}
