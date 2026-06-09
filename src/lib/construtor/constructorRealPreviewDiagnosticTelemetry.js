function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function createRealPreviewDiagnosticTelemetry() {
  const counters = {
    total: 0,
    eligible: 0,
    unavailable: 0,
    byReason: {},
    byStatus: {},
  };

  const record = (verdictResult) => {
    try {
      if (!isPlainObject(verdictResult)) {
        return;
      }

      const verdict = verdictResult.verdict;
      if (verdict !== "eligible" && verdict !== "unavailable") {
        return;
      }

      counters.total += 1;
      counters[verdict] += 1;

      const reason = verdictResult.reason;
      if (isNonEmptyString(reason)) {
        counters.byReason[reason] = (counters.byReason[reason] || 0) + 1;
      }

      const status = verdictResult.status;
      if (isNonEmptyString(status)) {
        counters.byStatus[status] = (counters.byStatus[status] || 0) + 1;
      }
    } catch {
      // telemetria interna deve ser sempre não-bloqueante
    }
  };

  const snapshot = () => ({
    total: counters.total,
    eligible: counters.eligible,
    unavailable: counters.unavailable,
    byReason: { ...counters.byReason },
    byStatus: { ...counters.byStatus },
  });

  return {
    record,
    snapshot,
  };
}
