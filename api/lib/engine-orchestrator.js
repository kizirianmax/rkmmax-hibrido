/**
 * @deprecated Phase A5 — Fail-Fast Enforcement (hard-ban)
 * Use `api/lib/serginho-orchestrator.js` instead.
 * This file is retained to avoid breaking unknown references but must NOT be
 * imported by any route handler.
 */

/**
 * Orquestrar chamadas paralelas aos engines
 * @deprecated Phase A5 — throws immediately; no provider calls will execute.
 */
export async function orchestrateEngines() {
  throw new Error('Deprecated: Use serginho-orchestrator.js as the single AI gateway (Phase A5).');
}
