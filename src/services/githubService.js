/**
 * GITHUB SERVICE
 * Integração com GitHub API para ler repositórios
 * Extrai informações de estrutura, arquivos e conteúdo
 */

class GitHubService {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseUrl = "https://api.github.com";
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "RKMMAX-Hybrid-System",
    };

    if (this.token) {
      this.headers["Authorization"] = `token ${this.token}`;
    }
  }

  /**
   * Extrair owner e repo de URL do GitHub
   */
  parseGitHubUrl(url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/").filter(Boolean);

      if (parts.length < 2) {
        throw new Error("URL inválida");
      }

      return {
        owner: parts[0],
        repo: parts[1].replace(".git", ""),
      };
    } catch (error) {
      throw new Error(`URL GitHub inválida: ${error.message}`);
    }
  }

  /**
   * Obter informações do repositório
   */
  async getRepositoryInfo(owner, repo) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        description: data.description,
        url: data.html_url,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        topics: data.topics || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isPrivate: data.private,
      };
    } catch (error) {
      throw new Error(`Erro ao obter info do repo: ${error.message}`);
    }
  }

  /**
   * Obter estrutura do repositório
   */
  async getRepositoryStructure(owner, repo, path = "") {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return [data];
      }

      return data.map((item) => ({
        name: item.name,
        type: item.type,
        path: item.path,
        size: item.size,
        url: item.html_url,
      }));
    } catch (error) {
      throw new Error(`Erro ao obter estrutura: ${error.message}`);
    }
  }

  /**
   * Obter conteúdo de um arquivo
   */
  async getFileContent(owner, repo, path) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.type !== "file") {
        throw new Error("Caminho não é um arquivo");
      }

      // Decodificar conteúdo base64
      const content = Buffer.from(data.content, "base64").toString("utf-8");

      return {
        name: data.name,
        path: data.path,
        size: data.size,
        content,
      };
    } catch (error) {
      throw new Error(`Erro ao obter arquivo: ${error.message}`);
    }
  }

  /**
   * Obter README do repositório
   */
  async getReadme(owner, repo) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/readme`, {
        headers: this.headers,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");

      return {
        name: data.name,
        path: data.path,
        content,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Obter package.json
   */
  async getPackageJson(owner, repo) {
    try {
      const file = await this.getFileContent(owner, repo, "package.json");
      return JSON.parse(file.content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Obter arquivos principais
   */
  async getMainFiles(owner, repo) {
    try {
      const structure = await this.getRepositoryStructure(owner, repo);

      const mainFiles = structure.filter(
        (item) =>
          item.type === "file" &&
          [".md", ".json", ".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".java"].some((ext) =>
            item.name.toLowerCase().endsWith(ext)
          )
      );

      return mainFiles.slice(0, 20); // Limitar a 20 arquivos
    } catch (error) {
      throw new Error(`Erro ao obter arquivos principais: ${error.message}`);
    }
  }

  /**
   * Análise completa do repositório
   */
  async analyzeRepository(url) {
    try {
      const { owner, repo } = this.parseGitHubUrl(url);

      console.log(`📊 Analisando repositório: ${owner}/${repo}`);

      // Obter informações em paralelo
      const [info, readme, packageJson, mainFiles] = await Promise.all([
        this.getRepositoryInfo(owner, repo),
        this.getReadme(owner, repo),
        this.getPackageJson(owner, repo),
        this.getMainFiles(owner, repo),
      ]);

      return {
        success: true,
        repository: {
          owner,
          repo,
          info,
          readme: readme ? readme.content : null,
          packageJson,
          mainFiles,
        },
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

// Exportar para uso em servidor Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = GitHubService;
}

// Exportar para uso em cliente React
export default GitHubService;
