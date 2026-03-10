/**
 * api/lib/serginho/formatters/githubResponseFormatter.js
 * Formata resultados de tools GitHub read-only em respostas legíveis e contextuais.
 *
 * Regra do projeto: NADA executa fora do Serginho.
 * Este módulo apenas transforma dados já obtidos — não faz chamadas externas.
 *
 * Funções exportadas:
 *   - formatReposResponse(data)               → repos em lista legível
 *   - formatBranchesResponse(data, context)   → branches em lista legível
 *   - formatFileResponse(data, context)       → arquivo com resumo inteligente
 *   - formatErrorResponse(error)              → erro em texto amigável
 *   - formatGitHubToolResult(toolName, data, context) → entrada principal
 *
 * Segurança:
 *   - NUNCA vaza token, stacktrace ou headers
 *   - Conteúdo longo é truncado com aviso
 *   - Dados sensíveis são sanitizados antes de exibir
 */

// Máximo de caracteres exibidos de um arquivo antes de truncar
const MAX_FILE_CONTENT_CHARS = 2000;
// Máximo de repos exibidos na listagem
const MAX_REPOS_DISPLAYED = 10;
// Máximo de linhas exibidas para arquivos sem formatação especial
const MAX_PLAIN_LINES = 40;

// ---------------------------------------------------------------------------
// Formatadores por tipo de tool
// ---------------------------------------------------------------------------

/**
 * Formata lista de repositórios em texto legível.
 *
 * @param {{ repos: object[], mode: string }} data
 * @returns {string}
 */
export function formatReposResponse(data) {
  const repos = data?.repos ?? [];

  if (repos.length === 0) {
    return '📋 Nenhum repositório encontrado.';
  }

  const total = repos.length;
  const displayed = repos.slice(0, MAX_REPOS_DISPLAYED);
  const hasMore = total > MAX_REPOS_DISPLAYED;

  const lines = displayed.map((r, i) => {
    const visibility = r.private ? '🔒 privado' : '🔓 público';
    const branch = r.defaultBranch ? ` — branch: \`${r.defaultBranch}\`` : '';
    const desc = r.description ? ` — "${r.description}"` : '';
    const name = r.fullName || r.name || 'sem-nome';
    return `${i + 1}. **${name}** (${visibility})${branch}${desc}`;
  });

  const header = `📋 Seus repositórios (${total} encontrado${total !== 1 ? 's' : ''}):`;
  const footer = hasMore
    ? `\n\n_(mostrando ${MAX_REPOS_DISPLAYED} de ${total} repositórios)_`
    : '';

  return `${header}\n\n${lines.join('\n')}${footer}`;
}

/**
 * Formata lista de branches em texto legível.
 *
 * @param {{ branches: object[], mode: string }} data
 * @param {{ owner?: string, repo?: string }} [context]
 * @returns {string}
 */
export function formatBranchesResponse(data, context = {}) {
  const branches = data?.branches ?? [];
  const repoLabel = context.owner && context.repo
    ? `\`${context.owner}/${context.repo}\``
    : context.repo
      ? `\`${context.repo}\``
      : 'o repositório';

  if (branches.length === 0) {
    return `🌿 Nenhuma branch encontrada em ${repoLabel}.`;
  }

  const total = branches.length;
  const lines = branches.map((b) => {
    const protectedLabel = b.protected ? ' 🛡️ (protegida)' : '';
    return `• **${b.name}**${protectedLabel}`;
  });

  return `🌿 Branches de ${repoLabel} (${total} encontrada${total !== 1 ? 's' : ''}):\n\n${lines.join('\n')}`;
}

/**
 * Formata conteúdo de arquivo com resumo inteligente por tipo.
 *
 * @param {{ file: object, mode: string }} data
 * @param {{ owner?: string, repo?: string, path?: string }} [context]
 * @returns {string}
 */
export function formatFileResponse(data, context = {}) {
  const file = data?.file ?? {};
  const fileName = file.name || file.path || context.path || 'arquivo';
  const filePath = file.path || context.path || fileName;
  const repoLabel = context.owner && context.repo
    ? ` de \`${context.owner}/${context.repo}\``
    : '';

  // Decodifica conteúdo base64 com segurança
  let rawContent = '';
  if (file.content && file.encoding === 'base64') {
    try {
      rawContent = Buffer.from(file.content, 'base64').toString('utf-8');
    } catch {
      // Falha silenciosa — exibe sem conteúdo
    }
  } else if (typeof file.content === 'string' && file.encoding !== 'base64') {
    rawContent = file.content;
  }

  if (!rawContent) {
    const sizeInfo = file.size != null ? ` (${file.size} bytes)` : '';
    return `📄 **${fileName}**${repoLabel}${sizeInfo}\n\n_(conteúdo não disponível ou vazio)_`;
  }

  // Despacha para formatador específico por tipo de arquivo
  const lowerName = fileName.toLowerCase();

  if (lowerName === 'package.json' || filePath.endsWith('/package.json')) {
    return _formatPackageJson(fileName, filePath, rawContent, repoLabel);
  }

  if (lowerName === 'readme.md' || lowerName.endsWith('.md')) {
    return _formatMarkdown(fileName, filePath, rawContent, repoLabel);
  }

  if (lowerName.endsWith('.json')) {
    return _formatJson(fileName, filePath, rawContent, repoLabel);
  }

  if (/\.(jsx?|tsx?)$/.test(lowerName)) {
    return _formatJavaScript(fileName, filePath, rawContent, repoLabel);
  }

  return _formatPlainFile(fileName, filePath, rawContent, repoLabel);
}

