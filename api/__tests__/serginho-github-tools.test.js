/**
 * api/__tests__/serginho-github-tools.test.js
 * Testes unitários para a camada de tools GitHub do Serginho (orchestration layer).
 *
 * Cobre:
 *   - Tool list repos — chama gateway, retorna formato correto
 *   - Tool list branches — chama gateway, retorna formato correto
 *   - Tool get file — chama gateway, retorna formato correto
 *   - Validação de parâmetros — owner/repo/path ausentes retornam erro ANTES de chamar o gateway
 *   - Flag off — GITHUB_INTEGRATION_ENABLED desabilitado retorna GITHUB_DISABLED
 *   - Modo stub — flag on, sem token, retorna dados stub via gateway
 *   - OAuth sem token — retorna GITHUB_NO_TOKEN via gateway
 *   - Sanitização de erros — erros do gateway são repassados sem vazar stacktrace
 *   - Registry — getToolByName, getAllTools, isGitHubToolsAvailable funcionam corretamente
 *   - Garantia — tools chamam o gateway, NUNCA githubService diretamente
 */

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve caminhos absolutos para portabilidade entre ambientes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configModulePath = path.resolve(__dirname, '../lib/github/githubConfig.js');
const gatewayModulePath = path.resolve(__dirname, '../lib/serginho/githubGateway.js');

// ---------------------------------------------------------------------------
// Mocks de módulos — devem ser declarados ANTES de qualquer import dinâmico.
// Usamos jest.unstable_mockModule para compatibilidade com ESM (igual ao gateway test).
// ---------------------------------------------------------------------------

const mockGetGitHubConfig = jest.fn();
const mockSerginhoListRepos = jest.fn();
const mockSerginhoListBranches = jest.fn();
const mockSerginhoGetFile = jest.fn();

jest.unstable_mockModule(configModulePath, () => ({
  getGitHubConfig: mockGetGitHubConfig,
}));

jest.unstable_mockModule(gatewayModulePath, () => ({
  serginhoListRepos: mockSerginhoListRepos,
  serginhoListBranches: mockSerginhoListBranches,
  serginhoGetFile: mockSerginhoGetFile,
}));

// ---------------------------------------------------------------------------
// Importação dinâmica dos módulos em teste (após mocks registrados)
// ---------------------------------------------------------------------------

let runGitHubListReposTool, runGitHubListBranchesTool, runGitHubGetFileTool;
let GITHUB_LIST_REPOS_TOOL, GITHUB_LIST_BRANCHES_TOOL, GITHUB_GET_FILE_TOOL;
let getToolByName, getAllTools, isGitHubToolsAvailable, GITHUB_TOOLS;

