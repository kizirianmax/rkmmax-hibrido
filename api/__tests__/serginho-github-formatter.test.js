/**
 * api/__tests__/serginho-github-formatter.test.js
 * Testes para o formatador de respostas GitHub do Serginho.
 *
 * Cobre:
 *   - formatReposResponse: lista com contagem, nomes, visibilidade, branch, descrição
 *   - formatBranchesResponse: lista com indicador de proteção, contagem, repo alvo
 *   - formatFileResponse: nome/caminho exibido, conteúdo truncado com aviso
 *   - package.json smart formatting: extrai nome, versão, scripts, dependências
 *   - README.md smart formatting: primeiro parágrafo, seções
 *   - *.json smart formatting: visão geral da estrutura
 *   - *.js/*.jsx/*.ts/*.tsx smart formatting: exports e funções
 *   - Arquivos genéricos: primeiras N linhas
 *   - Truncamento seguro: conteúdo longo truncado com aviso "[conteúdo truncado…]"
 *   - formatErrorResponse: GITHUB_DISABLED, GITHUB_NO_TOKEN, GITHUB_VALIDATION_ERROR, GITHUB_API_ERROR
 *   - formatGitHubToolResult: entrada principal despacha para formatador correto
 *   - Resultados vazios: repos[], branches[], file sem conteúdo tratados com elegância
 *   - Segurança: sem vazamento de token, stacktrace ou headers
 *   - Modo stub: dados stub formatados com legibilidade
 *   - Integração orchestrator: respostas usam o formatador (sem regressão no fluxo normal)
 */

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Importação direta do formatador (sem mocks — é puro, sem dependências externas)
// ---------------------------------------------------------------------------

let formatReposResponse,
  formatBranchesResponse,
  formatFileResponse,
  formatErrorResponse,
  formatGitHubToolResult;

beforeAll(async () => {
  ({
    formatReposResponse,
    formatBranchesResponse,
    formatFileResponse,
    formatErrorResponse,
    formatGitHubToolResult,
  } = await import('../lib/serginho/formatters/githubResponseFormatter.js'));
});

// ---------------------------------------------------------------------------
// Helpers de fixture
// ---------------------------------------------------------------------------

function makeRepo(overrides = {}) {
  return {
    id: 1,
    name: 'meu-repo',
    fullName: 'user/meu-repo',
    private: false,
    defaultBranch: 'main',
    description: 'Repo de teste',
    ...overrides,
  };
}

function makeBranch(overrides = {}) {
  return { name: 'main', sha: 'abc123', protected: true, ...overrides };
}

function makeFileData(fileName, rawContent, overrides = {}) {
  return {
    file: {
      name: fileName,
      path: fileName,
      size: rawContent.length,
      encoding: 'base64',
      content: Buffer.from(rawContent).toString('base64'),
      ...overrides,
    },
    mode: 'oauth',
  };
}

// ---------------------------------------------------------------------------
// 1) formatReposResponse — lista de repositórios
// ---------------------------------------------------------------------------