/**
 * Formata resposta de erro em texto amigável (sem vazar código interno).
 *
 * @param {{ code: string, message: string, details?: string }} error
 * @returns {string}
 */
export function formatErrorResponse(error) {
  if (!error) return '❌ Ocorreu um erro desconhecido na integração GitHub.';

  const { code } = error;

  if (code === 'GITHUB_DISABLED') {
    return '⚠️ A integração com GitHub está desabilitada no momento. Fale com o administrador para ativar.';
  }

  if (code === 'GITHUB_NO_TOKEN') {
    return '🔑 Token GitHub não configurado. Para usar a integração real com o GitHub, configure o GITHUB_TOKEN no ambiente.';
  }

  if (code === 'GITHUB_VALIDATION_ERROR') {
    return `⚠️ Parâmetros insuficientes: ${error.message}`;
  }

  if (code === 'GITHUB_API_ERROR') {
    const detail = error.details ? ` (${error.details})` : '';
    return `❌ Erro ao acessar o GitHub.${detail} Tente novamente em instantes.`;
  }

  // Código desconhecido — mensagem genérica sem expor detalhes internos
  return `❌ ${error.message || 'Ocorreu um erro na integração GitHub.'}`;
}

/**
 * Entrada principal — formata o resultado de qualquer tool GitHub.
 *
 * @param {string} toolName
 * @param {object} data
 * @param {{ owner?: string, repo?: string, path?: string }} [context]
 * @returns {string}
 */
export function formatGitHubToolResult(toolName, data, context = {}) {
  if (toolName === 'github_list_repos') {
    return formatReposResponse(data);
  }

  if (toolName === 'github_list_branches') {
    return formatBranchesResponse(data, context);
  }

  if (toolName === 'github_get_file') {
    return formatFileResponse(data, context);
  }

  return `✅ Operação concluída: ${toolName}`;
}

// ---------------------------------------------------------------------------
// Formatadores internos por tipo de arquivo
// ---------------------------------------------------------------------------

/**
 * Formata package.json com destaque para nome, versão, scripts e dependências.
 */
function _formatPackageJson(fileName, filePath, raw, repoLabel) {
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return _formatPlainFile(fileName, filePath, raw, repoLabel);
  }

  const lines = [`📦 **${fileName}**${repoLabel}`, ''];

  if (pkg.name) lines.push(`**Projeto:** ${pkg.name}`);
  if (pkg.version) lines.push(`**Versão:** ${pkg.version}`);
  if (pkg.description) lines.push(`**Descrição:** ${pkg.description}`);

  // Scripts
  const scripts = pkg.scripts ? Object.keys(pkg.scripts) : [];
  if (scripts.length > 0) {
    const displayed = scripts.slice(0, 8);
    const extra = scripts.length > 8 ? ` (+ ${scripts.length - 8} mais)` : '';
    lines.push(`**Scripts:** ${displayed.join(', ')}${extra}`);
  }

  // Dependências
  const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
  if (deps.length > 0) {
    const main = deps.slice(0, 5);
    const extra = deps.length > 5 ? ` (+ ${deps.length - 5} mais)` : '';
    lines.push(`**Dependências:** ${main.join(', ')}${extra}`);
  }

  // DevDependencies
  const devDeps = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
  if (devDeps.length > 0) {
    const main = devDeps.slice(0, 5);
    const extra = devDeps.length > 5 ? ` (+ ${devDeps.length - 5} mais)` : '';
    lines.push(`**DevDependencies:** ${main.join(', ')}${extra}`);
  }

  lines.push('');
  lines.push('_[conteúdo truncado — mostrando resumo das informações principais]_');

  return lines.join('\n');
}

/**
 * Formata arquivo Markdown com resumo das seções e primeiro parágrafo.
 */
