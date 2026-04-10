/**
 * PASSO 12 — Testes unitários para helpers de persistência do rascunho
 * do campo de entrada (inputDraftStorage.js).
 */

import {
  INPUT_DRAFT_STORAGE_KEY,
  loadInputDraft,
  saveInputDraft,
  clearInputDraft,
} from '../inputDraftStorage.js';

// ─── Mock de sessionStorage ───────────────────────────────────────────────────
let store = {};
const sessionStorageMock = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { store = {}; },
};

beforeEach(() => {
  store = {};
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  store = {};
});

// ─── INPUT_DRAFT_STORAGE_KEY ──────────────────────────────────────────────────
describe('INPUT_DRAFT_STORAGE_KEY', () => {
  it('deve ser a string correta', () => {
    expect(INPUT_DRAFT_STORAGE_KEY).toBe('construtor_input_draft');
  });
});

// ─── loadInputDraft ───────────────────────────────────────────────────────────
describe('loadInputDraft', () => {
  it('retorna string vazia quando não há rascunho salvo', () => {
    expect(loadInputDraft()).toBe('');
  });

  it('retorna o texto previamente salvo', () => {
    store[INPUT_DRAFT_STORAGE_KEY] = 'meu rascunho';
    expect(loadInputDraft()).toBe('meu rascunho');
  });

  it('retorna string vazia se getItem retornar null', () => {
    expect(loadInputDraft()).toBe('');
  });

  it('retorna string vazia em caso de exceção no storage', () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      get() { throw new Error('storage indisponível'); },
      configurable: true,
    });
    expect(loadInputDraft()).toBe('');
  });
});

// ─── saveInputDraft ───────────────────────────────────────────────────────────
describe('saveInputDraft', () => {
  it('salva o texto no sessionStorage', () => {
    saveInputDraft('novo rascunho');
    expect(store[INPUT_DRAFT_STORAGE_KEY]).toBe('novo rascunho');
  });

  it('remove a entrada quando o texto é string vazia', () => {
    store[INPUT_DRAFT_STORAGE_KEY] = 'rascunho anterior';
    saveInputDraft('');
    expect(INPUT_DRAFT_STORAGE_KEY in store).toBe(false);
  });

  it('remove a entrada quando o texto é undefined', () => {
    store[INPUT_DRAFT_STORAGE_KEY] = 'rascunho anterior';
    saveInputDraft(undefined);
    expect(INPUT_DRAFT_STORAGE_KEY in store).toBe(false);
  });

  it('não lança exceção quando sessionStorage está indisponível', () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      get() { throw new Error('storage indisponível'); },
      configurable: true,
    });
    expect(() => saveInputDraft('texto')).not.toThrow();
  });
});

// ─── clearInputDraft ──────────────────────────────────────────────────────────
describe('clearInputDraft', () => {
  it('remove o rascunho do sessionStorage', () => {
    store[INPUT_DRAFT_STORAGE_KEY] = 'algo';
    clearInputDraft();
    expect(INPUT_DRAFT_STORAGE_KEY in store).toBe(false);
  });

  it('não lança exceção quando a chave não existe', () => {
    expect(() => clearInputDraft()).not.toThrow();
  });

  it('não lança exceção quando sessionStorage está indisponível', () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      get() { throw new Error('storage indisponível'); },
      configurable: true,
    });
    expect(() => clearInputDraft()).not.toThrow();
  });
});