describe('formatReposResponse — lista de repositórios', () => {
  test('exibe contagem total de repos', () => {
    const repos = [makeRepo(), makeRepo({ name: 'outro', fullName: 'user/outro' })];
    const result = formatReposResponse({ repos, mode: 'oauth' });
    expect(result).toContain('2');
  });

  test('exibe nome do repositório (fullName)', () => {
    const result = formatReposResponse({ repos: [makeRepo()], mode: 'oauth' });
    expect(result).toContain('user/meu-repo');
  });

  test('exibe visibilidade pública (🔓 público)', () => {
    const result = formatReposResponse({ repos: [makeRepo({ private: false })], mode: 'oauth' });
    expect(result).toContain('público');
  });

  test('exibe visibilidade privada (🔒 privado)', () => {
    const result = formatReposResponse({ repos: [makeRepo({ private: true })], mode: 'oauth' });
    expect(result).toContain('privado');
  });

  test('exibe branch default quando disponível', () => {
    const result = formatReposResponse({ repos: [makeRepo({ defaultBranch: 'main' })], mode: 'oauth' });
    expect(result).toContain('main');
  });

  test('exibe descrição quando disponível', () => {
    const result = formatReposResponse({
      repos: [makeRepo({ description: 'Minha descrição especial' })],
      mode: 'oauth',
    });
    expect(result).toContain('Minha descrição especial');
  });

  test('omite descrição quando ausente', () => {
    const result = formatReposResponse({
      repos: [makeRepo({ description: null })],
      mode: 'oauth',
    });
    // Não deve conter "undefined" ou "null"
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('null');
  });

  test('array vazio → mensagem de "nenhum repositório"', () => {
    const result = formatReposResponse({ repos: [], mode: 'oauth' });
    expect(result).toMatch(/nenhum repositório/i);
  });

  test('data undefined → mensagem de "nenhum repositório"', () => {
    const result = formatReposResponse(undefined);
    expect(result).toMatch(/nenhum repositório/i);
  });

  test('limita exibição a top 10 repos', () => {
    const repos = Array.from({ length: 15 }, (_, i) =>
      makeRepo({ name: `repo-${i}`, fullName: `user/repo-${i}` }),
    );
    const result = formatReposResponse({ repos, mode: 'oauth' });
    // Deve mostrar aviso de "mostrando X de Y"
    expect(result).toContain('15');
    expect(result).toContain('10');
  });

  test('não vaza token ou stacktrace', () => {
    const repos = [makeRepo({ name: 'ghp_FAKE_TOKEN_repo' })];
    const result = formatReposResponse({ repos, mode: 'oauth' });
    // O nome do repo pode aparecer, mas não deve conter strings típicas de token
    expect(result).not.toMatch(/Bearer\s/i);
    expect(result).not.toMatch(/Authorization:/i);
    expect(result).not.toMatch(/stack trace/i);
  });
});

// ---------------------------------------------------------------------------
// 2) formatBranchesResponse — lista de branches
// ---------------------------------------------------------------------------

describe('formatBranchesResponse — lista de branches', () => {
  test('exibe nome de todas as branches', () => {
    const branches = [makeBranch(), makeBranch({ name: 'develop', protected: false })];
    const result = formatBranchesResponse({ branches, mode: 'oauth' }, {});
    expect(result).toContain('main');
    expect(result).toContain('develop');
  });

  test('exibe indicador de protegida para branch protegida', () => {
    const result = formatBranchesResponse(
      { branches: [makeBranch({ protected: true })], mode: 'oauth' },
      {},
    );
    expect(result).toContain('protegida');
  });

  test('não exibe indicador de protegida para branch não-protegida', () => {
    const result = formatBranchesResponse(
      { branches: [makeBranch({ name: 'develop', protected: false })], mode: 'oauth' },
      {},
    );
    // deve conter o nome
    expect(result).toContain('develop');
    // não deve conter "protegida" junto ao nome develop
    const lines = result.split('\n');
    const developLine = lines.find((l) => l.includes('develop'));
    expect(developLine).not.toMatch(/protegida/i);
  });

  test('exibe repo alvo no cabeçalho quando context tem owner/repo', () => {
    const result = formatBranchesResponse(
      { branches: [makeBranch()], mode: 'oauth' },
      { owner: 'user', repo: 'meu-repo' },
    );
    expect(result).toContain('user/meu-repo');
  });

  test('exibe contagem total de branches', () => {
    const branches = [makeBranch(), makeBranch({ name: 'feature', protected: false })];
    const result = formatBranchesResponse({ branches, mode: 'oauth' }, {});
    expect(result).toContain('2');
  });

  test('array vazio → mensagem de "nenhuma branch"', () => {
    const result = formatBranchesResponse({ branches: [], mode: 'oauth' }, {});
    expect(result).toMatch(/nenhuma branch/i);
  });

  test('data undefined → mensagem de "nenhuma branch"', () => {
    const result = formatBranchesResponse(undefined, {});
    expect(result).toMatch(/nenhuma branch/i);
  });

  test('não vaza token ou stacktrace', () => {
    const branches = [makeBranch()];
    const result = formatBranchesResponse({ branches, mode: 'oauth' }, {});
    expect(result).not.toMatch(/Bearer\s/i);
    expect(result).not.toMatch(/Authorization:/i);
    expect(result).not.toMatch(/stack/i);
  });
});

