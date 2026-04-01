/**
 * SECRET MANAGER - Gerenciador Seguro de Credenciais
 *
 * ⚠️ SEGURANÇA CRÍTICA:
 * - Nunca loga chaves completas
 * - Nunca expõe credenciais em console.log
 * - Sempre valida presença de variáveis de ambiente
 * - Usa apenas referências mascaradas em logs
 */

class SecretManager {
  constructor() {
    this.secrets = {};
    this.initialized = false;
    this.validationErrors = [];
  }

  /**
   * INICIALIZAR SECRET MANAGER
   * Carrega e valida todas as credenciais necessárias
   */
  initialize() {
    try {
      // 🔐 CARREGAR CREDENCIAIS DO AMBIENTE
      this.secrets = {
        // GROQ API — provider principal
        groq: {
          apiKey: this._getEnvVar("VITE_GROQ_API_KEY"),
          isConfigured: false,
        },
        // GITHUB OAUTH
        github: {
          clientId: this._getEnvVar("VITE_GITHUB_CLIENT_ID"),
          clientSecret: this._getEnvVar("VITE_GITHUB_CLIENT_SECRET"),
          redirectUri: this._getEnvVar("VITE_GITHUB_REDIRECT_URI"),
          isConfigured: false,
        },
      };

      // ✅ VALIDAR CREDENCIAIS
      this._validateSecrets();

      // 📊 LOG SEGURO (sem expor chaves)
      console.log("🔐 Secret Manager inicializado:", {
        groq: this.secrets.groq.isConfigured ? "✅ Configurado" : "❌ Não configurado",
        github: this.secrets.github.isConfigured ? "✅ Configurado" : "❌ Não configurado",
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("🔴 Erro ao inicializar Secret Manager:", error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * OBTER VARIÁVEL DE AMBIENTE COM FALLBACK
   * Tenta múltiplas variáveis de ambiente
   */
  _getEnvVar(...names) {
    for (const name of names) {
      const value = import.meta.env[name] || window?.[name];
      if (value) return value;
    }
    return null;
  }

  /**
   * VALIDAR CREDENCIAIS
   * Verifica quais APIs estão configuradas
   */
  _validateSecrets() {
    this.validationErrors = [];

    // Validar GROQ
    if (this.secrets.groq.apiKey) {
      this.secrets.groq.isConfigured = true;
      console.log("✅ GROQ API configurada (provider principal)");
    } else {
      console.warn("⚠️ GROQ API não configurada — provider principal indisponível!");
      this.validationErrors.push("GROQ_API_KEY");
    }

    // Validar GitHub OAuth
    if (this.secrets.github.clientId && this.secrets.github.clientSecret) {
      this.secrets.github.isConfigured = true;
      console.log("✅ GitHub OAuth configurado");
    } else {
      console.warn("⚠️ GitHub OAuth não configurado - Autenticação GitHub desabilitada");
      this.validationErrors.push("GITHUB_OAUTH");
    }
  }

  /**
   * OBTER CREDENCIAL SEGURA
   * Retorna chave sem expor em logs
   */
  getSecret(service, field = "apiKey") {
    if (!this.initialized) {
      console.error("🔴 Secret Manager não inicializado!");
      return null;
    }

    const secret = this.secrets[service]?.[field];

    if (!secret) {
      console.warn(`⚠️ Credencial ${service}.${field} não encontrada`);
      return null;
    }

    // ✅ NUNCA LOGAR A CHAVE COMPLETA
    console.log(`🔐 Usando credencial: ${service}.${field} (${this._maskKey(secret)})`);

    return secret;
  }

  /**
   * MASCARAR CHAVE PARA LOGS SEGUROS
   * Mostra apenas primeiros e últimos caracteres
   */
  _maskKey(key) {
    if (!key || key.length < 8) return "***";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  /**
   * VERIFICAR SE SERVIÇO ESTÁ CONFIGURADO
   */
  isConfigured(service) {
    return this.secrets[service]?.isConfigured || false;
  }

  /**
   * OBTER STATUS DE TODAS AS CREDENCIAIS
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: {
        groq: this.secrets.groq.isConfigured,
        github: this.secrets.github.isConfigured,
      },
      errors: this.validationErrors,
    };
  }

  /**
   * OBTER TODAS AS CREDENCIAIS (apenas para uso interno)
   * ⚠️ NUNCA EXPOR ISSO EM LOGS OU CONSOLE
   */
  getAllSecrets() {
    if (!this.initialized) {
      console.error("🔴 Secret Manager não inicializado!");
      return null;
    }
    return this.secrets;
  }
}

// 🔐 SINGLETON GLOBAL
const secretManager = new SecretManager();

export default secretManager;
