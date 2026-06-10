import { validateStaticClientArtifact } from "../constructorStaticClientArtifactContract.js";

describe("constructorStaticClientArtifactContract", () => {
  test("aceita index.html + styles.css + script.js", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><head><link rel='stylesheet' href='styles.css'></head><body><script src='script.js'></script></body></html>",
      "styles.css": "body{font-family:sans-serif;}",
      "script.js": "console.log('ok');",
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.files).toHaveProperty(["index.html"]);
    expect(result.files).toHaveProperty(["styles.css"]);
    expect(result.files).toHaveProperty(["script.js"]);
  });

  test("aceita index.html + style.css + script.js", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><head><link rel='stylesheet' href='style.css'></head><body><script src='script.js'></script></body></html>",
      "style.css": "body{margin:0;}",
      "script.js": "console.log('ok');",
    });

    expect(result).toMatchObject({ ok: true });
  });

  test("aceita index.html isolado", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><body><main>ok</main></body></html>",
    });

    expect(result).toMatchObject({ ok: true });
  });

  test("rejeita path traversal", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><body>ok</body></html>",
      "../index.html": "<!doctype html><html><body>bad</body></html>",
    });

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "../index.html" });
  });

  test("rejeita dotfile sensível", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><body>ok</body></html>",
      ".env": "SECRET=value",
    });

    expect(result).toMatchObject({ ok: false, reason: "caminho-oculto-ou-invalido", path: ".env" });
  });

  test("rejeita arquivo fora da allowlist estática", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><body>ok</body></html>",
      "content.md": "# Documento",
    });

    expect(result).toMatchObject({ ok: false, reason: "arquivo-fora-da-allowlist", path: "content.md" });
  });

  test("rejeita lockfile", () => {
    const result = validateStaticClientArtifact({
      "index.html": "<!doctype html><html><body>ok</body></html>",
      "package-lock.json": '{"lockfileVersion":3}',
    });

    expect(result).toMatchObject({ ok: false, reason: "lockfile-nao-permitido", path: "package-lock.json" });
  });

  test("rejeita sem index.html obrigatório", () => {
    const result = validateStaticClientArtifact({
      "script.js": "console.log('ok');",
    });

    expect(result).toMatchObject({ ok: false, reason: "entrypoint-nao-permitido", path: "entrypoint" });
  });
});
