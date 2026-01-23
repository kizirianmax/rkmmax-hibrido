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
        // GEMINI API
        gemini: {
          apiKey: this._getEnvVar("REACT_APP_GEMINI_API_KEY", "VITE_GEMINI_API_KEY"),
          isConfigured: false,
        },
        // GROQ API
        groq: {
          apiKey: this._getEnvVar("REACT_APP_GROQ_API_KEY", "VITE_GROQ_API_KEY"),
          isConfigured: false,
        },
        // GITHUB OAUTH
        github: {
          clientId: this._getEnvVar("REACT_APP_GITHUB_CLIENT_ID", "VITE_GITHUB_CLIENT_ID"),
          clientSecret: this._getEnvVar(
            "REACT_APP_GITHUB_CLIENT_SECRET",
            "VITE_GITHUB_CLIENT_SECRET"
          ),
          redirectUri: this._getEnvVar("REACT_APP_GITHUB_REDIRECT_URI", "VITE_GITHUB_REDIRECT_URI"),
          isConfigured: false,
        },
      };

      // ✅ VALIDAR CREDENCIAIS
      this._validateSecrets();

      // 📊 LOG SEGURO (sem expor chaves)
      console.log("🔐 Secret Manager inicializado:", {
        gemini: this.secrets.gemini.isConfigured ? "✅ Configurado" : "❌ Não configurado",
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
      const value = process.env[name] || window?.[name];
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

    // Validar Gemini
    if (this.secrets.gemini.apiKey) {
      this.secrets.gemini.isConfigured = true;
      console.log("✅ Gemini API configurada");
    } else {
      console.warn("⚠️ Gemini API não configurada - Vision e Especialista 54 desabilitados");
      this.validationErrors.push("GEMINI_API_KEY");
    }

    // Validar GROQ
    if (this.secrets.groq.apiKey) {
      this.secrets.groq.isConfigured = true;
      console.log("✅ GROQ API configurada");
    } else {
      console.warn("⚠️ GROQ API não configurada - Fallback desabilitado");
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
        gemini: this.secrets.gemini.isConfigured,
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