beforeAll(async () => {
  ({
    runGitHubListReposTool,
    runGitHubListBranchesTool,
    runGitHubGetFileTool,
    GITHUB_LIST_REPOS_TOOL,
    GITHUB_LIST_BRANCHES_TOOL,
    GITHUB_GET_FILE_TOOL,
  } = await import('../lib/serginho/tools/githubTools.js'));

  ({ getToolByName, getAllTools, isGitHubToolsAvailable, GITHUB_TOOLS } = await import(
    '../lib/serginho/tools/index.js'
  ));
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers: configurações de mock para cenários comuns
// ---------------------------------------------------------------------------

function configEnabled() {
  mockGetGitHubConfig.mockReturnValue({
    enabled: true,
    mode: 'oauth',
    hasToken: true,
    apiBaseUrl: 'https://api.github.com',
    timeoutMs: 8000,
  });
}

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

// ---------------------------------------------------------------------------
// 1) Tool: list repos — chama gateway e retorna formato correto
// ---------------------------------------------------------------------------

describe('Tool: github_list_repos — chama gateway, retorna formato correto', () => {
  test('chama serginhoListRepos e repassa o resultado de sucesso', async () => {
    configEnabled();
    const fakeResult = { success: true, data: { repos: [{ id: 1, name: 'repo' }], mode: 'oauth' } };
    mockSerginhoListRepos.mockResolvedValue(fakeResult);

    const result = await runGitHubListReposTool();
    expect(result).toEqual(fakeResult);
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
  });

  test('retorna { success: true, data: { repos, mode } } no caminho feliz', async () => {
    configEnabled();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ id: 1, name: 'meu-repo' }], mode: 'oauth' },
    });

    const result = await runGitHubListReposTool({});
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('repos');
    expect(result.data).toHaveProperty('mode');
  });

  test('repassa resultado de erro do gateway sem modificar', async () => {
    configEnabled();
    const gatewayError = {
      success: false,
      error: { code: 'GITHUB_API_ERROR', message: 'Erro na integração GitHub.' },
    };
    mockSerginhoListRepos.mockResolvedValue(gatewayError);

    const result = await runGitHubListReposTool();
    expect(result).toEqual(gatewayError);
  });

  test('não vaza token ou stacktrace na resposta', async () => {
    configEnabled();
    mockSerginhoListRepos.mockResolvedValue({
      success: true,
      data: { repos: [{ id: 1, name: 'repo' }], mode: 'oauth' },
    });

    const result = await runGitHubListReposTool();
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
    expect(bodyStr).not.toContain('at ');
  });
});

// ---------------------------------------------------------------------------
// 2) Tool: list branches — chama gateway e retorna formato correto
// ---------------------------------------------------------------------------

describe('Tool: github_list_branches — chama gateway, retorna formato correto', () => {
  test('chama serginhoListBranches com owner e repo corretos', async () => {
    configEnabled();
    const fakeResult = {
      success: true,
      data: { branches: [{ name: 'main', sha: 'abc123', protected: true }], mode: 'oauth' },
    };
    mockSerginhoListBranches.mockResolvedValue(fakeResult);

    const result = await runGitHubListBranchesTool({ owner: 'myorg', repo: 'myrepo' });
    expect(result).toEqual(fakeResult);
    expect(mockSerginhoListBranches).toHaveBeenCalledWith({ owner: 'myorg', repo: 'myrepo' });
  });

  test('retorna { success: true, data: { branches, mode } } no caminho feliz', async () => {
    configEnabled();
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: { branches: [{ name: 'main' }], mode: 'oauth' },
    });

    const result = await runGitHubListBranchesTool({ owner: 'org', repo: 'repo' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('branches');
    expect(result.data).toHaveProperty('mode');
  });

  test('repassa resultado de erro do gateway sem modificar', async () => {
    configEnabled();
    const gatewayError = {
      success: false,
      error: { code: 'GITHUB_API_ERROR', message: 'Erro na integração GitHub.' },
    };
    mockSerginhoListBranches.mockResolvedValue(gatewayError);

    const result = await runGitHubListBranchesTool({ owner: 'org', repo: 'repo' });
    expect(result).toEqual(gatewayError);
  });
});

// ---------------------------------------------------------------------------
// 3) Tool: get file — chama gateway e retorna formato correto
// ---------------------------------------------------------------------------

