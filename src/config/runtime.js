/**
 * RUNTIME CONFIGURATION - RKMMAX
 * Configuração centralizada de runtime para separação estrutural entre PRODUÇÃO e TESTE
 * 
 * IMPORTANTE:
 * - Em PRODUÇÃO: timeout de 9s (padrão para CircuitBreaker e operações gerais)
 * - Em TESTE: timeout de 1s (testes rápidos e determinísticos)
 * 
 * Esta separação permite:
 * - Manter proteção anti-timeout em produção (9s)
 * - Executar testes rapidamente sem timeouts reais (1s)
 * - Separação limpa de ambiente via NODE_ENV
 * 
 * TETO DA PLATAFORMA: maxDuration Vercel = 25s
 * Os circuit breakers por provider no serginho-orchestrator.js têm timeouts
 * diferenciados (6s–20s), todos abaixo do teto de 25s.
 * 
 * NÃO ALTERAR valores de produção sem análise de impacto no plano.
 */

/**
 * Detecta ambiente de execução
 * @returns {string} 'test' | 'production' | 'development'
 */
export function getEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * Verifica se está rodando em ambiente de teste
 * @returns {boolean}
 */
export function isTestEnvironment() {
  return getEnvironment() === 'test';
}

/**
 * Verifica se está rodando em ambiente de produção
 * @returns {boolean}
 */
export function isProductionEnvironment() {
  return getEnvironment() === 'production';
}

/**
 * Configuração de runtime centralizada
 */
export const RUNTIME_CONFIG = {
  /**
   * Timeout para CircuitBreaker e operações de IA (uso geral)
   * 
   * PRODUÇÃO: 9000ms (9s) — padrão para providers não mapeados explicitamente
   * TESTE: 1000ms (1s) - Testes rápidos com mocks
   * 
   * NOTA: Providers específicos do Híbrido têm timeouts diferenciados no
   * serginho-orchestrator.js (6s–20s), todos abaixo do maxDuration da Vercel (25s).
   * CRÍTICO: Não alterar valor de produção sem análise de impacto
   */
  TIMEOUT_MS: isTestEnvironment() ? 1000 : 9000,

  /**
   * Timeout para reset do CircuitBreaker
   * 
   * PRODUÇÃO: 30000ms (30s) - Cooldown adequado
   * TESTE: 5000ms (5s) - Testes rápidos
   */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: isTestEnvironment() ? 5000 : 30000,

  /**
   * Threshold de falhas para abrir CircuitBreaker
   * 
   * PRODUÇÃO: 3 falhas
   * TESTE: 3 falhas (mesmo comportamento)
   */
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 3,

  /**
   * Ambiente atual
   */
  ENVIRONMENT: getEnvironment(),

  /**
   * Flags de ambiente
   */
  IS_TEST: isTestEnvironment(),
  IS_PRODUCTION: isProductionEnvironment(),
  IS_DEVELOPMENT: getEnvironment() === 'development',
};

/**
 * Exporta configuração como default
 */
export default RUNTIME_CONFIG;
