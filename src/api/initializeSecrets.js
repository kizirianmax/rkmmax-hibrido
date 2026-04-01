/**
 * INICIALIZAÇÃO SEGURA DE CREDENCIAIS
 *
 * Este arquivo deve ser importado NO INÍCIO da aplicação
 * para garantir que todas as credenciais sejam validadas
 * antes de qualquer uso
 */

import secretManager from "./SecretManager";

/**
 * INICIALIZAR E VALIDAR TODAS AS CREDENCIAIS
 */
export function initializeSecrets() {
  console.log("🔐 Inicializando gerenciador de segredos...");

  // Inicializar Secret Manager
  const initialized = secretManager.initialize();

  if (!initialized) {
    console.error("🔴 Falha ao inicializar Secret Manager!");
    return false;
  }

  // Obter status
  const status = secretManager.getStatus();

  // Log seguro do status
  console.log("🔐 Status de credenciais:", {
    "groq (principal)": status.services.groq ? "✅" : "❌",
    github: status.services.github ? "✅" : "❌",
  });

  // Avisar sobre credenciais faltando
  if (status.errors.length > 0) {
    console.warn("⚠️ Credenciais faltando:", status.errors);
  }

  return true;
}

/**
 * VERIFICAR CREDENCIAIS ANTES DE USAR SERVIÇO
 */
export function checkServiceAvailability(service) {
  const isConfigured = secretManager.isConfigured(service);

  if (!isConfigured) {
    console.warn(`⚠️ Serviço ${service} não está configurado`);
    return false;
  }

  return true;
}

/**
 * OBTER STATUS COMPLETO (apenas para debug)
 */
export function getSecretsStatus() {
  return secretManager.getStatus();
}

export default secretManager;
