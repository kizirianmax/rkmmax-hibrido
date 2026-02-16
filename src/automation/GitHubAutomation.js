/**
 * GITHUB AUTOMATION
 * Integração completa com GitHub para commits, pushes e PRs automáticos
 * Suporta: Criar commits, fazer push, criar PRs, gerenciar branches
 */

class GitHubAutomation {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseUrl = "https://api.github.com";
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${this.token}`,
      "User-Agent": "RKMMAX-Automation",
    };

    if (!this.token) {
      throw new Error("GITHUB_TOKEN não configurado");
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
        owner: data.owner.login,
        url: data.html_url,
        defaultBranch: data.default_branch,
        isPrivate: data.private,
        description: data.description,
      };
    } catch (error) {
      throw new Error(`Erro ao obter info do repo: ${error.message}`);
    }
  }

  /**
   * Obter referência de branch (SHA)
   */
  async getBranchRef(owner, repo, branch = "main") {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Branch não encontrado: ${branch}`);
      }

      const data = await response.json();

      return {
        branch,
        sha: data.object.sha,
        url: data.url,
      };
    } catch (error) {
      throw new Error(`Erro ao obter branch: ${error.message}`);
    }
  }

  /**
   * Obter árvore de commits
   */
  async getCommitTree(owner, repo, sha) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/commits/${sha}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Commit não encontrado: ${sha}`);
      }

      const data = await response.json();

      return {
        sha: data.sha,
        message: data.message,
        author: data.author,
        tree: data.tree,
      };
    } catch (error) {
      throw new Error(`Erro ao obter árvore: ${error.message}`);
    }
  }

  /**
   * Criar blob (arquivo)
   */
  async createBlob(owner, repo, content, encoding = "utf-8") {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          content,
          encoding,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar blob: ${response.status}`);
      }

      const data = await response.json();

      return {
        sha: data.sha,
        url: data.url,
      };
    } catch (error) {
      throw new Error(`Erro ao criar blob: ${error.message}`);
    }
  }

  /**
   * Criar árvore de arquivos
   */
  async createTree(owner, repo, files, baseTreeSha = null) {
    try {
      const tree = [];

      for (const file of files) {
        // Se for arquivo novo
        if (file.content) {
          const blob = await this.createBlob(owner, repo, file.content);
          tree.push({
            path: file.path,
            mode: "100644", // arquivo regular
            type: "blob",
            sha: blob.sha,
          });
        }
        // Se for deletar arquivo
        else if (file.delete) {
          tree.push({
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: null,
          });
        }
      }

      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/trees`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          tree,
          base_tree: baseTreeSha,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar árvore: ${response.status}`);
      }

      const data = await response.json();

      return {
        sha: data.sha,
        url: data.url,
      };
    } catch (error) {
      throw new Error(`Erro ao criar árvore: ${error.message}`);
    }
  }

  /**
   * Criar commit
   */
  async createCommit(owner, repo, message, treeSha, parentSha, author) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/commits`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          message,
          tree: treeSha,
          parents: [parentSha],
          author: {
            name: author?.name || "RKMMAX Bot",
            email: author?.email || "bot@rkmmax.com",
            date: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar commit: ${response.status}`);
      }

      const data = await response.json();

      return {
        sha: data.sha,
        message: data.message,
        author: data.author,
        url: data.html_url,
      };
    } catch (error) {
      throw new Error(`Erro ao criar commit: ${error.message}`);
    }
  }

  /**
   * Atualizar referência (fazer push)
   */
  async updateRef(owner, repo, branch, newSha, force = false) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        {
          method: "PATCH",
          headers: this.headers,
          body: JSON.stringify({
            sha: newSha,
            force,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao atualizar referência: ${response.status}`);
      }

      const data = await response.json();

      return {
        branch,
        sha: data.object.sha,
        updated: true,
      };
    } catch (error) {
      throw new Error(`Erro ao fazer push: ${error.message}`);
    }
  }

  /**
   * Fluxo completo: Commit + Push
   */
  async commitAndPush(owner, repo, files, message, branch = "main", author = null) {
    try {
      console.log(`📝 Iniciando commit em ${owner}/${repo}/${branch}`);

      // 1. Obter referência atual do branch
      const branchRef = await this.getBranchRef(owner, repo, branch);
      console.log(`✅ Branch encontrado: ${branchRef.sha.substring(0, 7)}`);

      // 2. Obter árvore atual
      const currentTree = await this.getCommitTree(owner, repo, branchRef.sha);
      console.log(`✅ Árvore obtida: ${currentTree.tree.sha.substring(0, 7)}`);

      // 3. Criar nova árvore com os arquivos
      const newTree = await this.createTree(owner, repo, files, currentTree.tree.sha);
      console.log(`✅ Nova árvore criada: ${newTree.sha.substring(0, 7)}`);

      // 4. Criar novo commit
      const newCommit = await this.createCommit(
        owner,
        repo,
        message,
        newTree.sha,
        branchRef.sha,
        author
      );
      console.log(`✅ Commit criado: ${newCommit.sha.substring(0, 7)}`);

      // 5. Fazer push (atualizar referência)
      const push = await this.updateRef(owner, repo, branch, newCommit.sha);
      console.log(`✅ Push realizado com sucesso!`);

      return {
        success: true,
        commit: newCommit,
        branch: push.branch,
        filesChanged: files.length,
      };
    } catch (error) {
      console.error(`❌ Erro no commit/push: ${error.message}`);
      throw error;
    }
  }

  /**
   * Criar Pull Request
   */
  async createPullRequest(owner, repo, title, body, head, base = "main") {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          title,
          body,
          head,
          base,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar PR: ${error.message}`);
      }

      const data = await response.json();

      return {
        number: data.number,
        title: data.title,
        url: data.html_url,
        status: data.state,
      };
    } catch (error) {
      throw new Error(`Erro ao criar PR: ${error.message}`);
    }
  }

  /**
   * Listar arquivos modificados em um commit
   */
  async getCommitFiles(owner, repo, commitSha) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/commits/${commitSha}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Commit não encontrado: ${commitSha}`);
      }

      const data = await response.json();

      return {
        commit: commitSha,
        author: data.commit.author,
        message: data.commit.message,
        files: data.files.map((f) => ({
          path: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
        })),
        stats: {
          total: data.files.length,
          additions: data.stats.additions,
          deletions: data.stats.deletions,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao obter arquivos: ${error.message}`);
    }
  }

  /**
   * Obter conteúdo de arquivo
   */
  async getFileContent(owner, repo, path, branch = "main") {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Arquivo não encontrado: ${path}`);
      }

      const data = await response.json();

      // Decodificar base64
      const content = Buffer.from(data.content, "base64").toString("utf-8");

      return {
        path: data.path,
        content,
        sha: data.sha,
        size: data.size,
      };
    } catch (error) {
      throw new Error(`Erro ao obter arquivo: ${error.message}`);
    }
  }

  /**
   * Criar branch
   */
  async createBranch(owner, repo, branchName, fromBranch = "main") {
    try {
      // Obter SHA do branch origem
      const originBranch = await this.getBranchRef(owner, repo, fromBranch);

      // Criar novo branch
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: originBranch.sha,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar branch: ${response.status}`);
      }

      const data = await response.json();

      return {
        branch: branchName,
        sha: data.object.sha,
        created: true,
      };
    } catch (error) {
      throw new Error(`Erro ao criar branch: ${error.message}`);
    }
  }

  /**
   * Deletar branch
   */
  async deleteBranch(owner, repo, branchName) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
        {
          method: "DELETE",
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao deletar branch: ${response.status}`);
      }

      return {
        branch: branchName,
        deleted: true,
      };
    } catch (error) {
      throw new Error(`Erro ao deletar branch: ${error.message}`);
    }
  }

  /**
   * Obter histórico de commits
   */
  async getCommitHistory(owner, repo, branch = "main", limit = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${limit}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Erro ao obter histórico: ${response.status}`);
      }

      const data = await response.json();

      return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
      }));
    } catch (error) {
      throw new Error(`Erro ao obter histórico: ${error.message}`);
    }
  }
}

export default GitHubAutomation;
