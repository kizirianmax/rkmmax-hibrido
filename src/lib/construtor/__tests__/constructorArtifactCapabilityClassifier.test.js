import { jest } from "@jest/globals";
import { classifyConstructorArtifactCapability } from "../constructorArtifactCapabilityClassifier.js";

describe("constructorArtifactCapabilityClassifier", () => {
  test("classifica index.html + styles.css como previewable-static", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.html": "<html><head><link rel='stylesheet' href='styles.css'></head><body></body></html>",
        "styles.css": "body { margin: 0; }",
      },
    });

    expect(result.capability).toBe("previewable-static");
    expect(result.flags).toMatchObject({ hasHtml: true, hasCss: true, hasJs: false });
  });

  test("classifica index.html + style.css como previewable-static", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.html": "<html><head><link rel='stylesheet' href='style.css'></head><body></body></html>",
        "style.css": "body { font-family: sans-serif; }",
      },
    });

    expect(result.capability).toBe("previewable-static");
  });

  test("classifica html/css/js simples como exportable (não executable-client)", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.html": "<html><head><link rel='stylesheet' href='styles.css'></head><body><script src='script.js'></script></body></html>",
        "styles.css": "body { color: #222; }",
        "script.js": "console.log('ok');",
      },
    });

    expect(result.capability).toBe("exportable");
    expect(result.capability).not.toBe("executable-client");
  });

  test("classifica DOM com document.querySelector como executable-client", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.html": "<html><body><div id='app'></div><script src='script.js'></script></body></html>",
        "script.js": "document.querySelector('#app').textContent = 'ok';",
      },
    });

    expect(result.capability).toBe("executable-client");
    expect(result.flags.hasDomAccess).toBe(true);
  });

  test("classifica DOM com window.addEventListener como executable-client", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.html": "<html><body><button id='x'>x</button><script src='script.js'></script></body></html>",
        "script.js": "window.addEventListener('load', () => console.log('ready'));",
      },
    });

    expect(result.capability).toBe("executable-client");
  });

  test.each([
    "globalThis.fetch('https://example.com')",
    "globalThis['fetch']('https://example.com')",
    "globalThis['fe' + 'tch']('https://example.com')",
    "self['location']",
    "obj['key']",
  ])("bloqueia acesso dinâmico/evasivo (%s)", (code) => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.js": code,
      },
    });

    expect(result.capability).toBe("blocked");
    expect(result.reasons).toContain("conteudo-com-acesso-dinamico");
  });

  test.each([
    "window.addEventListener('load', () => {})",
    "document.querySelector('#app')",
    "navigator.userAgent",
    "location.href",
  ])("não classifica acesso DOM sem HTML como exportable (%s)", (code) => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.js": code,
      },
    });

    expect(result.capability).toBe("blocked");
    expect(result.reasons).not.toContain("javascript-without-dom-access");
  });

  test.each([
    "eval('2+2')",
    "const make = new Function('return 1');",
  ])("bloqueia JS com sinal perigoso (%s)", (code) => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.js": code,
      },
    });

    expect(result.capability).toBe("blocked");
    expect(result.reasons).toContain("unsafe-code-detected");
  });

  test.each([
    { path: "index.js", code: "fetch('https://example.com/api')" },
    { path: "index.js", code: "import x from 'https://esm.sh/pkg'" },
    { path: "index.html", code: "<a href='http://example.com'>x</a>" },
  ])("bloqueia rede/import externo (%p)", ({ path, code }) => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        [path]: code,
      },
    });

    expect(result.capability).toBe("blocked");
    expect(result.reasons[0]).toMatch(/external-/);
  });

  test.each([
    { "../escape.js": "console.log('x')" },
    { "/tmp/evil.js": "console.log('x')" },
    { "/evil.js": "console.log('x')" },
    { "C:/evil.js": "console.log('x')" },
    { "C:\\evil.js": "console.log('x')" },
    { "safe/../evil.js": "console.log('x')" },
    { "nested\\path\\file.js": "console.log('x')" },
  ])("bloqueia path perigoso (%j)", (fileContents) => {
    const result = classifyConstructorArtifactCapability({ fileContents });

    expect(result.capability).toBe("blocked");
    expect(result.reasons).toContain("unsafe-path-detected");
    expect(result.flags.hasUnsafePath).toBe(true);
  });

  test("classifica content.md comum como exportable", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "content.md": "# Documento\nTexto comum",
      },
      entrypoint: "content.md",
    });

    expect(result.capability).toBe("exportable");
  });

  test("markdown com ### index.js único permanece documento exportable", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "content.md": "### index.js\n```js\nwindow.addEventListener('load', () => {})\n```",
      },
      entrypoint: "content.md",
    });

    expect(result.capability).toBe("exportable");
    expect(result.capability).not.toBe("executable-client");
  });

  test("ignora README.md, manifest.json e logs/* como sinais primários", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "README.md": "metadado",
        "manifest.json": "{}",
        "logs/generation.log": "ok",
        "index.html": "<html><head><link rel='stylesheet' href='styles.css'></head><body></body></html>",
        "styles.css": "body {}",
      },
    });

    expect(result.capability).toBe("previewable-static");
    expect(result.flags.hasJs).toBe(false);
  });

  test("bloqueia index.html com script inline (não silenciosamente previewable-static)", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.html":
          "<html><head><link rel='stylesheet' href='styles.css'></head><body><script>window.addEventListener('load', () => {})</script></body></html>",
        "styles.css": "body { margin: 0; }",
      },
    });

    expect(result.capability).toBe("blocked");
    expect(result.reasons).toContain("inline-script-detected");
    expect(result.capability).not.toBe("previewable-static");
  });

  test("retorno é serializável e não expõe payload bruto", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.js": "const superSensitiveToken = 'ABC-123'; console.log('ok');",
      },
    });

    const serialized = JSON.stringify(result);

    expect(serialized).toContain("capability");
    expect(serialized).not.toContain("superSensitiveToken");
    expect(result).toEqual({
      capability: expect.any(String),
      reasons: expect.any(Array),
      flags: expect.any(Object),
    });
  });

  test("função é read-only: não executa código, não chama WebContainer e não chama API", () => {
    const originalFetch = globalThis.fetch;
    const originalWebContainer = globalThis.WebContainer;
    const originalExecuteArtifact = globalThis.executeArtifact;

    globalThis.fetch = jest.fn();
    globalThis.WebContainer = { boot: jest.fn() };
    globalThis.executeArtifact = jest.fn();

    try {
      classifyConstructorArtifactCapability({
        fileContents: {
          "index.js": "console.log('safe');",
        },
      });

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(globalThis.WebContainer.boot).not.toHaveBeenCalled();
      expect(globalThis.executeArtifact).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
      globalThis.WebContainer = originalWebContainer;
      globalThis.executeArtifact = originalExecuteArtifact;
    }
  });

  test("DOM sem HTML segue abordagem conservadora e bloqueia", () => {
    const result = classifyConstructorArtifactCapability({
      fileContents: {
        "index.js": "document.getElementById('app')",
      },
    });

    expect(result.capability).toBe("blocked");
    expect(result.reasons).toContain("dom-access-without-html");
  });
});
