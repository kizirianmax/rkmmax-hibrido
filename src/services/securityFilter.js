/**
 * SECURITY FILTER
 * Bloqueia operações sensíveis para TODOS os agentes
 * Ninguém pode: modificar planos, alterar limites, acessar billing
 * Permite TUDO o mais
 */

class SecurityFilter {
  constructor() {
    // BLOQUEADO PARA TODOS - ABSOLUTAMENTE NINGUÉM PODE
    this.blockedKeywords = [
      // PLANOS E BILLING
      "plano",
      "plan",
      "billing",
      "pagamento",
      "payment",
      "stripe",
      "subscription",
      "assinatura",
      "upgrade",
      "downgrade",
      "cancelar assinatura",
      "cancel subscription",
      "alterar plano",
      "change plan",
      "modificar plano",
      "modify plan",
      "plano premium",
      "plano pro",
      "plano enterprise",
      "premium plan",
      "pro plan",
      "enterprise plan",
      "pricing",
      "preço",
      "valor",
      "price",

      // LIMITES
      "limite",
      "limit",
      "quota",
      "rate limit",
      "throttle",
      "max requests",
      "máximo de requisições",
      "alterar limite",
      "change limit",
      "modificar limite",
      "modify limit",
      "set limit",
      "aumentar limite",
      "decrease limit",
      "diminuir limite",
      "api limit",
      "request limit",
      "limite de requisições",

      // DADOS SENSÍVEIS
      "senha",
      "password",
      "token",
      "api key",
      "secret",
      "credencial",
      "credential",
      "cartão",
      "card",
      "cpf",
      "cnpj",
      "ssn",
      "credit card",
      "cartão de crédito",
      "número do cartão",
      "card number",
      "cvv",
      "expiration",
      "validade",

      // CONFIGURAÇÕES DE USUÁRIO
      "usuário",
      "user",
      "perfil",
      "profile",
      "email",
      "telefone",
      "phone",
      "endereço",
      "address",
      "modificar usuário",
      "modify user",
      "alterar usuário",
      "change user",
      "deletar usuário",
      "delete user",
      "criar usuário",
      "create user",
      "remover usuário",
      "remove user",
      "dados do usuário",
      "user data",

      // BANCO DE DADOS
      "banco de dados",
      "database",
      "drop table",
      "truncate",
      "sql injection",
      "injeção sql",
      "query",
      "select *",
      "update users",
      "delete from",
      "insert into",
      "alter table",
      "create table",
      "backup",
      "restore",
      "export data",
      "importar dados",
      "import data",
      "dump",

      // ADMIN E ACESSO
      "admin",
      "administrador",
      "root",
      "superuser",
      "sudo",
      "chmod",
      "chown",
      "acesso root",
      "root access",
      "painel admin",
      "admin panel",
      "console",
      "shell",
      "terminal",
      "ssh",
      "ftp",
      "sftp",
      "telnet",
      "acesso servidor",
      "server access",

      // OPERAÇÕES FINANCEIRAS
      "reembolso",
      "refund",
      "devolução",
      "chargeback",
      "invoice",
      "fatura",
      "cobrança",
      "charge",
      "pagar",
      "pay",
      "transação",
      "transaction",
      "transferência",
      "transfer",
      "depósito",
      "deposit",
      "saque",
      "withdrawal",
      "boleto",
      "pix",

      // DADOS PRIVADOS
      "privado",
      "private",
      "confidencial",
      "confidential",
      "secreto",
      "secret",
      "pessoal",
      "personal",
      "dados pessoais",
      "personal data",
      "lgpd",
      "gdpr",
      "pii",
      "informação pessoal",
      "personal information",
      "informação confidencial",
      "confidential information",

      // OPERAÇÕES PERIGOSAS
      "deletar",
      "delete",
      "remover",
      "remove",
      "apagar",
      "erase",
      "limpar",
      "clear",
      "reset",
      "wipe",
      "destruir",
      "destroy",
      "modificar dados",
      "modify data",
      "alterar dados",
      "change data",
      "corromper",
      "corrupt",
      "hackear",
      "hack",
      "invadir",
      "invade",

      // ACESSO A SISTEMAS
      "servidor",
      "server",
      "máquina",
      "machine",
      "host",
      "ip",
      "porta",
      "port",
      "firewall",
      "vpn",
      "proxy",
      "dns",
      "rede",
      "network",
      "internet",
      "conexão",
      "connection",
      "acesso remoto",
      "remote access",
      "rdp",
      "vnc",
    ];

    // Operações bloqueadas
    this.blockedOperations = [
      "modify_plan",
      "change_plan",
      "update_billing",
      "set_limit",
      "modify_quota",
      "delete_user",
      "modify_user",
      "access_payment",
      "export_users",
      "admin_panel",
      "access_database",
      "modify_config",
      "change_password",
      "reset_password",
      "access_logs",
      "modify_logs",
      "access_secrets",
      "modify_secrets",
      "access_keys",
      "modify_keys",
      "access_billing",
      "modify_billing",
      "access_payment_methods",
      "modify_payment_methods",
      "access_invoices",
      "modify_invoices",
    ];

    // Arquivos bloqueados
    this.blockedFiles = [
      ".env",
      ".env.local",
      ".env.production",
      ".env.development",
      "secrets.json",
      "config.json",
      "database.json",
      "users.json",
      "payments.json",
      "billing.json",
      "api_keys.json",
      "credentials.json",
      ".aws",
      ".ssh",
      "private_key",
      "id_rsa",
      "id_dsa",
      "id_ecdsa",
      ".git/config",
      ".git/credentials",
      "password.txt",
      "tokens.txt",
      "stripe_key.txt",
      "api_key.txt",
      "secret.txt",
      "config.yaml",
      "docker-compose.yml",
      "kubernetes.yaml",
      "terraform.tf",
    ];
  }