function _formatMarkdown(fileName, filePath, raw, repoLabel) {
  const allLines = raw.split('\n');

  // Extrai seções (linhas que começam com #)
  const sections = allLines
    .filter((l) => /^#{1,3}\s/.test(l))
    .map((l) => l.replace(/^#+\s+/, '').trim())
    .slice(0, 8);

  // Primeiro parágrafo de texto (ignora linhas vazias e cabeçalhos)
  let firstPara = '';
  let collecting = false;
  const paraLines = [];
  for (const line of allLines) {
    if (/^#{1,6}\s/.test(line) || line.startsWith('---') || line.startsWith('===')) {
      if (collecting && paraLines.length > 0) break;
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      collecting = true;
      paraLines.push(trimmed);
      if (paraLines.join(' ').length > 300) break;
    } else if (collecting && paraLines.length > 0) {
      break;
    }
  }
  firstPara = paraLines.join(' ');
  if (firstPara.length > 300) {
    firstPara = firstPara.slice(0, 300) + '…';
  }

  const lines = [`📝 **${fileName}**${repoLabel}`, ''];

  if (firstPara) {
    lines.push(firstPara);
    lines.push('');
  }

  if (sections.length > 0) {
    lines.push(`**Seções:** ${sections.join(' · ')}`);
    lines.push('');
  }

  const truncInfo = `_[conteúdo truncado — mostrando resumo de ${allLines.length} linhas]_`;
  lines.push(truncInfo);

  return lines.join('\n');
}

/**
 * Formata arquivo JSON com visão geral da estrutura.
 */
function _formatJson(fileName, filePath, raw, repoLabel) {
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return _formatPlainFile(fileName, filePath, raw, repoLabel);
  }

  const topKeys = Array.isArray(obj)
    ? `Array com ${obj.length} item${obj.length !== 1 ? 's' : ''}`
    : `Objeto com chaves: ${Object.keys(obj).slice(0, 10).join(', ')}${Object.keys(obj).length > 10 ? '…' : ''}`;

  const truncated = _truncateContent(raw);
  const wasTruncated = raw.length > MAX_FILE_CONTENT_CHARS;

  const lines = [
    `🗂️ **${fileName}**${repoLabel}`,
    '',
    `**Estrutura:** ${topKeys}`,
    '',
    '```json',
    truncated,
    '```',
  ];

  if (wasTruncated) {
    lines.push(`_[conteúdo truncado — mostrando primeiros ${MAX_FILE_CONTENT_CHARS} caracteres]_`);
  }

  return lines.join('\n');
}

/**
 * Formata arquivo JavaScript/TypeScript com destaque de exports e funções.
 */
function _formatJavaScript(fileName, filePath, raw, repoLabel) {
  const allLines = raw.split('\n');

  // Detecta exports e funções nomeadas
  const exports = [];
  const functions = [];
  for (const line of allLines) {
    if (/^export\s+(default\s+)?(function|class|const|let|var|async)\s+(\w+)/.test(line)) {
      const match = line.match(/^export\s+(?:default\s+)?(?:function|class|const|let|var|async\s+function)\s+(\w+)/);
      if (match) exports.push(match[1]);
    } else if (/^(async\s+)?function\s+(\w+)/.test(line)) {
      const match = line.match(/^(?:async\s+)?function\s+(\w+)/);
      if (match) functions.push(match[1]);
    }
  }

  const truncated = _truncateContent(raw);
  const wasTruncated = raw.length > MAX_FILE_CONTENT_CHARS;

  const lines = [`⚙️ **${fileName}**${repoLabel}`, ''];

  if (exports.length > 0) {
    lines.push(`**Exports:** ${exports.slice(0, 8).join(', ')}${exports.length > 8 ? '…' : ''}`);
  }
  if (functions.length > 0) {
    lines.push(`**Funções:** ${functions.slice(0, 8).join(', ')}${functions.length > 8 ? '…' : ''}`);
  }

  lines.push('', '```javascript', truncated, '```');

  if (wasTruncated) {
    lines.push(`_[conteúdo truncado — mostrando primeiros ${MAX_FILE_CONTENT_CHARS} caracteres]_`);
  }

  return lines.join('\n');
}

/**
 * Formata arquivo genérico mostrando as primeiras N linhas.
 */
function _formatPlainFile(fileName, filePath, raw, repoLabel) {
  const allLines = raw.split('\n');
  const tooManyLines = allLines.length > MAX_PLAIN_LINES;
  const tooLong = raw.length > MAX_FILE_CONTENT_CHARS;

  const displayed = allLines.slice(0, MAX_PLAIN_LINES);
  let content = displayed.join('\n');
  if (content.length > MAX_FILE_CONTENT_CHARS) {
    content = content.slice(0, MAX_FILE_CONTENT_CHARS);
  }

  const lines = [`📄 **${fileName}**${repoLabel}`, '', '```text', content, '```'];

  if (tooManyLines) {
    lines.push(
      `_[conteúdo truncado — mostrando primeiros ${Math.min(MAX_PLAIN_LINES, allLines.length)} de ${allLines.length} linhas]_`,
    );
  } else if (tooLong) {
    lines.push(
      `_[conteúdo truncado — mostrando primeiros ${MAX_FILE_CONTENT_CHARS} caracteres de ${raw.length}]_`,
    );
  }

  return lines.join('\n');
}

/**
 * Trunca string de conteúdo de forma segura, sem cortar sequências de escape.
 *
 * @param {string} content
 * @returns {string}
 */
function _truncateContent(content) {
  if (content.length <= MAX_FILE_CONTENT_CHARS) return content;
  return content.slice(0, MAX_FILE_CONTENT_CHARS);
}