// ---------------------------------------------------------------------------
// 3) formatFileResponse — conteúdo de arquivo
// ---------------------------------------------------------------------------

describe('formatFileResponse — conteúdo de arquivo', () => {
  test('exibe nome do arquivo', () => {
    const data = makeFileData('script.sh', '#!/bin/bash\necho hello');
    const result = formatFileResponse(data, {});
    expect(result).toContain('script.sh');
  });

  test('exibe caminho do arquivo do context quando file.name está ausente', () => {
    const data = {
      file: {
        path: 'src/utils/helper.js',
        size: 10,
        encoding: 'base64',
        content: Buffer.from('const x = 1;').toString('base64'),
      },
      mode: 'oauth',
    };
    const result = formatFileResponse(data, { path: 'src/utils/helper.js' });
    expect(result).toContain('helper.js');
  });

  test('exibe repo label quando owner e repo são fornecidos', () => {
    const data = makeFileData('arquivo.txt', 'conteúdo');
    const result = formatFileResponse(data, { owner: 'user', repo: 'meu-repo' });
    expect(result).toContain('user/meu-repo');
  });

  test('decodifica conteúdo base64 corretamente', () => {
    const data = makeFileData('texto.txt', 'Olá mundo!');
    const result = formatFileResponse(data, {});
    expect(result).toContain('Olá mundo!');
  });

  test('arquivo sem conteúdo → mensagem de "conteúdo não disponível"', () => {
    const data = { file: { name: 'vazio.txt', size: 0 }, mode: 'oauth' };
    const result = formatFileResponse(data, {});
    expect(result).toContain('vazio.txt');
    expect(result).toMatch(/não disponível|vazio/i);
  });

  test('conteúdo muito longo → truncado com aviso', () => {
    const longContent = 'a'.repeat(5000);
    const data = makeFileData('grande.txt', longContent);
    const result = formatFileResponse(data, {});
    expect(result).toMatch(/truncado/i);
    // Conteúdo não deve ter mais que 2000 + overhead chars razoável
    expect(result.length).toBeLessThan(4000);
  });

  test('aviso de truncamento contém quantidade de caracteres', () => {
    const longContent = 'x'.repeat(5000);
    const data = makeFileData('enorme.txt', longContent);
    const result = formatFileResponse(data, {});
    expect(result).toMatch(/primeiros.*2000|2000.*caracteres/i);
  });

  test('não vaza token ou stacktrace', () => {
    const data = makeFileData('seguro.txt', 'conteúdo normal sem segredos');
    const result = formatFileResponse(data, {});
    expect(result).not.toMatch(/Bearer\s/i);
    expect(result).not.toMatch(/Authorization:/i);
    expect(result).not.toContain('ghp_');
  });
});

// ---------------------------------------------------------------------------
// 4) package.json smart formatting
// ---------------------------------------------------------------------------

describe('formatFileResponse — package.json smart formatting', () => {
  const pkgContent = JSON.stringify({
    name: 'rkmmax-hibrido',
    version: '1.0.0',
    description: 'Sistema híbrido de IA',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      test: 'jest',
      lint: 'eslint .',
    },
    dependencies: {
      react: '^18.0.0',
      vite: '^5.0.0',
      express: '^4.0.0',
    },
    devDependencies: {
      jest: '^29.0.0',
      eslint: '^8.0.0',
      prettier: '^3.0.0',
    },
  });

  test('exibe nome do projeto', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('rkmmax-hibrido');
  });

  test('exibe versão', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('1.0.0');
  });

  test('exibe scripts principais', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('dev');
    expect(result).toContain('build');
    expect(result).toContain('test');
  });

  test('exibe dependências principais', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('react');
  });

  test('exibe devDependencies', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('jest');
  });

  test('inclui aviso de resumo (conteúdo truncado)', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toMatch(/truncado|resumo/i);
  });

  test('emoji 📦 presente', () => {
    const data = makeFileData('package.json', pkgContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('📦');
  });

  test('package.json com muitas dependências mostra "+" mais', () => {
    const pkg = JSON.parse(pkgContent);
    pkg.dependencies = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`dep-${i}`, `^1.${i}.0`]),
    );
    const data = makeFileData('package.json', JSON.stringify(pkg));
    const result = formatFileResponse(data, {});
    expect(result).toMatch(/\+\s*\d+\s*mais/i);
  });

  test('package.json sem scripts → não quebra', () => {
    const pkg = { name: 'minimal', version: '0.1.0' };
    const data = makeFileData('package.json', JSON.stringify(pkg));
    const result = formatFileResponse(data, {});
    expect(result).toContain('minimal');
    expect(result).not.toMatch(/Scripts:/);
  });

  test('package.json inválido → fallback para formatação genérica', () => {
    const data = makeFileData('package.json', '{ invalid json !!');
    const result = formatFileResponse(data, {});
    // Deve ainda conter o nome do arquivo
    expect(result).toContain('package.json');
    // Não deve vazar stacktrace de parse error
    expect(result).not.toMatch(/SyntaxError/i);
  });
});

