/**
 * MODEL PRIORITY - Single Source of Truth para prioridade e seleção de modelos no Serginho.
 *
 * Para reordenar a prioridade automática, basta alterar a ordem de AUTO_PRIORITY_ORDER
 * sem precisar tocar em outros arquivos.
 */

/**
 * Ordem de prioridade para o modo Automático.
 * O orchestrator tenta cada provider nesta ordem até obter resposta.
 *
 * id          → chave usada no PROVIDERS (providers-config.js)
 * providerName → mesmo que id (alias explícito para clareza)
 * label       → texto exibido na UI
 * icon        → ícone exibido na UI
 */
export const AUTO_PRIORITY_ORDER = [
  { id: 'gemini-3-flash',  providerName: 'gemini-3-flash',  label: 'Gemini 3 Flash',  icon: '⚡' },
  { id: 'gemini-3.1-pro',  providerName: 'gemini-3.1-pro',  label: 'Gemini 3.1 Pro',  icon: '🔮' },
  { id: 'gemini-pro',      providerName: 'gemini-pro',      label: 'Gemini 2.5 Pro',  icon: '♊' },
  { id: 'llama-70b',       providerName: 'llama-70b',       label: 'Groq 70B',        icon: '⚙️' },
  { id: 'llama-120b',      providerName: 'llama-120b',      label: 'Groq 120B',       icon: '🧠' },
];

/**
 * Opções do seletor manual.
 * A primeira entrada é o modo Automático (sem forceProvider).
 * As demais permitem forçar um modelo específico.
 */
export const MANUAL_MODEL_OPTIONS = [
  { id: 'auto', providerName: null, label: 'Automático', icon: '🔄' },
  ...AUTO_PRIORITY_ORDER,
];
