/**
 * studyLabClient.js — Cliente do Study Lab
 *
 * Substitui StudyLabAI.js (que usava REACT_APP_GEMINI_API_KEY no frontend).
 * Todas as chamadas de IA são feitas ao backend /api/study-lab (Groq-only, server-side).
 * Nenhuma chave de API é exposta ao browser.
 */

const BASE_URL = "/api/study-lab";

async function callBackend(tool, params) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, ...params }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Erro ao chamar tool=${tool}`);
  }

  return json.data;
}

const studyLabClient = {
  /**
   * Gerar resumo acadêmico
   * @param {string} texto
   * @param {string} estilo - 'academico' | 'simples' | 'bullet' | 'fichamento'
   * @param {string} tamanho - 'curto' | 'medio' | 'longo'
   */
  async gerarResumo(texto, estilo = "academico", tamanho = "medio") {
    return callBackend("resumo", { texto, estilo, tamanho });
  },

  /**
   * Gerar flashcards
   * @param {string} texto
   * @param {number} quantidade
   */
  async gerarFlashcards(texto, quantidade = 10) {
    return callBackend("flashcards", { texto, quantidade });
  },

  /**
   * Gerar mapa mental
   * @param {string} texto
   * @param {string} temaCentral
   */
  async gerarMapaMental(texto, temaCentral) {
    return callBackend("mapa-mental", { texto, temaCentral });
  },

  /**
   * Gerar cronograma de estudos
   * @param {object} config - { materia, dataProva, horasPorDia, topicos }
   */
  async gerarCronograma(config) {
    return callBackend("cronograma", { config });
  },

  /**
   * Analisar credibilidade de fontes (determinístico, sem IA)
   * @param {string[]} urls
   */
  async analisarFontes(urls) {
    return callBackend("source-proof", { urls });
  },
};

export { studyLabClient };
export default studyLabClient;