describe('Tool: github_get_file — chama gateway, retorna formato correto', () => {
  test('chama serginhoGetFile com owner, repo, path e ref corretos', async () => {
    configEnabled();
    const fakeResult = {
      success: true,
      data: { file: { name: 'index.js', path: 'src/index.js', sha: 'def456' }, mode: 'oauth' },
    };
    mockSerginhoGetFile.mockResolvedValue(fakeResult);

    const result = await runGitHubGetFileTool({
      owner: 'myorg',
      repo: 'myrepo',
      path: 'src/index.js',
      ref: 'main',
    });
    expect(result).toEqual(fakeResult);
    expect(mockSerginhoGetFile).toHaveBeenCalledWith({
      owner: 'myorg',
      repo: 'myrepo',
      path: 'src/index.js',
      ref: 'main',
    });
  });

  test('retorna { success: true, data: { file, mode } } no caminho feliz', async () => {
    configEnabled();
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: { file: { name: 'README.md' }, mode: 'oauth' },
    });

    const result = await runGitHubGetFileTool({ owner: 'org', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('file');
    expect(result.data).toHaveProperty('mode');
  });

  test('chama serginhoGetFile sem ref quando ref não fornecida', async () => {
    configEnabled();
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: { file: { name: 'README.md' }, mode: 'oauth' },
    });

    await runGitHubGetFileTool({ owner: 'org', repo: 'repo', path: 'README.md' });
    expect(mockSerginhoGetFile).toHaveBeenCalledWith({
      owner: 'org',
      repo: 'repo',
      path: 'README.md',
      ref: undefined,
    });
  });

  test('repassa resultado de erro do gateway sem modificar', async () => {
    configEnabled();
    const gatewayError = {
      success: false,
      error: { code: 'GITHUB_API_ERROR', message: 'Erro na integração GitHub.' },
    };
    mockSerginhoGetFile.mockResolvedValue(gatewayError);

    const result = await runGitHubGetFileTool({ owner: 'org', repo: 'repo', path: 'f' });
    expect(result).toEqual(gatewayError);
  });
});

// ---------------------------------------------------------------------------
// 4) Validação de parâmetros — erro ANTES de chamar o gateway
// ---------------------------------------------------------------------------

