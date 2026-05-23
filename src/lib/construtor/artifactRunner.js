/**
 * Executor de artefatos do Construtor/Híbrido — Fase 2C
 *
 * Responsabilidade: executar de forma controlada, isolada e opcional o
 * conteúdo executável de um artefato já empacotado (Fase 2A) e validado
 * (Fase 2B), retornando um resultado estruturado com stdout/stderr/exitCode.
 *
 * Estratégia técnica:
 * - child_process.execFile (Node 22 built-in) — mais seguro que exec, sem
 *   shell intermediário, com timeout nativo e sem dependência externa.
 * - adm-zip (puro JS) — extração do zipBuffer em diretório temporário.
 * - Ambiente limpo — env sem variáveis de rede/API/tokens.
 * - Allowlist de comandos — somente ['node'] é permitido.
 * - Timeout rígido de 5 000 ms por padrão.
 * - maxBuffer de 1 MB para stdout+stderr.
 *
 * Este módulo NÃO altera Serginho, Especialistas, ABNT, nem qualquer
 * arquivo das Fases 2A ou 2B existentes.
 */

import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import AdmZip from 'adm-zip';

import { validateArtifact } from './artifactValidator.js';

const execFileAsync = promisify(execFile);

// ── Constantes ────────────────────────────────────────────────────────────────

/** Timeout padrão em milissegundos. */
const DEFAULT_TIMEOUT_MS = 5_000;

/** Buffer máximo para stdout + stderr (1 MB). */
const MAX_BUFFER_BYTES = 1024 * 1024;

/** Comandos permitidos na allowlist. */
const ALLOWED_COMMANDS = ['node'];

/** Extensões de arquivo consideradas executáveis e seus runtimes. */
const EXECUTABLE_EXTENSIONS = {
  '.js': 'node',
};

/** Extensões explicitamente não executáveis. */
const NON_EXECUTABLE_EXTENSIONS = new Set(['.md', '.txt', '.json']);

// ── Ambiente limpo ────────────────────────────────────────────────────────────

/**
 * Retorna um env mínimo para o subprocess — sem variáveis de rede, API ou
 * tokens sensíveis. Inclui apenas as variáveis estritamente necessárias para
 * o Node.js funcionar (PATH, HOME, TMPDIR).
 * @returns {Record<string, string>}
 */
function buildCleanEnv() {
  return {
    PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    HOME: process.env.HOME || '/tmp',
    TMPDIR: process.env.TMPDIR || '/tmp',
    NODE_ENV: process.env.NODE_ENV || 'production',
  };
}

// ── Detecção de executabilidade ───────────────────────────────────────────────

/**
 * Inspeciona o manifest e o zipBuffer para determinar qual arquivo executar.
 *
 * @param {object} manifest - manifest do artefato (Fase 2A)
 * @param {Buffer} zipBuffer - buffer ZIP do artefato
 * @returns {{ executable: boolean, entryPath: string|null, runtime: string|null, reason: string|null }}
 */
function detectExecutable(manifest, zipBuffer) {
  // Tentar extrair a lista de arquivos do ZIP para inspeção
  let entries;
  try {
    const zip = new AdmZip(zipBuffer);
    entries = zip.getEntries().map((e) => e.entryName);
  } catch {
    return { executable: false, entryPath: null, runtime: null, reason: 'zip-read-error' };
  }

  // Suportar tanto nova estrutura (raiz) quanto legada (content/)
  const contentEntries = entries.filter(
    (e) => !e.endsWith('/') && (e.startsWith('content/') || !e.includes('/')),
  );

  for (const entry of contentEntries) {
    const ext = extOf(entry);
    if (EXECUTABLE_EXTENSIONS[ext]) {
      return {
        executable: true,
        entryPath: entry,
        runtime: EXECUTABLE_EXTENSIONS[ext],
        reason: null,
      };
    }
  }

  // Verificar se todos os arquivos de conteúdo são explicitamente não executáveis
  const allNonExecutable = contentEntries.every((e) => NON_EXECUTABLE_EXTENSIONS.has(extOf(e)));
  if (allNonExecutable || contentEntries.length === 0) {
    return { executable: false, entryPath: null, runtime: null, reason: 'not-executable' };
  }

  // Extensão desconhecida — não executar
  return { executable: false, entryPath: null, runtime: null, reason: 'not-executable' };
}

