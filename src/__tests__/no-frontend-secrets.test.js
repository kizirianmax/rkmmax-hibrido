/**
 * TESTE PREVENTIVO: segredos privados não devem ser referenciados no frontend.
 *
 * Falha se qualquer arquivo em src/ referenciar variáveis VITE_* que são
 * segredos privados de backend. Variáveis públicas legítimas (VITE_SUPABASE_URL,
 * VITE_SUPABASE_ANON_KEY, VITE_GITHUB_CLIENT_ID, VITE_GITHUB_REDIRECT_URI)
 * são permitidas.
 *
 * Contexto: fix(security): remove frontend secret initialization risk
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "..");

/**
 * Lista recursiva de todos os arquivos JS/JSX em src/,
 * excluindo o próprio arquivo de teste.
 */
function collectSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      if (fullPath !== __filename) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/** Variáveis VITE_* proibidas no frontend (segredos privados de backend). */
const FORBIDDEN_PATTERNS = [
  "VITE_GROQ_API_KEY",
  "VITE_GITHUB_CLIENT_SECRET",
];

/** Variáveis VITE_* legítimas do frontend — não devem ser bloqueadas. */
const ALLOWED_PATTERNS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GITHUB_CLIENT_ID",
  "VITE_GITHUB_REDIRECT_URI",
];

describe("Segurança frontend: segredos privados não expostos via VITE_*", () => {
  const sourceFiles = collectSourceFiles(SRC_DIR);

  test.each(FORBIDDEN_PATTERNS)(
    "nenhum arquivo em src/ deve referenciar %s",
    (forbiddenVar) => {
      const violations = [];
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes(forbiddenVar)) {
          violations.push(path.relative(SRC_DIR, file));
        }
      }
      if (violations.length > 0) {
        throw new Error(
          `Variável proibida "${forbiddenVar}" encontrada em: ${violations.join(", ")}. ` +
          `Secrets de backend não devem ser referenciados no bundle frontend.`
        );
      }
      expect(violations).toHaveLength(0);
    }
  );

  test.each(ALLOWED_PATTERNS)(
    "variável pública legítima %s pode existir em src/ (não bloqueada)",
    (allowedVar) => {
      // Este teste apenas documenta que as variáveis abaixo não são proibidas.
      // Se este teste falhar, significa que a lógica de detecção está incorreta.
      expect(FORBIDDEN_PATTERNS).not.toContain(allowedVar);
    }
  );
});
