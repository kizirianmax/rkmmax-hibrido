/**
 * GITHUB BOT
 * Bot para GitHub que permite interagir com RKMMAX via comentários
 * Suporta: Webhooks, comentários, PRs, Issues
 */

class GitHubBot {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseUrl = "https://api.github.com";
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${this.token}`,
      "User-Agent": "RKMMAX-Bot",
    };

    // Padrões de comando reconhecidos
    this.commandPatterns = {
      rkmmax: /^@?rkmmax\s+(.+)$/i,
      help: /^@?rkmmax\s+help$/i,
      status: /^@?rkmmax\s+status$/i,
      automate: /^@?rkmmax\s+automate\s+(.+)$/i,
      review: /^@?rkmmax\s+review$/i,
      test: /^@?rkmmax\s+test$/i,
    };

    this.supportedCommands = [
      "help",
      "status",
      "automate <comando>",
      "review",
      "test",
      "fix <issue>",
      "document",
      "refactor",
    ];
  }

  /**
   * Processar webhook do GitHub
   */
  async processWebhook(payload) {
    const event = payload.action || payload.event;

    console.log(`🔔 Webhook GitHub recebido: ${event}`);

    let result = null;

    // Issue comentado
    if (payload.action === "created" && payload.comment) {
      result = await this.handleIssueComment(payload);
    }

    // PR comentado
    if (payload.action === "created" && payload.review) {
      result = await this.handlePullRequestReview(payload);
    }

    // Issue aberta
    if (payload.action === "opened" && payload.issue) {
      result = await this.handleIssueOpened(payload);
    }

    // PR aberta
    if (payload.action === "opened" && payload.pull_request) {
      result = await this.handlePullRequestOpened(payload);
    }

    return result;
  }

  /**
   * Processar comentário em issue
   */
  async handleIssueComment(payload) {
    const { comment, issue, repository } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const issueNumber = issue.number;

    console.log(`💬 Comentário em issue #${issueNumber}`);

    // Verificar se é comando do RKMMAX
    const command = this.parseCommand(comment.body);

    if (!command) {
      return { processed: false, reason: "Não é comando RKMMAX" };
    }

    console.log(`🎯 Comando detectado: ${command.type}`);

    // Processar comando
    let response = "";

    switch (command.type) {
      case "help":
        response = this.getHelpMessage();
        break;

      case "automate":
        response = await this.handleAutomateCommand(owner, repo, issueNumber, command.args);
        break;

      case "review":
        response = await this.handleReviewCommand(owner, repo, issueNumber);
        break;

      case "test":
        response = await this.handleTestCommand(owner, repo, issueNumber);
        break;

      case "status":
        response = this.getStatusMessage();
        break;

      default:
        response = `❓ Comando não reconhecido: ${command.type}`;
    }

    // Postar resposta
    await this.postComment(owner, repo, issueNumber, response);

