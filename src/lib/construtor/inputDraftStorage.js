/**
 * PASSO 12 — Helpers de persistência do rascunho do campo de entrada.
 * Lê e grava em sessionStorage de forma isolada e silenciosa,
 * sem lançar exceção quando o storage não estiver disponível.
 */

export const INPUT_DRAFT_STORAGE_KEY = 'construtor_input_draft';

/**
 * Carrega o rascunho salvo. Retorna '' se não houver dado ou em caso de erro.
 * @returns {string}
 */
export const loadInputDraft = () => {
  try {
    return sessionStorage.getItem(INPUT_DRAFT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

/**
 * Persiste o rascunho. Remove a entrada se o texto estiver vazio.
 * Falha silenciosamente (storage indisponível ou cheio).
 * @param {string} text
 */
export const saveInputDraft = (text) => {
  try {
    if (text) {
      sessionStorage.setItem(INPUT_DRAFT_STORAGE_KEY, text);
    } else {
      sessionStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
    }
  } catch { /* ignorar */ }
};

/**
 * Remove o rascunho explicitamente. Falha silenciosamente.
 */
export const clearInputDraft = () => {
  try {
    sessionStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
  } catch { /* ignorar */ }
};
