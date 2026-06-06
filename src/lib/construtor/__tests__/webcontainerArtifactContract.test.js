import {
  normalizeWebContainerArtifact,
  sanitizeWebContainerArtifact,
  validateWebContainerArtifact,
} from "../webcontainerArtifactContract.js";
import { CONTROLLED_ARTIFACT_CANDIDATE } from "../webcontainerArtifactFixture.js";

function candidateWith(overrides) {
  return {
    ...CONTROLLED_ARTIFACT_CANDIDATE,
    ...overrides,
  };
}

describe("webcontainerArtifactContract", () => {
  test("aceita fixture válido", () => {
    const result = validateWebContainerArtifact(CONTROLLED_ARTIFACT_CANDIDATE);

    expect(result.ok).toBe(true);
    expect(result.files).toHaveProperty(["package.json"]);
    expect(result.files).toHaveProperty(["index.js"]);
    expect(result.files).toHaveProperty(["lib/sum.js"]);
  });

  test("rejeita path traversal", () => {
    const result = validateWebContainerArtifact(candidateWith({ "../evil.js": "console.log('nope');\n" }));

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "../evil.js" });
  });

  test("rejeita caminho absoluto", () => {
    const result = validateWebContainerArtifact(candidateWith({ "/absolute/path.js": "console.log('nope');\n" }));

    expect(result).toMatchObject({ ok: false, reason: "caminho-perigoso", path: "/absolute/path.js" });
  });

  test("rejeita dotfile", () => {
    const result = validateWebContainerArtifact(candidateWith({ ".env": "SECRET=value\n" }));

    expect(result).toMatchObject({ ok: false, reason: "caminho-oculto-ou-invalido", path: ".env" });
  });

  test("rejeita dependências externas em package.json", () => {
    const result = validateWebContainerArtifact(
      candidateWith({
        "package.json": `${JSON.stringify({
          name: "fixture",
          version: "0.0.0",
          dependencies: { lodash: "^4.17.21" },
        })}\n`,
      })
    );

    expect(result).toMatchObject({ ok: false, reason: "dependencias-externas-nao-permitidas", path: "package.json" });
  });

  test("rejeita optionalDependencies e bundledDependencies em package.json", () => {
    const optionalResult = validateWebContainerArtifact(
      candidateWith({
        "package.json": `${JSON.stringify({
          name: "fixture",
          version: "0.0.0",
          optionalDependencies: { leftpad: "1.3.0" },
        })}\n`,
      })
    );
    const bundledResult = validateWebContainerArtifact(
      candidateWith({
        "package.json": `${JSON.stringify({
          name: "fixture",
          version: "0.0.0",
          bundledDependencies: ["leftpad"],
        })}\n`,
      })
    );

    expect(optionalResult).toMatchObject({
      ok: false,
      reason: "dependencias-externas-nao-permitidas",
      path: "package.json",
    });
    expect(bundledResult).toMatchObject({
      ok: false,
      reason: "dependencias-externas-nao-permitidas",
      path: "package.json",
    });
  });

  test("rejeita scripts perigosos em package.json", () => {
    const result = validateWebContainerArtifact(
      candidateWith({
        "package.json": `${JSON.stringify({
          name: "fixture",
          version: "0.0.0",
          dependencies: {},
          scripts: { postinstall: "node index.js" },
        })}\n`,
      })
    );

    expect(result).toMatchObject({ ok: false, reason: "script-instalacao-nao-permitido", path: "package.json" });
  });

  test("rejeita conteúdo com user_email", () => {
    const result = validateWebContainerArtifact(candidateWith({ "index.js": "const user_email = 'x@example.test';\n" }));

    expect(result).toMatchObject({ ok: false, reason: "conteudo-com-user-email", path: "index.js" });
  });

  test("rejeita zipBase64", () => {
    const result = validateWebContainerArtifact(candidateWith({ "artifact-manifest.json": '{"zipBase64":"abc"}\n' }));

    expect(result).toMatchObject({ ok: false, reason: "conteudo-com-zipbase64", path: "artifact-manifest.json" });
  });

  test("rejeita contentPreview", () => {
    const result = validateWebContainerArtifact(candidateWith({ "artifact-manifest.json": '{"contentPreview":"abc"}\n' }));

    expect(result).toMatchObject({ ok: false, reason: "conteudo-com-contentpreview", path: "artifact-manifest.json" });
  });

  test("rejeita APIs de rede nativas sem URL literal", () => {
    const nodeNetworkResult = validateWebContainerArtifact(
      candidateWith({ "index.js": 'require("node:https").request({ hostname: "example.test" }).end();\n' })
    );
    const fetchResult = validateWebContainerArtifact(candidateWith({ "index.js": "fetch('/api/anything');\n" }));

    expect(nodeNetworkResult).toMatchObject({
      ok: false,
      reason: "conteudo-com-api-de-rede",
      path: "index.js",
    });
    expect(fetchResult).toMatchObject({
      ok: false,
      reason: "conteudo-com-api-de-rede",
      path: "index.js",
    });
  });

  test("rejeita wrapper files para não aceitar payload bruto", () => {
    const result = validateWebContainerArtifact({ files: CONTROLLED_ARTIFACT_CANDIDATE });

    expect(result).toMatchObject({ ok: false, reason: "arquivo-fora-da-allowlist", path: "files" });
  });

  test("rejeita arquivo fora da allowlist", () => {
    const result = validateWebContainerArtifact(candidateWith({ "src/app.js": "console.log('nope');\n" }));

    expect(result).toMatchObject({ ok: false, reason: "arquivo-fora-da-allowlist", path: "src/app.js" });
  });

  test("normaliza saída para formato compatível com webcontainer.mount", () => {
    const sanitized = sanitizeWebContainerArtifact(CONTROLLED_ARTIFACT_CANDIDATE);

    expect(sanitized.ok).toBe(true);
    expect(sanitized.mountTree).toEqual(normalizeWebContainerArtifact(CONTROLLED_ARTIFACT_CANDIDATE));
    expect(sanitized.mountTree).toHaveProperty(["package.json", "file", "contents"]);
    expect(sanitized.mountTree).toHaveProperty(["index.js", "file", "contents"]);
    expect(sanitized.mountTree).toHaveProperty(["lib", "directory", "sum.js", "file", "contents"]);
  });
});