    return {
      processed: true,
      command: command.type,
      response,
    };
  }

  /**
   * Processar comentário em PR
   */
  async handlePullRequestReview(payload) {
    const { pull_request, review, repository } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const prNumber = pull_request.number;

    console.log(`🔍 Review em PR #${prNumber}`);

    // Verificar se é comando do RKMMAX
    const command = this.parseCommand(review.body);

    if (!command) {
      return { processed: false, reason: "Não é comando RKMMAX" };
    }

    // Processar comando
    let response = "";

    if (command.type === "automate") {
      response = await this.handleAutomateCommand(owner, repo, prNumber, command.args, true);
    }

    // Postar resposta
    await this.postPullRequestComment(owner, repo, prNumber, response);

    return {
      processed: true,
      command: command.type,
      response,
    };
  }

  /**
   * Processar issue aberta
   */
  async handleIssueOpened(payload) {
    const { issue, repository } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const issueNumber = issue.number;

    console.log(`📋 Issue aberta: #${issueNumber}`);

    // Verificar se issue menciona RKMMAX
    if (!issue.body.includes("rkmmax") && !issue.body.includes("RKMMAX")) {
      return { processed: false };
    }

    // Postar mensagem de boas-vindas
    const welcome =
      `👋 Olá! Sou o **RKMMAX Bot**. Você pode me pedir para automatizar tarefas nesta issue!\n\n` +
      `Comandos disponíveis:\n` +
      `- \`@rkmmax automate <tarefa>\` - Automatizar uma tarefa\n` +
      `- \`@rkmmax review\` - Revisar código\n` +
      `- \`@rkmmax test\` - Executar testes\n` +
      `- \`@rkmmax help\` - Mostrar ajuda`;

    await this.postComment(owner, repo, issueNumber, welcome);

    return { processed: true, action: "welcome_posted" };
  }

  /**
   * Processar PR aberta
   */
  async handlePullRequestOpened(payload) {
    const { pull_request, repository } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const prNumber = pull_request.number;

    console.log(`🔀 PR aberta: #${prNumber}`);

    // Postar mensagem de boas-vindas
    const welcome =
      `👋 Olá! Sou o **RKMMAX Bot**. Posso ajudar a revisar e melhorar este PR!\n\n` +
      `Comandos disponíveis:\n` +
      `- \`@rkmmax review\` - Revisar código\n` +
      `- \`@rkmmax test\` - Executar testes\n` +
      `- \`@rkmmax automate <tarefa>\` - Automatizar uma tarefa\n` +
      `- \`@rkmmax help\` - Mostrar ajuda`;

    await this.postPullRequestComment(owner, repo, prNumber, welcome);

    return { processed: true, action: "welcome_posted" };
  }

  /**
   * Processar comando de automação
   */
  async handleAutomateCommand(owner, repo, number, args, isPR = false) {
    console.log(`🤖 Processando automação: ${args}`);

    // Aqui seria chamada a AutomationEngine
    // Por enquanto, retorna mensagem de confirmação

    const response =
      `✅ **Automação iniciada!**\n\n` +
      `Tarefa: ${args}\n` +
      `Repositório: ${owner}/${repo}\n` +
      `${isPR ? `PR: #${number}` : `Issue: #${number}`}\n\n` +
      `Estou processando sua solicitação... Aguarde! ⏳`;

    return response;
  }

  /**
   * Processar comando de review
   */
  async handleReviewCommand(owner, repo, number) {
    console.log(`🔍 Processando review`);

    const response =
      `🔍 **Iniciando revisão de código...**\n\n` +
      `Vou analisar:\n` +
      `- Qualidade do código\n` +
      `- Segurança\n` +
      `- Performance\n` +
      `- Boas práticas\n\n` +
      `Aguarde o resultado... ⏳`;

    return response;
  }

  /**
   * Processar comando de teste
   */
  async handleTestCommand(owner, repo, number) {
    console.log(`🧪 Processando testes`);

    const response =
      `🧪 **Executando testes...**\n\n` +
      `Rodando:\n` +
      `- Testes unitários\n` +
      `- Testes de integração\n` +
      `- Linting\n\n` +
      `Aguarde o resultado... ⏳`;

    return response;
  }

  /**
   * Parsear comando do comentário
   */
  parseCommand(text) {
    if (!text) return null;

    for (const [type, pattern] of Object.entries(this.commandPatterns)) {
      const match = text.match(pattern);
      if (match) {
        return {
          type,
          args: match[1] || "",
        };
      }
    }

    return null;
  }

  /**
   * Obter mensagem de ajuda
   */
  getHelpMessage() {
    let help = `# 🤖 RKMMAX Bot - Ajuda\n\n`;
    help += `Sou o assistente de automação do RKMMAX. Posso ajudar você a:\n\n`;
    help += `## Comandos Disponíveis\n\n`;

    for (const cmd of this.supportedCommands) {
      help += `- \`@rkmmax ${cmd}\`\n`;
    }

    help += `\n## Exemplos\n\n`;
    help += `\`\`\`\n`;
    help += `@rkmmax automate criar componente de login\n`;
    help += `@rkmmax review\n`;
    help += `@rkmmax test\n`;
    help += `@rkmmax help\n`;
    help += `\`\`\`\n\n`;
    help += `Precisa de mais ajuda? Visite: https://docs.rkmmax.com`;

    return help;
  }

  /**
   * Obter mensagem de status
   */
  getStatusMessage() {
    return (
      `✅ **RKMMAX Bot está online!**\n\n` +
      `Status: Operacional\n` +
      `Versão: 1.0.0\n` +
      `Especialistas disponíveis: 54\n\n` +
      `Digite \`@rkmmax help\` para ver os comandos disponíveis.`
    );
  }

  /**
   * Postar comentário em issue
   */
  async postComment(owner, repo, issueNumber, body) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ body }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao postar comentário: ${response.status}`);
      }

      console.log(`✅ Comentário postado em issue #${issueNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao postar comentário:`, error);
      return false;
    }
  }

  /**
   * Postar comentário em PR
   */
  async postPullRequestComment(owner, repo, prNumber, body) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ body }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao postar comentário: ${response.status}`);
      }

      console.log(`✅ Comentário postado em PR #${prNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao postar comentário:`, error);
      return false;
    }
  }

  /**
   * Adicionar label em issue
   */
  async addLabel(owner, repo, issueNumber, labels) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ labels }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao adicionar label: ${response.status}`);
      }

      console.log(`✅ Labels adicionados`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao adicionar label:`, error);
      return false;
    }
  }

  /**
   * Criar issue
   */
  async createIssue(owner, repo, title, body, labels = []) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ title, body, labels }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar issue: ${response.status}`);
      }

      const data = await response.json();

      console.log(`✅ Issue criada: #${data.number}`);
      return data;
    } catch (error) {
      console.error(`❌ Erro ao criar issue:`, error);
      return null;
    }
  }

  /**
   * Fechar issue
   */
  async closeIssue(owner, repo, issueNumber) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ state: "closed" }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao fechar issue: ${response.status}`);
      }

      console.log(`✅ Issue #${issueNumber} fechada`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao fechar issue:`, error);
      return false;
    }
  }
}

export default GitHubBot;
