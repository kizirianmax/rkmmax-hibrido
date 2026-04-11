/**
 * HYBRID ENGINES — Motores disponíveis para teste controlado no Construtor/Híbrido
 *
 * Escopo: SOMENTE camada Híbrido / Construtor.
 * Não afeta Serginho, Especialistas, nem ABNT.
 *
 * Cada entrada mapeia para uma chave em PROVIDERS (api/lib/providers-config.js).
 * O id 'auto' usa o fluxo padrão (120B → 70B) sem forceProvider.
 */

export const HYBRID_ENGINE_OPTIONS = [
  { id: 'auto', providerName: null, label: 'Padrão (120B → 70B)', icon: '🔄', description: 'Fluxo padrão do Construtor' },
  { id: 'llama-120b', providerName: 'llama-120b', label: 'GPT-OSS 120B', icon: '🧠', description: 'Raciocínio profundo (Groq)' },
  { id: 'llama-70b', providerName: 'llama-70b', label: 'Llama 3.3 70B', icon: '⚙️', description: 'Tarefas técnicas (Groq)' },
  { id: 'gemini-3-flash', providerName: 'gemini-3-flash', label: 'Gemini 3 Flash', icon: '⚡', description: 'Velocidade máxima (Google Preview)' },
  { id: 'gemini-3.1-pro', providerName: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', icon: '🔮', description: 'Raciocínio avançado (Google Preview)' },
];

export const DEFAULT_HYBRID_ENGINE = 'auto';
