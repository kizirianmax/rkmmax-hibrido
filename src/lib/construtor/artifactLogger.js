/**
 * Gerador de logs estruturados para artefatos do Construtor/Híbrido
 *
 * Responsabilidade: produzir logs de geração e estrutura em formato JSON
 * para rastreabilidade dos artefatos gerados.
 */

/**
 * Gera o conteúdo de logs/generation.log
 *
 * @param {object} params
 * @param {string} params.timestamp - ISO-8601
 * @param {string} params.inputSummary - primeiros 200 caracteres do input
 * @param {string} params.model - modelo utilizado
 * @param {string} [params.tier]
 * @param {string} [params.complexity]
 * @param {number} [params.durationMs] - duração em ms
 * @returns {string} JSON estruturado
 */
export function generateGenerationLog({ timestamp, inputSummary, model, tier, complexity, durationMs }) {
  const entry = {
    timestamp,
    event: 'generation',
    inputSummary: inputSummary ? String(inputSummary).slice(0, 200) : '',
    model: model || 'unknown',
    tier: tier || 'unknown',
    complexity: complexity || 'unknown',
    durationMs: typeof durationMs === 'number' ? durationMs : null,
  };
  return JSON.stringify(entry, null, 2);
}

/**
 * Gera o conteúdo de logs/structure.log
 *
 * @param {object} params
 * @param {Array<{path: string, size: number, type: string}>} params.files
 * @returns {string} JSON estruturado
 */
export function generateStructureLog({ files }) {
  const entry = {
    timestamp: new Date().toISOString(),
    event: 'structure',
    files: Array.isArray(files) ? files : [],
  };
  return JSON.stringify(entry, null, 2);
}
