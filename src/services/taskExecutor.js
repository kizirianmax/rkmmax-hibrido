/**
 * TASK EXECUTOR
 * Executa tarefas reais em repositórios GitHub
 * Suporta: criar arquivos, gerar código, documentação, etc
 */

import GitHubService from "./githubService.js";

class TaskExecutor {
  constructor(githubToken = null) {
    this.githubService = new GitHubService(githubToken);
    this.supportedTasks = [
      "create_readme",
      "create_documentation",
      "create_code",
      "create_config",
      "analyze_code",
      "generate_tests",
      "create_contributing",
      "create_license",
      "create_changelog",
      "create_github_workflows",
    ];
  }

  /**
   * Detectar tipo de tarefa
   */
  detectTaskType(taskDescription) {
    const desc = taskDescription.toLowerCase();

    if (desc.includes("readme")) return "create_readme";
    if (desc.includes("documentação") || desc.includes("documentation"))
      return "create_documentation";
    if (
      desc.includes("código") ||
      desc.includes("code") ||
      desc.includes("função") ||
      desc.includes("function")
    )
      return "create_code";
    if (desc.includes("config") || desc.includes("configuração")) return "create_config";
    if (desc.includes("test") || desc.includes("teste")) return "generate_tests";
    if (desc.includes("contributing")) return "create_contributing";
    if (desc.includes("license") || desc.includes("licença")) return "create_license";
    if (desc.includes("changelog")) return "create_changelog";
    if (desc.includes("workflow") || desc.includes("github actions"))
      return "create_github_workflows";
    if (desc.includes("analisa") || desc.includes("analyze")) return "analyze_code";

    return "create_documentation"; // Default
  }

  /**
   * Gerar README.md
   */
  async generateReadme(repoData, additionalContext = "") {
    const { info, packageJson, mainFiles } = repoData;

    const dependencies = packageJson?.dependencies
      ? Object.keys(packageJson.dependencies).slice(0, 5).join(", ")
      : "N/A";

    const readme = `# ${info.name}

${info.description || "Projeto incrível"}

## 📋 Descrição

${info.description || "Este é um projeto bem estruturado e profissional."}

## 🌟 Features

- ✅ Funcionalidade 1
- ✅ Funcionalidade 2
- ✅ Funcionalidade 3
- ✅ Fácil de usar
- ✅ Bem documentado

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 14+
- npm ou yarn

### Instalação

\`\`\`bash
# Clone o repositório
git clone ${info.url}.git
cd ${info.name}

# Instale as dependências
npm install

# Inicie o projeto
npm start
\`\`\`

## 📚 Documentação

Para documentação completa, veja [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🔧 Configuração

Crie um arquivo \`.env\` com as variáveis necessárias:

\`\`\`env
# Exemplo de configuração
DEBUG=true
PORT=3000
\`\`\`

## 📦 Dependências Principais

${dependencies}

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para diretrizes de contribuição.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](./LICENSE) para detalhes.

## 👨‍💻 Autor

Criado com ❤️ por [RKMMAX](https://kizirianmax.site)

## 📞 Suporte

Para suporte, abra uma issue ou entre em contato.

---

**Última atualização:** ${new Date().toLocaleDateString("pt-BR")}
`;

    return {
      filename: "README.md",
      content: readme,
      description: "README.md profissional gerado automaticamente",
    };
  }

  /**
   * Gerar Documentação
   */
  async generateDocumentation(repoData, additionalContext = "") {
    const { info, packageJson, mainFiles } = repoData;

    const documentation = `# 📚 Documentação - ${info.name}

## Índice

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Uso](#uso)
4. [API](#api)
5. [Configuração](#configuração)
6. [Troubleshooting](#troubleshooting)

## Visão Geral

${info.description || "Projeto bem estruturado"}

**Tecnologias:**
- Linguagem: ${info.language || "JavaScript"}
- Framework: ${packageJson?.dependencies?.react ? "React" : "Node.js"}
- Dependências: ${Object.keys(packageJson?.dependencies || {}).length}

## Instalação

### Via npm

\`\`\`bash
npm install ${info.name}
\`\`\`

### Via yarn

\`\`\`bash
yarn add ${info.name}
\`\`\`

## Uso

### Exemplo Básico

\`\`\`javascript
const { ${info.name} } = require('${info.name}');

// Seu código aqui
\`\`\`

### Exemplo Avançado

\`\`\`javascript
const config = {
  debug: true,
  verbose: true,
};

// Configuração avançada
\`\`\`

## API

### Métodos Principais

#### \`init(options)\`
Inicializa o sistema.

**Parâmetros:**
- \`options\` (Object): Opções de configuração

**Retorno:** Promise

\`\`\`javascript
await init({ debug: true });
\`\`\`

#### \`process(data)\`
Processa dados.

**Parâmetros:**
- \`data\` (Object): Dados a processar

**Retorno:** Promise<Result>

\`\`\`javascript
const result = await process({ input: 'data' });
\`\`\`

## Configuração

### Variáveis de Ambiente

\`\`\`env
DEBUG=true
LOG_LEVEL=info
PORT=3000
\`\`\`

### Arquivo de Configuração

Crie \`config.json\`:

\`\`\`json
{
  "debug": true,
  "timeout": 5000,
  "retries": 3
}
\`\`\`

## Troubleshooting

### Problema: Erro ao inicializar

**Solução:** Verifique as variáveis de ambiente

### Problema: Performance lenta

**Solução:** Aumente o timeout em config.json

---

**Gerado automaticamente em:** ${new Date().toISOString()}
`;

    return {
      filename: "DOCUMENTATION.md",
      content: documentation,
      description: "Documentação completa gerada automaticamente",
    };
  }