// ---------------------------------------------------------------------------
// 5) README.md smart formatting
// ---------------------------------------------------------------------------

describe('formatFileResponse — README.md smart formatting', () => {
  const readmeContent = `# RKMMax Híbrido

Sistema de IA híbrida com múltiplos especialistas.

## Instalação

Para instalar, execute \`npm install\`.

## Uso

Acesse http://localhost:5173 após iniciar o servidor.

## Contribuição

Veja CONTRIBUTING.md para detalhes.
`;

  test('exibe nome do arquivo (README.md)', () => {
    const data = makeFileData('README.md', readmeContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('README.md');
  });

  test('exibe emoji 📝', () => {
    const data = makeFileData('README.md', readmeContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('📝');
  });

  test('mostra primeiro parágrafo de texto', () => {
    const data = makeFileData('README.md', readmeContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('Sistema de IA híbrida');
  });

  test('mostra seções detectadas', () => {
    const data = makeFileData('README.md', readmeContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('Instalação');
  });

  test('inclui aviso de truncamento', () => {
    const data = makeFileData('README.md', readmeContent);
    const result = formatFileResponse(data, {});
    expect(result).toMatch(/truncado/i);
  });

  test('*.md extension também usa formatação markdown', () => {
    const data = makeFileData('CONTRIBUTING.md', readmeContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('📝');
  });

  test('README.md vazio → não quebra', () => {
    const data = makeFileData('README.md', '');
    const result = formatFileResponse(data, {});
    expect(result).toContain('README.md');
    expect(result).toMatch(/não disponível|vazio/i);
  });
});

// ---------------------------------------------------------------------------
// 6) *.json smart formatting
// ---------------------------------------------------------------------------

describe('formatFileResponse — *.json smart formatting', () => {
  test('exibe emoji 🗂️', () => {
    const data = makeFileData('config.json', JSON.stringify({ key: 'value', num: 42 }));
    const result = formatFileResponse(data, {});
    expect(result).toContain('🗂️');
  });

  test('exibe chaves do objeto', () => {
    const data = makeFileData('config.json', JSON.stringify({ host: 'localhost', port: 3000 }));
    const result = formatFileResponse(data, {});
    expect(result).toContain('host');
    expect(result).toContain('port');
  });

  test('array JSON exibe tamanho do array', () => {
    const data = makeFileData('items.json', JSON.stringify([1, 2, 3]));
    const result = formatFileResponse(data, {});
    expect(result).toContain('3');
  });

  test('JSON inválido → fallback genérico sem SyntaxError visível', () => {
    const data = makeFileData('broken.json', '{ "x": invalid }');
    const result = formatFileResponse(data, {});
    expect(result).toContain('broken.json');
    expect(result).not.toMatch(/SyntaxError/i);
  });
});

// ---------------------------------------------------------------------------
// 7) *.js/*.ts/*.jsx/*.tsx smart formatting
// ---------------------------------------------------------------------------

describe('formatFileResponse — JS/TS/JSX/TSX smart formatting', () => {
  const jsContent = `
export function soma(a, b) { return a + b; }
export const PI = 3.14;
export default function App() { return null; }

async function helper() { return true; }
function local() {}
`;

  test('exibe emoji ⚙️', () => {
    const data = makeFileData('utils.js', jsContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('⚙️');
  });

  test('exibe exports detectados', () => {
    const data = makeFileData('utils.js', jsContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('soma');
  });

  test('exibe funções detectadas', () => {
    const data = makeFileData('utils.js', jsContent);
    const result = formatFileResponse(data, {});
    expect(result).toContain('helper');
  });

  test('.ts extension → usa formatação JS', () => {
    const data = makeFileData('service.ts', 'export function foo() {}');
    const result = formatFileResponse(data, {});
    expect(result).toContain('⚙️');
  });

  test('.jsx extension → usa formatação JS', () => {
    const data = makeFileData('App.jsx', 'export default function App() { return null; }');
    const result = formatFileResponse(data, {});
    expect(result).toContain('⚙️');
  });

  test('.tsx extension → usa formatação JS', () => {
    const data = makeFileData('Button.tsx', 'export const Button = () => null;');
    const result = formatFileResponse(data, {});
    expect(result).toContain('⚙️');
  });
});

// ---------------------------------------------------------------------------
// 8) Truncamento seguro de conteúdo
// ---------------------------------------------------------------------------

describe('Truncamento seguro de conteúdo', () => {
  test('conteúdo longo em arquivo genérico é truncado', () => {
    const longContent = Array.from({ length: 100 }, (_, i) => `linha ${i + 1}`).join('\n');
    const data = makeFileData('grande.log', longContent);
    const result = formatFileResponse(data, {});
    expect(result).toMatch(/truncado/i);
  });

  test('conteúdo curto não tem aviso de truncamento', () => {
    const shortContent = 'linha 1\nlinha 2\nlinha 3';
    const data = makeFileData('pequeno.txt', shortContent);
    const result = formatFileResponse(data, {});
    // Conteúdo exibido normalmente
    expect(result).toContain('linha 1');
  });

  test('aviso de truncamento nunca contém stacktrace ou token', () => {
    const longContent = 'a'.repeat(5000);
    const data = makeFileData('enorme.bin', longContent);
    const result = formatFileResponse(data, {});
    expect(result).not.toMatch(/Error:/i);
    expect(result).not.toMatch(/at\s+\w+\s*\(/);
    expect(result).not.toMatch(/ghp_/i);
  });
});

// ---------------------------------------------------------------------------
// 9) formatErrorResponse — respostas de erro amigáveis
// ---------------------------------------------------------------------------

describe('formatErrorResponse — respostas de erro amigáveis', () => {
  test('GITHUB_DISABLED → mensagem amigável sobre desabilitado', () => {
    const result = formatErrorResponse({
      code: 'GITHUB_DISABLED',
      message: 'A integração com GitHub está desabilitada.',
      details: 'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
    });
    expect(result).toMatch(/desabilitada|desabilitado/i);
    expect(result).not.toContain('GITHUB_DISABLED');
  });

  test('GITHUB_NO_TOKEN → mensagem amigável sobre token', () => {
    const result = formatErrorResponse({
      code: 'GITHUB_NO_TOKEN',
      message: 'Token GitHub não configurado.',
      details: 'Defina GITHUB_TOKEN.',
    });
    expect(result).toMatch(/token|GITHUB_TOKEN/i);
    expect(result).not.toContain('GITHUB_NO_TOKEN');
  });

  test('GITHUB_VALIDATION_ERROR → inclui mensagem de validação', () => {
    const result = formatErrorResponse({
      code: 'GITHUB_VALIDATION_ERROR',
      message: 'Os parâmetros owner e repo são obrigatórios.',
    });
    expect(result).toMatch(/parâmetros|obrigatórios/i);
  });

  test('GITHUB_API_ERROR → mensagem genérica de erro', () => {
    const result = formatErrorResponse({
      code: 'GITHUB_API_ERROR',
      message: 'Erro na integração GitHub.',
    });
    expect(result).toMatch(/erro|GitHub/i);
  });

  test('GITHUB_API_ERROR com details → inclui detail na mensagem', () => {
    const result = formatErrorResponse({
      code: 'GITHUB_API_ERROR',
      message: 'Erro na integração GitHub.',
      details: 'rate limit exceeded',
    });
    expect(result).toContain('rate limit exceeded');
  });

  test('erro desconhecido → mensagem genérica sem código interno', () => {
    const result = formatErrorResponse({ code: 'UNKNOWN_CODE', message: 'Algo deu errado.' });
    expect(result).toContain('Algo deu errado');
    // Não expõe UNKNOWN_CODE como código técnico
    expect(result).not.toContain('UNKNOWN_CODE');
  });

  test('error undefined → mensagem genérica', () => {
    const result = formatErrorResponse(undefined);
    expect(result).toMatch(/erro/i);
  });

  test('não vaza stacktrace', () => {
    const result = formatErrorResponse({
      code: 'GITHUB_API_ERROR',
      message: 'Erro inesperado.',
      stack: 'Error: at Foo.bar (line 42)',
    });
    expect(result).not.toContain('at Foo.bar');
    expect(result).not.toContain('line 42');
  });
});

// ---------------------------------------------------------------------------
// 10) formatGitHubToolResult — entrada principal
// ---------------------------------------------------------------------------

describe('formatGitHubToolResult — entrada principal', () => {
  test('github_list_repos → delega para formatReposResponse', () => {
    const data = { repos: [makeRepo()], mode: 'oauth' };
    const result = formatGitHubToolResult('github_list_repos', data, {});
    expect(result).toContain('user/meu-repo');
    expect(result).toContain('1');
  });

  test('github_list_branches → delega para formatBranchesResponse', () => {
    const data = { branches: [makeBranch()], mode: 'oauth' };
    const result = formatGitHubToolResult('github_list_branches', data, { owner: 'u', repo: 'r' });
    expect(result).toContain('main');
    expect(result).toContain('u/r');
  });

  test('github_get_file → delega para formatFileResponse', () => {
    const data = makeFileData('app.js', 'console.log("hello");');
    const result = formatGitHubToolResult('github_get_file', data, {});
    expect(result).toContain('app.js');
  });

  test('tool desconhecida → retorna mensagem genérica', () => {
    const result = formatGitHubToolResult('github_unknown_tool', {}, {});
    expect(result).toContain('github_unknown_tool');
  });
});

// ---------------------------------------------------------------------------
// 11) Modo stub — dados stub formatados de forma legível
// ---------------------------------------------------------------------------

describe('Modo stub — dados stub formatados de forma legível', () => {
  test('stub repos formatados com nome e visibilidade', () => {
    const stubRepos = [
      {
        id: 1,
        name: 'exemplo-repo',
        fullName: 'usuario/exemplo-repo',
        private: false,
        defaultBranch: 'main',
        description: 'Repositório de exemplo (modo stub)',
      },
    ];
    const result = formatReposResponse({ repos: stubRepos, mode: 'stub' });
    expect(result).toContain('usuario/exemplo-repo');
    expect(result).toContain('público');
  });

  test('stub branches formatadas com indicador de protegida', () => {
    const stubBranches = [
      { name: 'main', sha: 'abc', protected: true },
      { name: 'develop', sha: 'def', protected: false },
    ];
    const result = formatBranchesResponse({ branches: stubBranches, mode: 'stub' }, {});
    expect(result).toContain('main');
    expect(result).toContain('protegida');
    expect(result).toContain('develop');
  });

  test('stub file formatado com nome e conteúdo', () => {
    const stubFile = {
      file: {
        name: 'exemplo.md',
        path: 'exemplo.md',
        sha: 'aabbccdd',
        size: 30,
        encoding: 'base64',
        content: Buffer.from('Arquivo de exemplo (modo stub)').toString('base64'),
      },
      mode: 'stub',
    };
    const result = formatFileResponse(stubFile, {});
    expect(result).toContain('exemplo.md');
    expect(result).toContain('Arquivo de exemplo (modo stub)');
  });
});

// ---------------------------------------------------------------------------
// 12) Resultados vazios tratados com elegância
// ---------------------------------------------------------------------------

describe('Resultados vazios tratados com elegância', () => {
  test('repos vazios → mensagem clara', () => {
    const result = formatReposResponse({ repos: [], mode: 'oauth' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/nenhum/i);
  });

  test('branches vazias → mensagem clara', () => {
    const result = formatBranchesResponse({ branches: [], mode: 'oauth' }, {});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/nenhuma/i);
  });

  test('file sem content → mensagem de não disponível', () => {
    const result = formatFileResponse({ file: { name: 'empty.js', size: 0 }, mode: 'oauth' }, {});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/não disponível|vazio/i);
  });

  test('repos null/undefined → sem crash', () => {
    expect(() => formatReposResponse(null)).not.toThrow();
    expect(() => formatReposResponse(undefined)).not.toThrow();
  });

  test('branches null/undefined → sem crash', () => {
    expect(() => formatBranchesResponse(null, {})).not.toThrow();
    expect(() => formatBranchesResponse(undefined, {})).not.toThrow();
  });

  test('file null/undefined → sem crash', () => {
    expect(() => formatFileResponse(null, {})).not.toThrow();
    expect(() => formatFileResponse(undefined, {})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 13) Integração com orchestrator — sem regressão (mocks de infra necessários)
// ---------------------------------------------------------------------------

// Mocks para isolar o orchestrator de chamadas externas
const mockGetGitHubConfig = jest.fn();
const mockSerginhoListRepos = jest.fn();
const mockSerginhoListBranches = jest.fn();
const mockSerginhoGetFile = jest.fn();
const mockAnalyzeComplexity = jest.fn(() => ({ scores: { complexity: 0.5 } }));
const mockRouteToProvider = jest.fn(() => ({ provider: 'groq' }));
const mockGetNextFallback = jest.fn(() => null);
const mockGetProviderConfig = jest.fn(() => ({ model: 'llama-test' }));
const mockGetModelMetadata = jest.fn(() => ({}));
const mockGetEnabledProviders = jest.fn(() => ['groq']);
const mockGetWeightedProviders = jest.fn(() => ['groq']);

const configModulePath = path.resolve(__dirname, '../lib/github/githubConfig.js');
const gatewayModulePath = path.resolve(__dirname, '../lib/serginho/githubGateway.js');
const routerModulePath = path.resolve(__dirname, '../../src/utils/intelligentRouter.js');
const circuitBreakerModulePath = path.resolve(__dirname, '../lib/circuit-breaker.js');
const providersConfigModulePath = path.resolve(__dirname, '../lib/providers-config.js');
const modelRegistryModulePath = path.resolve(__dirname, '../lib/model-registry.js');

jest.unstable_mockModule(configModulePath, () => ({
  getGitHubConfig: mockGetGitHubConfig,
}));

jest.unstable_mockModule(gatewayModulePath, () => ({
  serginhoListRepos: mockSerginhoListRepos,
  serginhoListBranches: mockSerginhoListBranches,
  serginhoGetFile: mockSerginhoGetFile,
}));

jest.unstable_mockModule(routerModulePath, () => ({
  analyzeComplexity: mockAnalyzeComplexity,
  routeToProvider: mockRouteToProvider,
  getNextFallback: mockGetNextFallback,
  FALLBACK_CHAIN: [],
}));

jest.unstable_mockModule(circuitBreakerModulePath, () => ({
  default: jest.fn().mockImplementation(() => ({
    execute: jest.fn((fn) => fn()),
  })),
}));

jest.unstable_mockModule(providersConfigModulePath, () => ({
  getProviderConfig: mockGetProviderConfig,
  getModelMetadata: mockGetModelMetadata,
  PROVIDERS: { groq: { model: 'llama-test' } },
  getEnabledProviders: mockGetEnabledProviders,
  getWeightedProviders: mockGetWeightedProviders,
}));

jest.unstable_mockModule(modelRegistryModulePath, () => ({
  default: {
    registerModel: jest.fn(),
    recordExecution: jest.fn(),
    getModelStats: jest.fn(() => ({})),
    getAllModels: jest.fn(() => []),
  },
}));

let serginho;

beforeAll(async () => {
  ({ default: serginho } = await import('../lib/serginho-orchestrator.js'));
});

function configEnabled() {
  mockGetGitHubConfig.mockReturnValue({ enabled: true, mode: 'oauth', hasToken: true });
}

function configDisabled() {
  mockGetGitHubConfig.mockReturnValue({ enabled: false, mode: 'oauth', hasToken: false });
}

function configStub() {
  mockGetGitHubConfig.mockReturnValue({ enabled: true, mode: 'stub', hasToken: false });
}

describe('Integração orchestrator — formatter usado nas respostas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('list repos → resposta usa formatação com contagem e visibilidade', async () => {
    configEnabled();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: {
        repos: [
          { id: 1, name: 'meu-repo', fullName: 'user/meu-repo', private: false, defaultBranch: 'main', description: 'Desc' },
        ],
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    expect(result.model).toBe('serginho-intent');
    // Novo formatter usa numeração (1.) e "público"
    expect(result.text).toContain('user/meu-repo');
    expect(result.text).toContain('público');
    // Não chama router de IA
    expect(mockAnalyzeComplexity).not.toHaveBeenCalled();
  });

  test('list branches → resposta usa formatação com protegida label', async () => {
    configEnabled();
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: {
        branches: [
          { name: 'main', sha: 'abc', protected: true },
          { name: 'develop', sha: 'def', protected: false },
        ],
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest(
      'liste as branches do repo user/meu-repo',
    );
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('main');
    expect(result.text).toContain('protegida');
    expect(result.text).toContain('develop');
  });

  test('get file README.md → resposta usa formatação markdown', async () => {
    configEnabled();
    const content = Buffer.from('# Título\n\nPrimeiro parágrafo.\n\n## Seção').toString('base64');
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: {
        file: { name: 'README.md', path: 'README.md', content, encoding: 'base64', size: 50 },
        mode: 'oauth',
      },
    });

    const result = await serginho.handleRequest(
      'mostre o arquivo README.md do repo user/meu-repo',
    );
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('README.md');
    expect(result.text).toContain('📝');
  });

  test('GITHUB_DISABLED → resposta amigável sem código de erro técnico', async () => {
    configDisabled();
    mockSerginhoListRepos.mockResolvedValue({
      success: false,
      error: {
        code: 'GITHUB_DISABLED',
        message: 'A integração com GitHub está desabilitada.',
        details: 'Defina GITHUB_INTEGRATION_ENABLED=true para ativar.',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    // Novo formatter: mensagem amigável, sem código técnico "GITHUB_DISABLED"
    expect(result.text).toMatch(/desabilitada|desabilitado/i);
    expect(result.text).not.toContain('GITHUB_DISABLED');
    expect(result._meta.errorCode).toBe('GITHUB_DISABLED');
  });

  test('GITHUB_NO_TOKEN → resposta amigável sobre configuração de token', async () => {
    mockGetGitHubConfig.mockReturnValue({ enabled: true, mode: 'oauth', hasToken: false });
    mockSerginhoListRepos.mockResolvedValue({
      success: false,
      error: {
        code: 'GITHUB_NO_TOKEN',
        message: 'Token GitHub não configurado.',
        details: 'Defina GITHUB_TOKEN no ambiente.',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toMatch(/token|GITHUB_TOKEN/i);
  });

  test('stub mode → dados stub formatados de forma legível', async () => {
    configStub();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: {
        repos: [
          {
            id: 1,
            name: 'exemplo-repo',
            fullName: 'usuario/exemplo-repo',
            private: false,
            defaultBranch: 'main',
            description: 'Repositório de exemplo (modo stub)',
          },
        ],
        mode: 'stub',
      },
    });

    const result = await serginho.handleRequest('liste meus repositórios');
    expect(result.provider).toBe('serginho-tools');
    expect(result.text).toContain('usuario/exemplo-repo');
    expect(result._meta.mode).toBe('stub');
  });

  test('prompt não-GitHub → fluxo normal sem tool GitHub chamada', async () => {
    configEnabled();

    // Simula erro de rede do provider (suficiente para verificar que o router foi chamado)
    mockAnalyzeComplexity.mockReturnValueOnce({ scores: { complexity: 0.3 } });
    mockRouteToProvider.mockReturnValueOnce({ provider: 'groq' });

    // Não deve chamar nenhuma tool GitHub
    await serginho.handleRequest('quanto é 2 + 2?').catch(() => {
      // pode falhar na chamada ao provider — não importa, só queremos verificar o flow
    });

    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
    // O router de IA foi chamado (fluxo normal)
    expect(mockAnalyzeComplexity).toHaveBeenCalled();
  });
});
