/**
 * F3-03 — Persistência local mínima e segura do ciclo atual de revisão.
 * Armazena apenas: último ajuste solicitado, decisão atual, chave local da mensagem e timestamp.
 */

export const REVIEW_CYCLE_STORAGE_KEY = 'construtor_review_cycle';
export const REVIEW_CYCLE_STORAGE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

const REVIEW_CYCLE_SCHEMA_VERSION = 1;
const REVIEW_CYCLE_MAX_BYTES = 2048;
const ALLOWED_DECISIONS = new Set(['pending', 'approved', 'rejected']);

const normalizeText = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const normalizeAdjustment = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const category = normalizeText(value.category, 80);
  const focusFile = normalizeText(value.focusFile, 300);
  const comment = normalizeText(value.comment, 1000);
  if (!category && !focusFile && !comment) return null;
  return { category, focusFile, comment };
};

const normalizeDecision = (value) => {
  if (typeof value !== 'string') return null;
  return ALLOWED_DECISIONS.has(value) ? value : null;
};

const normalizeMessageKey = (value) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
};

const getSafeStorage = () => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const safelyRemoveStorageKey = (storage) => {
  try {
    storage.removeItem(REVIEW_CYCLE_STORAGE_KEY);
  } catch { /* ignorar */ }
};

export const loadReviewCycleState = ({ currentMessageKey, now = Date.now() } = {}) => {
  const storage = getSafeStorage();
  if (!storage) return null;

  let raw;
  try {
    raw = storage.getItem(REVIEW_CYCLE_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!raw) return null;

  if (raw.length > REVIEW_CYCLE_MAX_BYTES) {
    safelyRemoveStorageKey(storage);
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safelyRemoveStorageKey(storage);
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || parsed.v !== REVIEW_CYCLE_SCHEMA_VERSION) {
    safelyRemoveStorageKey(storage);
    return null;
  }

  const updatedAt = Number(parsed.updatedAt);
  if (!Number.isFinite(updatedAt) || updatedAt <= 0 || now - updatedAt > REVIEW_CYCLE_STORAGE_TTL_MS) {
    safelyRemoveStorageKey(storage);
    return null;
  }

  const messageKey = normalizeMessageKey(parsed.messageKey);
  const expectedMessageKey = normalizeMessageKey(currentMessageKey);
  if (expectedMessageKey == null || messageKey == null || expectedMessageKey !== messageKey) {
    return null;
  }

  const lastAdjustment = normalizeAdjustment(parsed.lastAdjustment);
  const decision = normalizeDecision(parsed.decision);

  if (!lastAdjustment && !decision) {
    safelyRemoveStorageKey(storage);
    return null;
  }

  return { messageKey, lastAdjustment, decision, updatedAt };
};

export const saveReviewCycleState = ({ messageKey, lastAdjustment, decision, updatedAt = Date.now() } = {}) => {
  const storage = getSafeStorage();
  if (!storage) return;

  const normalizedMessageKey = normalizeMessageKey(messageKey);
  const normalizedAdjustment = normalizeAdjustment(lastAdjustment);
  const normalizedDecision = normalizeDecision(decision);
  const normalizedUpdatedAt = Number.isFinite(Number(updatedAt)) && Number(updatedAt) > 0
    ? Number(updatedAt)
    : Date.now();

  if (normalizedMessageKey == null || (!normalizedAdjustment && !normalizedDecision)) {
    safelyRemoveStorageKey(storage);
    return;
  }

  const payload = {
    v: REVIEW_CYCLE_SCHEMA_VERSION,
    messageKey: normalizedMessageKey,
    lastAdjustment: normalizedAdjustment,
    decision: normalizedDecision,
    updatedAt: normalizedUpdatedAt,
  };

  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length > REVIEW_CYCLE_MAX_BYTES) {
      safelyRemoveStorageKey(storage);
      return;
    }
    storage.setItem(REVIEW_CYCLE_STORAGE_KEY, serialized);
  } catch { /* sessionStorage indisponível ou cheio */ }
};

export const clearReviewCycleState = () => {
  const storage = getSafeStorage();
  if (!storage) return;
  safelyRemoveStorageKey(storage);
};