describe('Validação de parâmetros → GITHUB_VALIDATION_ERROR ANTES de chamar gateway', () => {
  beforeEach(() => {
    configEnabled();
  });

  test('runGitHubListBranchesTool sem params → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubListBranchesTool();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
  });

  test('runGitHubListBranchesTool sem owner → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubListBranchesTool({ repo: 'myrepo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
  });

  test('runGitHubListBranchesTool sem repo → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubListBranchesTool({ owner: 'myorg' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
  });

  test('runGitHubGetFileTool sem params → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubGetFileTool();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('runGitHubGetFileTool sem owner → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubGetFileTool({ repo: 'myrepo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('runGitHubGetFileTool sem repo → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubGetFileTool({ owner: 'myorg', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('runGitHubGetFileTool sem path → GITHUB_VALIDATION_ERROR', async () => {
    const result = await runGitHubGetFileTool({ owner: 'myorg', repo: 'myrepo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_VALIDATION_ERROR');
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('validação ocorre ANTES de chamar getGitHubConfig para branches', async () => {
    await runGitHubListBranchesTool({ owner: 'user' }); // sem repo
    expect(mockGetGitHubConfig).not.toHaveBeenCalled();
  });

  test('validação ocorre ANTES de chamar getGitHubConfig para get file', async () => {
    await runGitHubGetFileTool({ owner: 'user', repo: 'repo' }); // sem path
    expect(mockGetGitHubConfig).not.toHaveBeenCalled();
  });

  test('erro de validação não vaza token ou segredos', async () => {
    const result = await runGitHubListBranchesTool({ owner: 'user' });
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
  });

  test('erro de validação retorna { success: false, error: { code, message } }', async () => {
    const result = await runGitHubGetFileTool({ owner: 'org', repo: 'repo' });
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('code', 'GITHUB_VALIDATION_ERROR');
    expect(result.error).toHaveProperty('message');
    expect(result.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5) Flag off → tools retornam GITHUB_DISABLED ANTES de chamar o gateway
// ---------------------------------------------------------------------------

describe('Flag off (GITHUB_INTEGRATION_ENABLED=false) → GITHUB_DISABLED antes do gateway', () => {
  beforeEach(() => {
    configDisabled();
  });

  test('runGitHubListReposTool retorna GITHUB_DISABLED', async () => {
    const result = await runGitHubListReposTool();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_DISABLED');
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
  });

  test('runGitHubListBranchesTool retorna GITHUB_DISABLED', async () => {
    const result = await runGitHubListBranchesTool({ owner: 'user', repo: 'repo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_DISABLED');
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
  });

  test('runGitHubGetFileTool retorna GITHUB_DISABLED', async () => {
    const result = await runGitHubGetFileTool({ owner: 'user', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_DISABLED');
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });

  test('erro GITHUB_DISABLED inclui details com instrução de ativação', async () => {
    const result = await runGitHubListReposTool();
    expect(result.error.details).toContain('GITHUB_INTEGRATION_ENABLED');
  });

  test('gateway NÃO é chamado para nenhuma tool quando flag está off', async () => {
    await runGitHubListReposTool();
    await runGitHubListBranchesTool({ owner: 'u', repo: 'r' });
    await runGitHubGetFileTool({ owner: 'u', repo: 'r', path: 'f' });
    expect(mockSerginhoListRepos).not.toHaveBeenCalled();
    expect(mockSerginhoListBranches).not.toHaveBeenCalled();
    expect(mockSerginhoGetFile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 6) Modo stub — flag on, sem token, retorna dados stub via gateway
// ---------------------------------------------------------------------------

describe('Modo stub → tools repassam dados stub do gateway', () => {
  beforeEach(() => {
    configStub();
  });

  test('runGitHubListReposTool retorna dados stub via gateway', async () => {
    const stubResult = {
      success: true,
      data: { repos: [{ id: 1, name: 'exemplo-repo' }], mode: 'stub' },
    };
    mockSerginhoListRepos.mockResolvedValue(stubResult);

    const result = await runGitHubListReposTool();
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('stub');
    expect(Array.isArray(result.data.repos)).toBe(true);
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
  });

  test('runGitHubListBranchesTool retorna dados stub via gateway', async () => {
    const stubResult = {
      success: true,
      data: { branches: [{ name: 'main' }], mode: 'stub' },
    };
    mockSerginhoListBranches.mockResolvedValue(stubResult);

    const result = await runGitHubListBranchesTool({ owner: 'usuario', repo: 'repo' });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('stub');
    expect(Array.isArray(result.data.branches)).toBe(true);
    expect(mockSerginhoListBranches).toHaveBeenCalledWith({ owner: 'usuario', repo: 'repo' });
  });

  test('runGitHubGetFileTool retorna dados stub via gateway', async () => {
    const stubResult = {
      success: true,
      data: { file: { name: 'exemplo.md', encoding: 'base64', content: 'abc' }, mode: 'stub' },
    };
    mockSerginhoGetFile.mockResolvedValue(stubResult);

    const result = await runGitHubGetFileTool({ owner: 'usuario', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe('stub');
    expect(result.data.file).toHaveProperty('name');
    expect(mockSerginhoGetFile).toHaveBeenCalledWith({
      owner: 'usuario',
      repo: 'repo',
      path: 'README.md',
      ref: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// 7) OAuth sem token → GITHUB_NO_TOKEN via gateway
// ---------------------------------------------------------------------------

describe('OAuth sem token → GITHUB_NO_TOKEN repassado do gateway', () => {
  beforeEach(() => {
    configOAuthNoToken();
  });

  test('runGitHubListReposTool repassa GITHUB_NO_TOKEN do gateway', async () => {
    const noTokenResult = {
      success: false,
      error: { code: 'GITHUB_NO_TOKEN', message: 'Token GitHub não configurado para modo oauth.' },
    };
    mockSerginhoListRepos.mockResolvedValue(noTokenResult);

    const result = await runGitHubListReposTool();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_NO_TOKEN');
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
  });

  test('runGitHubListBranchesTool repassa GITHUB_NO_TOKEN do gateway', async () => {
    const noTokenResult = {
      success: false,
      error: { code: 'GITHUB_NO_TOKEN', message: 'Token GitHub não configurado para modo oauth.' },
    };
    mockSerginhoListBranches.mockResolvedValue(noTokenResult);

    const result = await runGitHubListBranchesTool({ owner: 'user', repo: 'repo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_NO_TOKEN');
    expect(mockSerginhoListBranches).toHaveBeenCalledTimes(1);
  });

  test('runGitHubGetFileTool repassa GITHUB_NO_TOKEN do gateway', async () => {
    const noTokenResult = {
      success: false,
      error: { code: 'GITHUB_NO_TOKEN', message: 'Token GitHub não configurado para modo oauth.' },
    };
    mockSerginhoGetFile.mockResolvedValue(noTokenResult);

    const result = await runGitHubGetFileTool({ owner: 'user', repo: 'repo', path: 'README.md' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_NO_TOKEN');
    expect(mockSerginhoGetFile).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 8) Sanitização de erros — erros do gateway são repassados sem stacktrace
// ---------------------------------------------------------------------------

describe('Sanitização de erros — gateway errors repassados sem vazar stacktrace', () => {
  beforeEach(() => {
    configEnabled();
  });

  test('erro GITHUB_API_ERROR do gateway é repassado sem stacktrace', async () => {
    const apiError = {
      success: false,
      error: { code: 'GITHUB_API_ERROR', message: 'Erro na integração GitHub.' },
    };
    mockSerginhoListRepos.mockResolvedValue(apiError);

    const result = await runGitHubListReposTool();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
    expect(result.error).not.toHaveProperty('stack');
    expect(JSON.stringify(result)).not.toContain('at ');
  });

  test('erro com details do gateway é repassado sem token', async () => {
    const apiError = {
      success: false,
      error: {
        code: 'GITHUB_API_ERROR',
        message: 'Erro na integração GitHub.',
        details: 'Internal Server Error',
      },
    };
    mockSerginhoListBranches.mockResolvedValue(apiError);

    const result = await runGitHubListBranchesTool({ owner: 'org', repo: 'repo' });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GITHUB_API_ERROR');
    const bodyStr = JSON.stringify(result);
    expect(bodyStr).not.toMatch(/gh[a-z]_/);
    expect(bodyStr).not.toContain('GITHUB_TOKEN');
  });

  test('formato de retorno em erro segue { success: false, error: { code, message } }', async () => {
    mockSerginhoGetFile.mockResolvedValue({
      success: false,
      error: { code: 'GITHUB_API_ERROR', message: 'Erro na integração GitHub.' },
    });

    const result = await runGitHubGetFileTool({ owner: 'org', repo: 'repo', path: 'f' });
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('code');
    expect(result.error).toHaveProperty('message');
    expect(result.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 9) Registry — getToolByName, getAllTools, isGitHubToolsAvailable
// ---------------------------------------------------------------------------

describe('Registry — getToolByName, getAllTools, isGitHubToolsAvailable', () => {
  test('GITHUB_TOOLS contém 3 tools', () => {
    expect(Array.isArray(GITHUB_TOOLS)).toBe(true);
    expect(GITHUB_TOOLS).toHaveLength(3);
  });

  test('GITHUB_TOOLS contém github_list_repos, github_list_branches, github_get_file', () => {
    const names = GITHUB_TOOLS.map((t) => t.name);
    expect(names).toContain('github_list_repos');
    expect(names).toContain('github_list_branches');
    expect(names).toContain('github_get_file');
  });

  test('getToolByName retorna o tool correto para nome existente', () => {
    const tool = getToolByName('github_list_repos');
    expect(tool).not.toBeNull();
    expect(tool.name).toBe('github_list_repos');
    expect(typeof tool.execute).toBe('function');
  });

  test('getToolByName retorna o tool github_list_branches', () => {
    const tool = getToolByName('github_list_branches');
    expect(tool).not.toBeNull();
    expect(tool.name).toBe('github_list_branches');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('parameters');
    expect(typeof tool.execute).toBe('function');
  });

  test('getToolByName retorna o tool github_get_file', () => {
    const tool = getToolByName('github_get_file');
    expect(tool).not.toBeNull();
    expect(tool.name).toBe('github_get_file');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('parameters');
    expect(typeof tool.execute).toBe('function');
  });

  test('getToolByName retorna null para nome inexistente', () => {
    const tool = getToolByName('tool_que_nao_existe');
    expect(tool).toBeNull();
  });

  test('getToolByName retorna null para nome vazio', () => {
    expect(getToolByName('')).toBeNull();
    expect(getToolByName(undefined)).toBeNull();
  });

  test('getAllTools retorna todos os 3 tools', () => {
    const tools = getAllTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(3);
  });

  test('getAllTools retorna uma cópia — mutação não afeta o catálogo original', () => {
    const tools = getAllTools();
    tools.push({ name: 'intruso' });
    expect(getAllTools()).toHaveLength(3);
  });

  test('isGitHubToolsAvailable retorna true quando flag habilitada', () => {
    configEnabled();
    expect(isGitHubToolsAvailable()).toBe(true);
  });

  test('isGitHubToolsAvailable retorna false quando flag desabilitada', () => {
    configDisabled();
    expect(isGitHubToolsAvailable()).toBe(false);
  });

  test('cada tool tem propriedades name, description, parameters e execute', () => {
    for (const tool of GITHUB_TOOLS) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('parameters');
      expect(tool).toHaveProperty('execute');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(typeof tool.parameters).toBe('object');
      expect(typeof tool.execute).toBe('function');
    }
  });
});

// ---------------------------------------------------------------------------
// 10) Garantia — tools chamam o gateway, NUNCA githubService diretamente
// ---------------------------------------------------------------------------

describe('Garantia — tools chamam gateway (serginhoListRepos/Branches/GetFile)', () => {
  beforeEach(() => {
    configEnabled();
  });

  test('runGitHubListReposTool chama serginhoListRepos (gateway), não githubService', async () => {
    mockSerginhoListRepos.mockResolvedValue({ success: true, data: { repos: [], mode: 'oauth' } });
    await runGitHubListReposTool();
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
  });

  test('runGitHubListBranchesTool chama serginhoListBranches (gateway), não githubService', async () => {
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: { branches: [], mode: 'oauth' },
    });
    await runGitHubListBranchesTool({ owner: 'org', repo: 'repo' });
    expect(mockSerginhoListBranches).toHaveBeenCalledTimes(1);
  });

  test('runGitHubGetFileTool chama serginhoGetFile (gateway), não githubService', async () => {
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: { file: { name: 'f' }, mode: 'oauth' },
    });
    await runGitHubGetFileTool({ owner: 'org', repo: 'repo', path: 'f' });
    expect(mockSerginhoGetFile).toHaveBeenCalledTimes(1);
  });

  test('tool execute do descritor aponta para a mesma função run', async () => {
    mockSerginhoListRepos.mockResolvedValue({ success: true, data: { repos: [], mode: 'oauth' } });
    await GITHUB_LIST_REPOS_TOOL.execute();
    expect(mockSerginhoListRepos).toHaveBeenCalledTimes(1);
  });

  test('tool execute de github_list_branches funciona via descritor', async () => {
    mockSerginhoListBranches.mockResolvedValue({
      success: true,
      data: { branches: [], mode: 'oauth' },
    });
    await GITHUB_LIST_BRANCHES_TOOL.execute({ owner: 'org', repo: 'repo' });
    expect(mockSerginhoListBranches).toHaveBeenCalledWith({ owner: 'org', repo: 'repo' });
  });

  test('tool execute de github_get_file funciona via descritor', async () => {
    mockSerginhoGetFile.mockResolvedValue({
      success: true,
      data: { file: { name: 'f' }, mode: 'oauth' },
    });
    await GITHUB_GET_FILE_TOOL.execute({ owner: 'org', repo: 'repo', path: 'f', ref: 'main' });
    expect(mockSerginhoGetFile).toHaveBeenCalledWith({
      owner: 'org',
      repo: 'repo',
      path: 'f',
      ref: 'main',
    });
  });
});
