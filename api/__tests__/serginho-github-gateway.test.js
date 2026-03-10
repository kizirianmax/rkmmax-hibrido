/**
 * api/__tests__/serginho-github-gateway.test.js
 * Testes unitários para o gateway GitHub do Serginho.
 *
 * Cobre:
 *   - Flag off (GITHUB_DISABLED) → success: false, error.code: 'GITHUB_DISABLED'
 *   - Modo stub → success: true, dados mock coerentes, fetch NUNCA chamado
 *   - OAuth sem token (GITHUB_NO_TOKEN) → success: false, error.code: 'GITHUB_NO_TOKEN'
 *   - OAuth com token → chama githubService, retorna dados sanitizados
 *   - Validação (GITHUB_VALIDATION_ERROR) → owner/repo/path ausentes retornam erro
 *   - Erros de API (GITHUB_API_ERROR) → capturados e retornados sem stacktrace/token
 */

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve paths relative to this test file (portable across environments)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configModulePath = path.resolve(__dirname, '../lib/github/githubConfig.js');
const serviceModulePath = path.resolve(__dirname, '../lib/github/githubService.js');

// ---------------------------------------------------------------------------
// Mocks de módulos — devem ser declarados ANTES de qualquer import dinâmico.
// Usamos caminhos absolutos calculados via import.meta.url para portabilidade.
// ---------------------------------------------------------------------------

const mockGetGitHubConfig = jest.fn();
const mockListRepos = jest.fn();
const mockListBranches = jest.fn();
const mockGetFile = jest.fn();

jest.unstable_mockModule(configModulePath, () => ({ getGitHubConfig: mockGetGitHubConfig }));