/**
 * Extrai a extensão (em minúsculas) de um caminho de arquivo.
 * @param {string} filePath
 * @returns {string}
 */
function extOf(filePath) {
  const dot = filePath.lastIndexOf('.');
  return dot !== -1 ? filePath.slice(dot).toLowerCase() : '';
}

// ── Validação defensiva de entries ZIP ───────────────────────────────────────

/**
 * Valida todas as entries de um ZIP antes de qualquer extração.
 * Rejeita entries com path traversal, caminhos absolutos ou byte nulo.
 * Garante que todos os caminhos resolvidos permanecem dentro de `destDir`.
 *
 * Exportada para testes diretos de segurança.
 *
 * @param {AdmZip} zip - instância de AdmZip já carregada
 * @param {string} destDir - diretório de destino absoluto
 * @returns {{ safe: boolean, reason: string | null }}
 */
export function validateZipEntries(zip, destDir) {
  const entries = zip.getEntries();
  for (const entry of entries) {
    const entryName = entry.entryName;

    // Rejeitar byte nulo
    if (entryName.includes('\0')) {
      return { safe: false, reason: `entry ZIP contém byte nulo: "${entryName}"` };
    }

    // Rejeitar caminho absoluto Unix
    if (entryName.startsWith('/')) {
      return { safe: false, reason: `entry ZIP com caminho absoluto Unix: "${entryName}"` };
    }

    // Rejeitar caminho UNC Windows — verificar antes do check de \ simples
    if (entryName.startsWith('\\\\') || entryName.startsWith('//')) {
      return { safe: false, reason: `entry ZIP com caminho UNC: "${entryName}"` };
    }

    // Rejeitar caminho absoluto Windows com backslash simples (ex.: \tmp\evil.js)
    if (entryName.startsWith('\\')) {
      return { safe: false, reason: `entry ZIP com caminho absoluto Windows (backslash): "${entryName}"` };
    }

    // Rejeitar drive letter Windows
    if (/^[a-zA-Z]:[/\\]/.test(entryName)) {
      return { safe: false, reason: `entry ZIP com drive letter Windows: "${entryName}"` };
    }

    // Normalizar separadores e verificar segmentos de traversal
    const normalized = entryName.replace(/\\/g, '/');
    const segments = normalized.split('/');
    for (const seg of segments) {
      if (seg === '..') {
        return { safe: false, reason: `entry ZIP contém traversal "..": "${entryName}"` };
      }
    }

    // Verificar que o caminho resolvido permanece dentro de destDir
    const resolved = resolve(destDir, normalized);
    const normalizedDestDir = resolve(destDir);
    if (!resolved.startsWith(normalizedDestDir + sep) && resolved !== normalizedDestDir) {
      return { safe: false, reason: `entry ZIP sairia do diretório de destino: "${entryName}"` };
    }
  }

  return { safe: true, reason: null };
}



/**
 * Extrai o zipBuffer em um diretório temporário isolado.
 * Valida todas as entries do ZIP antes de extrair (defesa em profundidade).
 *
 * @param {Buffer} zipBuffer
 * @returns {Promise<{ tmpDir: string, cleanup: () => Promise<void> }>}
 */
async function extractToTempDir(zipBuffer) {
  const tmpDir = await mkdtemp(join(tmpdir(), 'artifact-runner-'));

  const zip = new AdmZip(zipBuffer);

  // Barreira 2: validar entries antes de qualquer extração
  const check = validateZipEntries(zip, tmpDir);
  if (!check.safe) {
    await rm(tmpDir, { recursive: true, force: true });
    throw new Error(`extractToTempDir: entry ZIP insegura — ${check.reason}`);
  }

  zip.extractAllTo(tmpDir, /* overwrite */ true);

  const cleanup = () => rm(tmpDir, { recursive: true, force: true });
  return { tmpDir, cleanup };
}