  /**
   * Verificar se tarefa é segura
   */
  isTaskSafe(taskDescription) {
    const task = taskDescription.toLowerCase();

    // Verificar palavras-chave bloqueadas
    for (const keyword of this.blockedKeywords) {
      if (task.includes(keyword)) {
        return {
          safe: false,
          reason: `BLOQUEADO: "${keyword}" não é permitido para ninguém`,
          blocked: true,
          severity: "HIGH",
        };
      }
    }

    // Verificar operações bloqueadas
    for (const operation of this.blockedOperations) {
      if (task.includes(operation)) {
        return {
          safe: false,
          reason: `BLOQUEADO: ${operation} não é permitido`,
          blocked: true,
          severity: "HIGH",
        };
      }
    }

    // Verificar arquivos bloqueados
    for (const file of this.blockedFiles) {
      if (task.includes(file)) {
        return {
          safe: false,
          reason: `BLOQUEADO: Acesso ao arquivo "${file}" não é permitido`,
          blocked: true,
          severity: "HIGH",
        };
      }
    }

    return {
      safe: true,
      reason: "Tarefa permitida",
      blocked: false,
      severity: "LOW",
    };
  }

  /**
   * Filtrar conteúdo gerado
   */
  filterContent(content) {
    let filtered = content;

    // Remover referências a planos
    filtered = filtered.replace(/plano\s+(pro|premium|enterprise|básico)/gi, "[BLOQUEADO]");
    filtered = filtered.replace(/upgrade\s+para/gi, "[BLOQUEADO]");
    filtered = filtered.replace(/billing|pagamento/gi, "[BLOQUEADO]");

    // Remover referências a limites
    filtered = filtered.replace(/limite\s+de\s+requisições/gi, "[BLOQUEADO]");
    filtered = filtered.replace(/rate\s+limit/gi, "[BLOQUEADO]");
    filtered = filtered.replace(/quota/gi, "[BLOQUEADO]");

    // Remover dados sensíveis
    filtered = filtered.replace(/api[_-]?key|secret|token/gi, "[BLOQUEADO]");
    filtered = filtered.replace(/senha|password/gi, "[BLOQUEADO]");
    filtered = filtered.replace(/cartão|card|cpf|cnpj/gi, "[BLOQUEADO]");

    return filtered;
  }

  /**
   * Gerar mensagem de erro
   */
  getBlockedMessage() {
    return `
╔════════════════════════════════════════════════════════════╗
║                  ❌ OPERAÇÃO BLOQUEADA                    ║
╚════════════════════════════════════════════════════════════╝

Esta operação NÃO é permitida para NINGUÉM!

Nenhum agente pode fazer:
  ❌ Modificar planos
  ❌ Alterar limites
  ❌ Acessar dados de billing/pagamento
  ❌ Modificar configurações sensíveis
  ❌ Acessar senhas ou tokens
  ❌ Deletar usuários
  ❌ Modificar banco de dados

✅ Você controla tudo isso manualmente!

Tente outra tarefa que seja permitida! 🚀
`;
  }

  /**
   * Validar requisição completa
   */
  validateRequest(githubUrl, task, mode) {
    // Validar URL
    if (!githubUrl || !githubUrl.includes("github.com")) {
      return {
        valid: false,
        error: "URL do GitHub inválida",
      };
    }

    // Validar tarefa
    const safetyCheck = this.isTaskSafe(task);
    if (!safetyCheck.safe) {
      return {
        valid: false,
        error: safetyCheck.reason,
        blocked: true,
        severity: safetyCheck.severity,
      };
    }

    // Validar modo
    if (!["MANUAL", "AUTONOMOUS"].includes(mode.toUpperCase())) {
      return {
        valid: false,
        error: "Modo inválido (use MANUAL ou AUTONOMOUS)",
      };
    }

    return {
      valid: true,
      message: "Requisição validada com sucesso",
    };
  }

  /**
   * Log de tentativa bloqueada
   */
  logBlockedAttempt(githubUrl, task, reason) {
    const timestamp = new Date().toISOString();
    console.error(`
╔════════════════════════════════════════════════════════════╗
║           ⚠️ TENTATIVA DE OPERAÇÃO BLOQUEADA              ║
╚════════════════════════════════════════════════════════════╝
Timestamp: ${timestamp}
Repositório: ${githubUrl}
Tarefa: ${task}
Motivo: ${reason}
════════════════════════════════════════════════════════════
    `);
  }
}

export default SecurityFilter;
