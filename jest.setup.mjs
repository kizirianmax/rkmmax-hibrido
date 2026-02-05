/**
 * JEST SETUP - CONFIGURAÇÃO INICIAL E LIMPEZA
 * 
 * Executa antes de cada suite de testes para:
 * - Aumentar file descriptor limit
 * - Configurar timeouts
 * - Limpar recursos
 * - Configurar mocks globais
 */

// ============================================
// 1. AUMENTAR FILE DESCRIPTOR LIMIT
// ============================================
import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';

try {
  // Tentar aumentar limite (pode falhar em alguns ambientes)
  execSync('ulimit -n 4096', { stdio: 'ignore' });
} catch (e) {
  // Ignorar erro se não conseguir
}

// ============================================
// 2. SUPRIMIR WARNINGS
// ============================================
const originalWarn = console.warn;
const originalError = console.error;

// Suprimir warnings não críticos
console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Ignorar warnings conhecidos
  if (
    message.includes('ExperimentalWarning') ||
    message.includes('DeprecationWarning') ||
    message.includes('MaxListenersExceededWarning')
  ) {
    return;
  }
  
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Ignorar erros não críticos
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT')
  ) {
    return;
  }
  
  originalError.apply(console, args);
};

// ============================================
// 3. CLEANUP GLOBAL APÓS TESTES
// ============================================
afterAll(async () => {
  // Limpar timers pendentes
  // Note: jest.clearAllTimers() removed as it's not available in ES module setup
  
  // Fechar conexões
  if (global.agent) {
    global.agent.destroy();
  }
  
  // Limpar cache
  if (global.cache) {
    global.cache.clear();
  }
  
  // Aguardar um pouco para limpeza
  await new Promise(resolve => setTimeout(resolve, 100));
});

// ============================================
// 4. CONFIGURAR MOCKS GLOBAIS
// ============================================

// Note: Mocks are commented out as they need to be in test files in ES module mode
// Mock de fetch (se não disponível)
// if (typeof global.fetch === 'undefined') {
//   global.fetch = jest.fn();
// }

// Mock de localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
global.localStorage = localStorageMock;

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
global.sessionStorage = sessionStorageMock;

// ============================================
// 5. CONFIGURAR VARIÁVEIS DE AMBIENTE
// ============================================
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_URL = 'http://localhost:3000';
process.env.REACT_APP_GITHUB_TOKEN = 'test-token';
process.env.REACT_APP_DEBUG_MODE = 'false';

// ============================================
// 6. CONFIGURAR HANDLERS DE ERRO
// ============================================

// Capturar unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Capturar uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// ============================================
// 7. CONFIGURAR PERFORMANCE MONITORING
// ============================================
const testStartTime = Date.now();

afterAll(() => {
  const duration = Date.now() - testStartTime;
  console.log(`\n⏱️  Test suite completed in ${duration}ms`);
  
  // Avisar se testes demoraram muito
  if (duration > 30000) {
    console.warn('⚠️  Test suite took longer than 30 seconds');
  }
});

// ============================================
// 8. CONFIGURAR MEMORY MONITORING
// ============================================
const initialMemory = process.memoryUsage();

afterAll(() => {
  const finalMemory = process.memoryUsage();
  const heapUsed = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
  
  console.log(`\n💾 Memory delta: ${heapUsed.toFixed(2)} MB`);
  
  // Avisar se memory leak
  if (heapUsed > 50) {
    console.warn('⚠️  Possible memory leak detected');
  }
});

// ============================================
// 9. RESTAURAR CONSOLE APÓS TESTES
// ============================================
afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
