/**
 * MODEL PRIORITY CONFIG - Serginho Generalista
 *
 * Ordem de prioridade dos modelos para o modo Automático.
 * Para reordenar: basta trocar a posição dos itens neste array.
 * Para adicionar/remover modelos: adicionar/remover itens aqui E em MANUAL_MODEL_OPTIONS.
 *
 * Cada item mapeia para um providerName em providers-config.js.
 * A ordem define qual modelo é tentado primeiro no modo Automático.
 */

// FASE DE TESTE ATUAL — ordem inicial de teste comparativo
export const AUTO_PRIORITY_ORDER = [
  { id: 'gemini-flash',  providerName: 'gemini-flash',  label: 'Gemini Flash',       icon: '⚡' },
  { id: 'gemini-pro-31', providerName: 'gemini-pro-31', label: 'Gemini 2.5 Pro Preview', icon: '♊' },
  { id: 'gemini-pro',    providerName: 'gemini-pro',    label: 'Gemini 2.5 Pro',     icon: '♊' },
  { id: 'llama-70b',     providerName: 'llama-70b',     label: 'Groq 70B',           icon: '⚙️' },
  { id: 'llama-120b',    providerName: 'llama-120b',    label: 'Groq 120B',          icon: '🧠' },
];

// Opções para o seletor manual (inclui "Automático" como primeira opção)
export const MANUAL_MODEL_OPTIONS = [
  { id: 'auto', providerName: null, label: 'Automático', icon: '🔄' },
  ...AUTO_PRIORITY_ORDER,
];

export default { AUTO_PRIORITY_ORDER, MANUAL_MODEL_OPTIONS };
