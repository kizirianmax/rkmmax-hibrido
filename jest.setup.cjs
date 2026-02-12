/**
 * JEST SETUP - PARTE 2
 * Configuração global de testes para detectar exceções não tratadas
 */

// ============================================
// 1. DETECTAR UNHANDLED PROMISE REJECTIONS
// ============================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection detectada!');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  
  // FALHAR O TESTE
  throw new Error(`Unhandled Promise Rejection: ${reason}`);
});

// ============================================
// 2. DETECTAR UNCAUGHT EXCEPTIONS
// ============================================
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception detectada!');
  console.error('Error:', error);
  
  // FALHAR O TESTE
  throw error;
});

// ============================================
// 3. CONSOLE.ERROR ESTRITO
// ============================================
const originalConsoleError = console.error;

console.error = (...args) => {
  // Detectar padrões de erro graves
  const message = args.join(' ');
  
  if (
    message.includes('Warning: ') ||
    message.includes('Error: ') ||
    message.includes('Unhandled')
  ) {
    // Log original
    originalConsoleError(...args);
    
    // FALHAR se for um erro crítico
    if (message.includes('Unhandled') || message.includes('uncaught')) {
      throw new Error(`Critical error detected: ${message}`);
    }
  } else {
    // Log normal para warnings não críticos
    originalConsoleError(...args);
  }
};

// ============================================
// 4. TIMEOUT GLOBAL PARA EVITAR TESTES TRAVADOS
// ============================================
jest.setTimeout(10000); // 10 segundos

// ============================================
// 5. CLEANUP AUTOMÁTICO APÓS CADA TESTE
// ============================================
afterEach(() => {
  // Limpar todos os mocks
  jest.clearAllMocks();
  
  // Limpar timers
  jest.clearAllTimers();
});

console.log('✅ Jest setup carregado com detecção de exceções');