  /**
   * Gerar CONTRIBUTING.md
   */
  async generateContributing(repoData) {
    const { info } = repoData;

    const contributing = `# 🤝 Contribuindo para ${info.name}

Obrigado por considerar contribuir para este projeto! Aqui estão algumas diretrizes.

## Como Contribuir

### 1. Fork o Repositório

\`\`\`bash
git clone https://github.com/seu-usuario/${info.name}.git
cd ${info.name}
\`\`\`

### 2. Crie uma Branch

\`\`\`bash
git checkout -b feature/sua-feature
\`\`\`

### 3. Faça suas Mudanças

- Escreva código limpo
- Adicione testes
- Atualize a documentação

### 4. Commit suas Mudanças

\`\`\`bash
git commit -m "feat: Adicione sua feature"
\`\`\`

### 5. Push para a Branch

\`\`\`bash
git push origin feature/sua-feature
\`\`\`

### 6. Abra um Pull Request

## Padrões de Código

- Use ESLint
- Siga o Prettier
- Escreva testes unitários
- Documente suas mudanças

## Commit Messages

Use o padrão Conventional Commits:

- \`feat:\` Nova feature
- \`fix:\` Correção de bug
- \`docs:\` Documentação
- \`style:\` Formatação
- \`refactor:\` Refatoração
- \`test:\` Testes
- \`chore:\` Manutenção

## Reportar Bugs

Abra uma issue com:
- Descrição clara
- Passos para reproduzir
- Comportamento esperado
- Comportamento atual

## Sugestões

Sugestões são bem-vindas! Abra uma issue para discutir.

---

**Obrigado por contribuir!** ❤️
`;

    return {
      filename: "CONTRIBUTING.md",
      content: contributing,
      description: "Guia de contribuição gerado automaticamente",
    };
  }

  /**
   * Gerar CHANGELOG.md
   */
  async generateChangelog(repoData) {
    const { info } = repoData;

    const changelog = `# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - ${new Date().toISOString().split("T")[0]}

### Added
- ✨ Versão inicial do projeto
- 📚 Documentação completa
- 🧪 Testes unitários
- 🔧 Configuração inicial

### Changed
- 🎨 Melhorias visuais
- ⚡ Otimizações de performance

### Fixed
- 🐛 Correção de bugs iniciais

### Security
- 🔐 Implementação de segurança

---

## Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/).

- MAJOR: Mudanças incompatíveis
- MINOR: Novas funcionalidades compatíveis
- PATCH: Correções de bugs

---

**Gerado em:** ${new Date().toISOString()}
`;

    return {
      filename: "CHANGELOG.md",
      content: changelog,
      description: "Changelog gerado automaticamente",
    };
  }

  /**
   * Executar tarefa
   */
  async executeTask(repoData, taskDescription, aiResponse = null) {
    try {
      const taskType = this.detectTaskType(taskDescription);

      console.log(`📋 Executando tarefa: ${taskType}`);

      let result;

      switch (taskType) {
        case "create_readme":
          result = await this.generateReadme(repoData, aiResponse);
          break;
        case "create_documentation":
          result = await this.generateDocumentation(repoData, aiResponse);
          break;
        case "create_contributing":
          result = await this.generateContributing(repoData);
          break;
        case "create_changelog":
          result = await this.generateChangelog(repoData);
          break;
        default:
          result = await this.generateDocumentation(repoData, aiResponse);
      }

      return {
        success: true,
        taskType,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default TaskExecutor;
