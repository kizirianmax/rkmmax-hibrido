/**
 * JEST SETUP - CORRIGIDO
 */

// Configurar timezone para testes consistentes
process.env.TZ = 'UTC';

// Desabilitar warnings de deprecation do Node
process.env.NODE_NO_WARNINGS = '1';

// ============================================
// 1. SUPRIMIR CONSOLE.ERROR EM TESTES
// ============================================
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  const message = args.join(' ');
  
  // Suprimir warnings esperados do React e Jest
  if (
    message.includes('Warning: ReactDOM.render') ||
    message.includes('Warning: useLayoutEffect') ||
    message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
    message.includes('ExperimentalWarning')
  ) {
    return;
  }
  
  originalConsoleError(...args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  
  // Suprimir warnings esperados
  if (
    message.includes('componentWillReceiveProps') ||
    message.includes('componentWillMount')
  ) {
    return;
  }
  
  originalConsoleWarn(...args);
};

// ============================================
// 2. GLOBAL MOCKS
// ============================================

// Mock do localStorage
const localStorageData = {};
global.localStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, value) => { localStorageData[key] = value; },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { Object.keys(localStorageData).forEach(key => delete localStorageData[key]); },
};

// Mock do sessionStorage
const sessionStorageData = {};
global.sessionStorage = {
  getItem: (key) => sessionStorageData[key] || null,
  setItem: (key, value) => { sessionStorageData[key] = value; },
  removeItem: (key) => { delete sessionStorageData[key]; },
  clear: () => { Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]); },
};

// Mock do fetch (se não estiver usando node-fetch)
if (!global.fetch) {
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
}

console.log('✅ Jest setup loaded successfully');
