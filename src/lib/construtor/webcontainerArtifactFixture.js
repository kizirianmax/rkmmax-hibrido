/*
 * Fixture controlado para spike WebContainers client-side.
 * Sem rede, sem dependências externas, sem payload real de usuário.
 */

export const CONTROLLED_ARTIFACT_ENTRYPOINT = "index.js";

export const CONTROLLED_ARTIFACT_FILES = {
  "package.json": {
    file: {
      contents: `${JSON.stringify(
        {
          name: "rkmmax-controlled-webcontainer-artifact",
          version: "0.0.0-spike",
          private: true,
          description: "Fixture controlado RKMMAX para execução client-side em WebContainer.",
          dependencies: {},
        },
        null,
        2
      )}\n`,
    },
  },
  "artifact-manifest.json": {
    file: {
      contents: `${JSON.stringify(
        {
          id: "controlled-webcontainer-artifact",
          version: "0.0.0-spike",
          origin: {
            specialist: "hybrid",
            model: "fixture-controlado",
            promptId: "webcontainer-spike",
          },
          contentType: "application/vnd.rkmmax.webcontainer-spike+json",
          contents: [
            {
              path: "index.js",
              description: "Entrypoint controlado do artefato mínimo.",
              type: "source",
            },
            {
              path: "lib/sum.js",
              description: "Módulo local usado pelo entrypoint para validar execução multi-arquivo.",
              type: "source",
            },
          ],
        },
        null,
        2
      )}\n`,
    },
  },
  [CONTROLLED_ARTIFACT_ENTRYPOINT]: {
    file: {
      contents: `const manifest = require("./artifact-manifest.json");
const { sum } = require("./lib/sum.js");

const result = sum([12, 30]);

console.log(\`Artifact: \${manifest.id}@\${manifest.version}\`);
console.log(\`Resultado controlado: \${result}\`);
console.log("RKMMAX artifact run OK");
`,
    },
  },
  lib: {
    directory: {
      "sum.js": {
        file: {
          contents: `function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

module.exports = { sum };
`,
        },
      },
    },
  },
};