jest.unstable_mockModule(serviceModulePath, () => ({
  listRepos: mockListRepos,
  listBranches: mockListBranches,
  getFile: mockGetFile,
  putFile: jest.fn(),
  createPR: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Importação dinâmica do módulo em teste (após mocks registrados)
// ---------------------------------------------------------------------------

let serginhoListRepos, serginhoListBranches, serginhoGetFile;
let GitHubClientError;

beforeAll(async () => {
  ({ serginhoListRepos, serginhoListBranches, serginhoGetFile } = await import(
    '../lib/serginho/githubGateway.js'
  ));
  ({ GitHubClientError } = await import('../lib/github/githubClient.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: configura mockGetGitHubConfig para um cenário específico
// ---------------------------------------------------------------------------

function configDisabled() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: false,
    mode: 'stub',
    hasToken: false,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

function configStub() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'stub',
    hasToken: false,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

function configOAuthNoToken() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'oauth',
    hasToken: false,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

function configOAuthWithToken() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'oauth',
    hasToken: true,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

// ---------------------------------------------------------------------------
// 1) Flag off → GITHUB_DISABLED
// ---------------------------------------------------------------------------

describe('Flag off (GITHUB_INTEGRATION_ENABLED=false) → GITHUB_DISABLED', () => {
  beforeEach(() => {
    configDisabled();
  });

  test('serginhoListRepos retorna success:false com code GITHUB_DISABLED', async () => {
    const result = await serginhoListRepos();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_DISABLED');
    expect(result.error.message).toBeTruthy();
    expect(result.data).toBeUndefined();
  });

  test('serginhoListBranches retorna success:false com code GITHUB_DISABLED', async () => {
    const result = await serginhoListBranches({ owner: 'user', repo: 'repo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_DISABLED');
    expect(result.error.message).toBeTruthy();
  });

  test('serginhoGetFile retorna success:false com code GITHUB_DISABLED', async () => {
    const result = await serginhoGetFile({ owner: 'user', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_DISABLED');
    expect(result.error.message).toBeTruthy();
  });

  test('erro GITHUB_DISABLED inclui details com instrução de ativação', async () => {
    const result = await serginhoListRepos();
    expect(result.error.details).toContain('GITHUB_INTEGRATION_ENABLED');
  });

  test('githubService NÃO é chamado quando flag está off', async () => {
    await serginhoListRepos();
    await serginhoListBranches({ owner: 'u', repo: 'r' });
    await serginhoGetFile({ owner: 'u', repo: 'r', path: 'f' });
    expect(mockListRepos).not.toHaveBeenCalled();
    expect(mockListBranches).not.toHaveBeenCalled();
    expect(mockGetFile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2) Modo stub → retorna mock, NUNCA chama API real
// ---------------------------------------------------------------------------

describe('Modo stub → retorna mock data sem chamar fetch/service', () => {
  beforeEach(() => {
    configStub();
  });

  test('serginhoListRepos retorna success:true com repos mock e mode="stub"', async () => {
    const result = await serginhoListRepos();
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('stub');
    expect(Array.isArray(result.data.repos)).toBe(true);
    expect(result.data.repos.length).toBeGreaterThan(0);
  });

  test('serginhoListBranches retorna success:true com branches mock e mode="stub"', async () => {
    const result = await serginhoListBranches({ owner: 'usuario', repo: 'repo' });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('stub');
    expect(Array.isArray(result.data.branches)).toBe(true);
    expect(result.data.branches.length).toBeGreaterThan(0);
  });

  test('serginhoGetFile retorna success:true com file mock e mode="stub"', async () => {
    const result = await serginhoGetFile({ owner: 'usuario', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('stub');
    expect(result.data.file).toHaveProperty('name');
    expect(result.data.file).toHaveProperty('encoding');
    expect(result.data.file).toHaveProperty('content');
  });

  test('githubService NÃO é chamado no modo stub', async () => {
    await serginhoListRepos();
    await serginhoListBranches({ owner: 'u', repo: 'r' });
    await serginhoGetFile({ owner: 'u', repo: 'r', path: 'f' });
    expect(mockListRepos).not.toHaveBeenCalled();
    expect(mockListBranches).not.toHaveBeenCalled();
    expect(mockGetFile).not.toHaveBeenCalled();
  });

  test('stub repos não contém token/segredos', async () => {
    const result = await serginhoListRepos();
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
  });

  test('stub branches não contém token/segredos', async () => {
    const result = await serginhoListBranches({ owner: 'u', repo: 'r' });
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
  });

  test('stub file não contém token/segredos', async () => {
    const result = await serginhoGetFile({ owner: 'u', repo: 'r', path: 'f' });
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
  });
});

// ---------------------------------------------------------------------------
// 3) OAuth sem token → GITHUB_NO_TOKEN
// ---------------------------------------------------------------------------

describe('OAuth sem token → GITHUB_NO_TOKEN', () => {
  beforeEach(() => {
    configOAuthNoToken();
  });

  test('serginhoListRepos retorna success:false com code GITHUB_NO_TOKEN', async () => {
    const result = await serginhoListRepos();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_NO_TOKEN');
    expect(result.error.message).toBeTruthy();
  });

  test('serginhoListBranches retorna success:false com code GITHUB_NO_TOKEN', async () => {
    const result = await serginhoListBranches({ owner: 'user', repo: 'repo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_NO_TOKEN');
  });

  test('serginhoGetFile retorna success:false com code GITHUB_NO_TOKEN', async () => {
    const result = await serginhoGetFile({ owner: 'user', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_NO_TOKEN');
  });

  test('githubService NÃO é chamado quando token ausente', async () => {
    await serginhoListRepos();
    await serginhoListBranches({ owner: 'u', repo: 'r' });
    await serginhoGetFile({ owner: 'u', repo: 'r', path: 'f' });
    expect(mockListRepos).not.toHaveBeenCalled();
    expect(mockListBranches).not.toHaveBeenCalled();
    expect(mockGetFile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4) OAuth com token → chama githubService e retorna dados sanitizados
// ---------------------------------------------------------------------------

describe('OAuth com token → chama githubService, retorna dados reais', () => {
  beforeEach(() => {
    configOAuthWithToken();
  });

  test('serginhoListRepos chama listRepos e retorna success:true com mode="oauth"', async () => {
    const fakeRepos = [
      { id: 42, name: 'meu-repo', fullName: 'user/meu-repo', private: false },
    ];
    mockListRepos.mockResolvedValue(fakeRepos);

    const result = await serginhoListRepos();
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('oauth');
    expect(result.data.repos).toEqual(fakeRepos);
    expect(mockListRepos).toHaveBeenCalledTimes(1);
  });

  test('serginhoListBranches chama listBranches com owner e repo corretos', async () => {
    const fakeBranches = [{ name: 'main', sha: 'abc123', protected: true }];
    mockListBranches.mockResolvedValue(fakeBranches);

    const result = await serginhoListBranches({ owner: 'myorg', repo: 'myrepo' });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('oauth');
    expect(result.data.branches).toEqual(fakeBranches);
    expect(mockListBranches).toHaveBeenCalledWith('myorg', 'myrepo');
  });

  test('serginhoGetFile chama getFile com owner, repo, path e ref corretos', async () => {
    const fakeFile = { name: 'index.js', path: 'src/index.js', sha: 'def456', size: 100 };
    mockGetFile.mockResolvedValue(fakeFile);

    const result = await serginhoGetFile({
      owner: 'myorg',
      repo: 'myrepo',
      path: 'src/index.js',
      ref: 'main',
    });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('oauth');
    expect(result.data.file).toEqual(fakeFile);
    expect(mockGetFile).toHaveBeenCalledWith('myorg', 'myrepo', 'src/index.js', 'main');
  });

  test('serginhoGetFile sem ref chama getFile com ref=undefined', async () => {
    mockGetFile.mockResolvedValue({ name: 'README.md', path: 'README.md', sha: 'xyz' });
    await serginhoGetFile({ owner: 'org', repo: 'repo', path: 'README.md' });
    expect(mockGetFile).toHaveBeenCalledWith('org', 'repo', 'README.md', undefined);
  });

  test('resposta oauth não contém token/segredos', async () => {
    mockListRepos.mockResolvedValue([{ id: 1, name: 'repo', fullName: 'u/repo' }]);
    const result = await serginhoListRepos();
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
  });
});

// ---------------------------------------------------------------------------
// 5) Validação de parâmetros → GITHUB_VALIDATION_ERROR
// ---------------------------------------------------------------------------

describe('Validação de parâmetros → GITHUB_VALIDATION_ERROR', () => {
  beforeEach(() => {
    configOAuthWithToken();
  });

  test('serginhoListBranches sem params → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoListBranches();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('serginhoListBranches sem owner → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoListBranches({ repo: 'myrepo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('serginhoListBranches sem repo → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoListBranches({ owner: 'myorg' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('serginhoGetFile sem params → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoGetFile();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('serginhoGetFile sem owner → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoGetFile({ repo: 'myrepo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('serginhoGetFile sem repo → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoGetFile({ owner: 'myorg', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('serginhoGetFile sem path → GITHUB_VALIDATION_ERROR', async () => {
    const result = await serginhoGetFile({ owner: 'myorg', repo: 'myrepo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
  });

  test('validação ocorre ANTES de chamar getGitHubConfig para branches', async () => {
    await serginhoListBranches({ owner: 'user' }); // sem repo
    expect(mockGetGitHubConfig).not.toHaveBeenCalled();
  });

  test('validação ocorre ANTES de chamar getGitHubConfig para file', async () => {
    await serginhoGetFile({ owner: 'user', repo: 'repo' }); // sem path
    expect(mockGetGitHubConfig).not.toHaveBeenCalled();
  });

  test('erro de validação não contém token/segredos', async () => {
    const result = await serginhoListBranches({ owner: 'user' });
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
  });
});

// ---------------------------------------------------------------------------
// 6) Erros de API do GitHub → GITHUB_API_ERROR sem stacktrace/token
// ---------------------------------------------------------------------------

describe('Erros de API do GitHub → GITHUB_API_ERROR sanitizado', () => {
  beforeEach(() => {
    configOAuthWithToken();
  });

  test('GitHubClientError em listRepos → GITHUB_API_ERROR sem stacktrace', async () => {
    mockListRepos.mockRejectedValue(new GitHubClientError('GitHub API error: 500', 500, 'Internal Server Error'));

    const result = await serginhoListRepos();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
    expect(result.error.message).toBeTruthy();
    expect(result.error.message).not.toContain('at ');
    expect(result.error).not.toHaveProperty('stack');
  });

  test('GitHubClientError em listBranches → GITHUB_API_ERROR', async () => {
    mockListBranches.mockRejectedValue(new GitHubClientError('GitHub API error: 404', 404, 'Not Found'));

    const result = await serginhoListBranches({ owner: 'user', repo: 'repo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
  });

  test('GitHubClientError em getFile → GITHUB_API_ERROR', async () => {
    mockGetFile.mockRejectedValue(new GitHubClientError('GitHub API error: 404', 404, 'Not Found'));

    const result = await serginhoGetFile({ owner: 'user', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
  });

  test('erro genérico (não GitHubClientError) → GITHUB_API_ERROR sem stacktrace', async () => {
    mockListRepos.mockRejectedValue(new Error('Erro interno inesperado'));

    const result = await serginhoListRepos();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
    expect(result.error).not.toHaveProperty('stack');
  });

  test('reason com token é sanitizado no details', async () => {
    mockListRepos.mockRejectedValue(
      new GitHubClientError('Erro', 500, 'Token ghp_abc123XYZ invalido'),
    );

    const result = await serginhoListRepos();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
    if (result.error.details) {
      expect(result.error.details).not.toContain('ghp_abc123XYZ');
    }
  });

  test('erro de API não vaza token na resposta', async () => {
    mockListRepos.mockRejectedValue(
      new GitHubClientError('Unauthorized', 401, 'ghp_super_secret token invalido'),
    );

    const result = await serginhoListRepos();
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toContain('ghp_super_secret');
  });

  test('formato de retorno em erro segue { success: false, error: { code, message } }', async () => {
    mockListRepos.mockRejectedValue(new GitHubClientError('Erro', 500, 'Unknown'));

    const result = await serginhoListRepos();
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('code');
    expect(result.error).toHaveProperty('message');
  });
});

// ---------------------------------------------------------------------------
// 7) Formato de resposta padronizado
// ---------------------------------------------------------------------------

describe('Formato de resposta padronizado', () => {
  test('sucesso sempre retorna { success: true, data: ... }', async () => {
    configStub();
    const result = await serginhoListRepos();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
    expect(result.error).toBeUndefined();
  });

  test('erro sempre retorna { success: false, error: { code, message } }', async () => {
    configDisabled();
    const result = await serginhoListRepos();
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('code');
    expect(result.error).toHaveProperty('message');
    expect(result.data).toBeUndefined();
  });

  test('sucesso nunca inclui campo "error"', async () => {
    configStub();
    const r1 = await serginhoListRepos();
    const r2 = await serginhoListBranches({ owner: 'u', repo: 'r' });
    const r3 = await serginhoGetFile({ owner: 'u', repo: 'r', path: 'f' });
    expect(r1.error).toBeUndefined();
    expect(r2.error).toBeUndefined();
    expect(r3.error).toBeUndefined();
  });

  test('erro nunca inclui campo "data"', async () => {
    configDisabled();
    const r1 = await serginhoListRepos();
    const r2 = await serginhoListBranches({ owner: 'u', repo: 'r' });
    const r3 = await serginhoGetFile({ owner: 'u', repo: 'r', path: 'f' });
    expect(r1.data).toBeUndefined();
    expect(r2.data).toBeUndefined();
    expect(r3.data).toBeUndefined();
  });
});
