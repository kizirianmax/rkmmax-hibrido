import {
  REVIEW_CYCLE_STORAGE_KEY,
  REVIEW_CYCLE_STORAGE_TTL_MS,
  loadReviewCycleState,
  saveReviewCycleState,
  clearReviewCycleState,
} from '../reviewCycleStorage.js';

let store = {};
const sessionStorageMock = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { store = {}; },
};

beforeEach(() => {
  store = {};
  Object.defineProperty(globalThis, 'window', {
    value: { sessionStorage: sessionStorageMock },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  store = {};
});

describe('reviewCycleStorage', () => {
  it('salva e restaura estado mínimo compatível com a mensagem atual', () => {
    const now = Date.now();

    saveReviewCycleState({
      messageKey: 42,
      lastAdjustment: { category: 'conteudo', focusFile: 'index.html', comment: 'corrigir título' },
      decision: 'pending',
      updatedAt: now,
    });

    const restored = loadReviewCycleState({ currentMessageKey: 42, now });
    expect(restored).toEqual({
      messageKey: 42,
      lastAdjustment: { category: 'conteudo', focusFile: 'index.html', comment: 'corrigir título' },
      decision: 'pending',
      updatedAt: now,
    });
  });

  it('não restaura quando a mensagem atual é incompatível', () => {
    saveReviewCycleState({
      messageKey: 10,
      lastAdjustment: { comment: 'ajuste' },
      decision: 'pending',
      updatedAt: Date.now(),
    });

    expect(loadReviewCycleState({ currentMessageKey: 11 })).toBeNull();
  });

  it('remove dado inválido com JSON corrompido', () => {
    store[REVIEW_CYCLE_STORAGE_KEY] = '{invalid-json';

    expect(loadReviewCycleState({ currentMessageKey: 1 })).toBeNull();
    expect(store[REVIEW_CYCLE_STORAGE_KEY]).toBeUndefined();
  });

  it('expira dados antigos e remove do storage', () => {
    const now = Date.now();
    saveReviewCycleState({
      messageKey: 9,
      lastAdjustment: { comment: 'antigo' },
      decision: 'pending',
      updatedAt: now - REVIEW_CYCLE_STORAGE_TTL_MS - 1,
    });

    expect(loadReviewCycleState({ currentMessageKey: 9, now })).toBeNull();
    expect(store[REVIEW_CYCLE_STORAGE_KEY]).toBeUndefined();
  });

  it('limpa explicitamente o estado salvo', () => {
    saveReviewCycleState({
      messageKey: 7,
      lastAdjustment: { comment: 'temp' },
      decision: 'pending',
    });

    clearReviewCycleState();
    expect(store[REVIEW_CYCLE_STORAGE_KEY]).toBeUndefined();
  });

  it('não quebra sem window/sessionStorage', () => {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    });

    expect(() => saveReviewCycleState({ messageKey: 1, decision: 'pending' })).not.toThrow();
    expect(() => clearReviewCycleState()).not.toThrow();
    expect(loadReviewCycleState({ currentMessageKey: 1 })).toBeNull();
  });

  it('descarta payload antigo/excessivo no carregamento para evitar crescimento indevido', () => {
    store[REVIEW_CYCLE_STORAGE_KEY] = 'x'.repeat(5000);

    expect(loadReviewCycleState({ currentMessageKey: 12 })).toBeNull();
    expect(store[REVIEW_CYCLE_STORAGE_KEY]).toBeUndefined();
  });
});
