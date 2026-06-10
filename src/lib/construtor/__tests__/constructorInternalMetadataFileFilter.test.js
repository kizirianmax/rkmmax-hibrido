import { filterConstructorInternalMetadataFiles } from "../constructorInternalMetadataFileFilter.js";

describe("constructorInternalMetadataFileFilter", () => {
  test("remove somente metadados internos observacionais em escopo fixo sem mutar input", () => {
    const input = {
      "README.md": "# docs",
      "manifest.json": '{"name":"x"}',
      "logs/generation.log": "ok",
      "logs/structure.log": "ok",
      "logs/other.log": "ok",
      "docs/ReadMe.MD": "# docs nested",
      "docs/README.md": "# docs nested 2",
      "assets/manifest.json": '{"name":"nested"}',
      "index.html": "<html></html>",
      "script.js": "console.log('ok')",
      "artifact-manifest.json": '{"entrypoint":"index.html"}',
      "content.md": "--- FILE: index.html ---\n<html></html>",
    };
    const originalSnapshot = { ...input };

    const filtered = filterConstructorInternalMetadataFiles(input);

    expect(filtered).toEqual({
      "docs/ReadMe.MD": "# docs nested",
      "docs/README.md": "# docs nested 2",
      "assets/manifest.json": '{"name":"nested"}',
      "index.html": "<html></html>",
      "script.js": "console.log('ok')",
      "artifact-manifest.json": '{"entrypoint":"index.html"}',
      "content.md": "--- FILE: index.html ---\n<html></html>",
    });
    expect(input).toEqual(originalSnapshot);
    expect(filtered).not.toBe(input);
  });

  test("preserva arquivos executáveis esperados e NÃO remove content.md", () => {
    const input = {
      "index.html": "<html></html>",
      "styles.css": "body{}",
      "style.css": "body{}",
      "script.js": "console.log('ok')",
      "assets/main.css": "body{}",
      "assets/main.js": "console.log('ok')",
      "index.js": "console.log('ok')",
      "lib/helpers.js": "module.exports = {};",
      "content.md": "--- FILE: index.html ---\n<html></html>",
    };

    expect(filterConstructorInternalMetadataFiles(input)).toEqual(input);
  });

  test("não interpreta marcador textual dentro de content.md", () => {
    const input = {
      "content.md":
        "# bloco textual\n--- FILE: README.md ---\ntexto\n--- FILE: logs/generation.log ---\ntexto",
    };

    expect(filterConstructorInternalMetadataFiles(input)).toEqual(input);
  });

  test("retorna objeto vazio para entrada não plain object", () => {
    expect(filterConstructorInternalMetadataFiles(null)).toEqual({});
    expect(filterConstructorInternalMetadataFiles(undefined)).toEqual({});
    expect(filterConstructorInternalMetadataFiles([])).toEqual({});
    expect(filterConstructorInternalMetadataFiles("x")).toEqual({});
  });
});
