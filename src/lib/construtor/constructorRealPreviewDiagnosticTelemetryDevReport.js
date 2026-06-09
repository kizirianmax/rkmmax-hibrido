function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function asSafeCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function serializeCountMap(value) {
  if (!isPlainObject(value)) {
    return "{}";
  }

  const safeMap = Object.entries(value).reduce((accumulator, [key, count]) => {
    if (typeof key !== "string" || key.length === 0) {
      return accumulator;
    }

    if (typeof count !== "number" || !Number.isFinite(count)) {
      return accumulator;
    }

    accumulator[key] = count;
    return accumulator;
  }, {});

  return JSON.stringify(safeMap);
}

export function formatRealPreviewDiagnosticTelemetrySnapshotForDev(snapshot) {
  const safeSnapshot = isPlainObject(snapshot) ? snapshot : {};

  const total = asSafeCount(safeSnapshot.total);
  const eligible = asSafeCount(safeSnapshot.eligible);
  const unavailable = asSafeCount(safeSnapshot.unavailable);
  const byReason = serializeCountMap(safeSnapshot.byReason);
  const byStatus = serializeCountMap(safeSnapshot.byStatus);

  return `[construtor:real-preview-telemetry][dev] total=${total} eligible=${eligible} unavailable=${unavailable} byReason=${byReason} byStatus=${byStatus}`;
}