// ── Execução controlada ───────────────────────────────────────────────────────

/**
 * Executa o artefato de forma controlada usando child_process.execFile.
 *
 * @param {object} artifact - objeto retornado por packageArtifact() (Fase 2A)
 * @param {object} [options]
 * @param {number} [options.timeout=5000] - timeout em ms
 * @param {string} [options.command] - comando customizado (deve estar na allowlist)
 * @param {string[]} [options.args] - argumentos adicionais
 * @param {string} [options.cwd] - diretório de trabalho (sobrescreve o padrão)
 *
 * @returns {Promise<{
 *   executed: boolean,
 *   success: boolean,
 *   command: string|null,
 *   durationMs: number,
 *   stdout: string,
 *   stderr: string,
 *   timedOut: boolean,
 *   exitCode: number|null,
 *   reason?: string,
 *   errors?: string[]
 * }>}
 */
export async function executeArtifact(artifact, options = {}) {
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;

  // ── Pré-validação (integração com Fase 2B) ─────────────────────────────────
  const validation = validateArtifact(artifact);
  if (!validation.valid) {
    return {
      executed: false,
      success: false,
      command: null,
      durationMs: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
      exitCode: null,
      reason: 'validation-failed',
      errors: validation.errors,
    };
  }

  const { manifest, zipBuffer } = artifact;

  // ── Detecção de executabilidade ────────────────────────────────────────────
  const detection = detectExecutable(manifest, zipBuffer);

  if (!detection.executable) {
    return {
      executed: false,
      success: true,
      command: null,
      durationMs: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
      exitCode: null,
      reason: detection.reason ?? 'not-executable',
    };
  }

  // ── Validar comando na allowlist ───────────────────────────────────────────
  const runtime = options.command ?? detection.runtime;
  if (!ALLOWED_COMMANDS.includes(runtime)) {
    return {
      executed: false,
      success: false,
      command: null,
      durationMs: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
      exitCode: null,
      reason: 'command-not-allowed',
      errors: [`command "${runtime}" is not in the allowed list: ${ALLOWED_COMMANDS.join(', ')}`],
    };
  }

  // ── Extração e execução ────────────────────────────────────────────────────
  let tmpDir, cleanup;
  try {
    ({ tmpDir, cleanup } = await extractToTempDir(zipBuffer));
  } catch (extractErr) {
    return {
      executed: false,
      success: false,
      command: null,
      durationMs: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
      exitCode: null,
      reason: 'unsafe-zip-entry',
      errors: [extractErr.message],
    };
  }

  try {
    const scriptPath = join(tmpDir, detection.entryPath);
    const extraArgs = options.args ?? [];
    const args = [scriptPath, ...extraArgs];
    const commandStr = `${runtime} ${detection.entryPath}`;
    const cwd = options.cwd ?? tmpDir;

    const start = Date.now();
    let timedOut = false;

    try {
      const { stdout, stderr } = await execFileAsync(runtime, args, {
        timeout: timeoutMs,
        maxBuffer: MAX_BUFFER_BYTES,
        cwd,
        env: buildCleanEnv(),
        killSignal: 'SIGKILL',
      });

      const durationMs = Date.now() - start;

      return {
        executed: true,
        success: true,
        command: commandStr,
        durationMs,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        timedOut: false,
        exitCode: 0,
      };
    } catch (err) {
      const durationMs = Date.now() - start;

      // execFile sinaliza timeout via err.killed e err.signal === 'SIGKILL',
      // ou via err.code === 'ETIMEDOUT' dependendo da versão do Node.
      timedOut = err.killed === true || err.code === 'ETIMEDOUT';

      return {
        executed: true,
        success: false,
        command: commandStr,
        durationMs,
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? '',
        timedOut,
        exitCode: timedOut ? null : (typeof err.code === 'number' ? err.code : null),
      };
    }
  } finally {
    await cleanup();
  }
}
