/**
 * api/lib/serginho/intent/promptIntentClassifier.js
 * Classificador de intenção de prompt — separa questões conceituais de questões
 * de repositório antes que o fluxo de follow-up GitHub seja acionado.
 *
 * Intenções possíveis:
 *   - 'conceptual'    → pergunta puramente conceitual/estratégica sem dependência de dados GitHub
 *   - 'repo_analysis' → pergunta que envolve análise de repositório, arquivo, branch ou código
 *   - 'mixed'         → pergunta que combina parte conceitual com parte que referencia repo/arquivo
 *
 * Uso:
 *   import { classifyPromptIntent } from './promptIntentClassifier.js';
 *   const { intent, confidence } = classifyPromptIntent(message);
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - Sem escrita no GitHub
 *   - Sem persistência em banco/disco
 */

// ---------------------------------------------------------------------------
// Padrões de intenção CONCEITUAL (PT-BR e EN)
// ---------------------------------------------------------------------------

/** Marcadores explícitos de abstração (PT-BR). */
const CONCEPTUAL_MARKERS_PTBR = [
  /\b(conceitualmente|conceptualmente|teoricamente|abstratamente)\b/i,
  /\bem\s+teoria\b/i,
  /\bde\s+forma\s+abstrata\b/i,
];

/** Marcadores explícitos de abstração (EN). */
const CONCEPTUAL_MARKERS_EN = [
  /\b(conceptually|theoretically|abstractly)\b/i,
  /\bin\s+theory\b/i,
  /\bin\s+abstract\s+terms\b/i,
];

/** Instruções explícitas para ignorar contexto GitHub (PT-BR). */
const SKIP_GITHUB_PTBR = [
  /sem\s+usar\s+github/i,
  /sem\s+pedir\s+arquivos?/i,
  /sem\s+depender\s+de\s+contexto/i,
  /sem\s+contexto\s+(carregado|github)/i,
];

/** Instruções explícitas para ignorar contexto GitHub (EN). */
const SKIP_GITHUB_EN = [
  /without\s+(using\s+)?github/i,
  /without\s+loading\s+(files?|repos?|context)/i,
  /no\s+github\s+context/i,
];

/** Padrões de explicação conceitual (PT-BR). */
const CONCEPTUAL_EXPLANATION_PTBR = [
  /\bexplique\b.{0,150}\bdiferença\b/i,
];

// ---------------------------------------------------------------------------
// Padrões de intenção REPO (referência a dados GitHub)
// ---------------------------------------------------------------------------

/**
 * Detecta se a mensagem contém referências explícitas a artefatos GitHub:
 * owner/repo, caminhos de arquivo, branches ou verbos de ação GitHub.
 *
 * @param {string} message
 * @returns {boolean}
 */
function _hasRepoSignal(message) {
  // owner/repo pattern (e.g. "facebook/react", "de owner/repo")
  if (/[\w.-]+\/[\w.-]+/.test(message)) return true;
  // File path patterns (e.g. "package.json", ".js", ".ts", ".md")
  if (/\b\w+\.(json|js|ts|jsx|tsx|md|yaml|yml|txt|py|go|java|rb|rs)\b/i.test(message)) return true;
  // Branch references
  if (/\b(branch|branches|main|master|develop|feature\/|hotfix\/)\b/i.test(message)) return true;
  // GitHub action verbs with file/repo objects
  if (/\b(abra|abre|abrir|liste|listar|mostre|mostrar|open|list|show|fetch|busque|buscar)\b.{0,50}\b(repo|arquivo|file|branch|package)\b/i.test(message)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Classifica a intenção de um prompt em uma de três categorias:
 *   - 'conceptual'    → nenhuma referência a dados GitHub; responde direto
 *   - 'repo_analysis' → referencia repo/arquivo/branch; pode exigir contexto
 *   - 'mixed'         → contém sinais conceituais E referências de repo
 *
 * O campo `confidence` indica a confiança na classificação (0–1).
 *
 * @param {string} message
 * @returns {{ intent: 'conceptual'|'repo_analysis'|'mixed', confidence: number }}
 */
export function classifyPromptIntent(message) {
  if (!message || typeof message !== 'string') {
    return { intent: 'repo_analysis', confidence: 0.5 };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { intent: 'repo_analysis', confidence: 0.5 };
  }

  const hasRepo = _hasRepoSignal(trimmed);
  const isConceptual = _isConceptualSignal(trimmed);

  if (isConceptual && hasRepo) {
    return { intent: 'mixed', confidence: 0.75 };
  }

  if (isConceptual) {
    return { intent: 'conceptual', confidence: 0.9 };
  }

  return { intent: 'repo_analysis', confidence: 0.8 };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Retorna true se a mensagem apresenta sinais de intenção conceitual/estratégica.
 *
 * @param {string} trimmed - Mensagem já com trim aplicado
 * @returns {boolean}
 */
function _isConceptualSignal(trimmed) {
  // Explicit PT-BR abstraction markers
  for (const p of CONCEPTUAL_MARKERS_PTBR) {
    if (p.test(trimmed)) return true;
  }

  // Explicit EN abstraction markers
  for (const p of CONCEPTUAL_MARKERS_EN) {
    if (p.test(trimmed)) return true;
  }

  // Explicit "skip GitHub" instructions (PT-BR)
  for (const p of SKIP_GITHUB_PTBR) {
    if (p.test(trimmed)) return true;
  }

  // Explicit "skip GitHub" instructions (EN)
  for (const p of SKIP_GITHUB_EN) {
    if (p.test(trimmed)) return true;
  }

  // Conceptual explanation patterns (PT-BR)
  for (const p of CONCEPTUAL_EXPLANATION_PTBR) {
    if (p.test(trimmed)) return true;
  }

  // "o que é/são/representam" questions (PT-BR) without repo references
  // "what is/are/does" questions (EN) without repo references
  // Long messages (> 200 chars) with no repo references are likely conceptual
  const noRepoSignal = !_hasRepoSignal(trimmed);
  if (/^o que (é|são|representa[m]?)/i.test(trimmed) && noRepoSignal) return true;
  if (/^what (is|are|does)\b/i.test(trimmed) && noRepoSignal) return true;
  if (trimmed.length > 200 && noRepoSignal) return true;

  return false;
}
