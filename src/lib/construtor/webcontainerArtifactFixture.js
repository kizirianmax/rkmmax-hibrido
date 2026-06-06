/*
 * Fixture controlado para spike WebContainers client-side.
 * Sem rede, sem dependências externas, sem payload real de usuário.
 */

import { sanitizeWebContainerArtifact } from "./webcontainerArtifactContract.js";
import { buildWebContainerCandidateFromConstructorArtifact } from "./webcontainerConstructorArtifactAdapter.js";

export const CONTROLLED_ARTIFACT_ENTRYPOINT = "index.js";

const CONTROLLED_CONSTRUCTOR_ARTIFACT = {
  id: "controlled-webcontainer-artifact",
  version: "0.0.0-spike",
  entrypoint: CONTROLLED_ARTIFACT_ENTRYPOINT,
  manifest: {
    origin: {
      specialist: "hybrid",
      model: "fixture-controlado",
      promptId: "webcontainer-spike",
    },
    contentType: "application/vnd.rkmmax.webcontainer-spike+json",
  },
  files: {
    [CONTROLLED_ARTIFACT_ENTRYPOINT]: `const manifest = require("./artifact-manifest.json");
const { sum } = require("./lib/sum.js");

const result = sum([12, 30]);

console.log(\`Artifact: \${manifest.id}@\${manifest.version}\`);
console.log(\`Resultado controlado: \${result}\`);
console.log("RKMMAX artifact run OK");
`,
    "lib/sum.js": `function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

module.exports = { sum };
`,
  },
};

const adapterResult = buildWebContainerCandidateFromConstructorArtifact(CONTROLLED_CONSTRUCTOR_ARTIFACT);

if (!adapterResult.ok) {
  throw new Error(`Fixture controlado inválido no adapter: ${adapterResult.reason}`);
}

export const CONTROLLED_ARTIFACT_CANDIDATE = adapterResult.candidate;

export const CONTROLLED_ARTIFACT_SANITIZED = sanitizeWebContainerArtifact(CONTROLLED_ARTIFACT_CANDIDATE);

if (!CONTROLLED_ARTIFACT_SANITIZED.ok) {
  throw new Error(`Fixture controlado inválido: ${CONTROLLED_ARTIFACT_SANITIZED.reason}`);
}

export const CONTROLLED_ARTIFACT_FILES = CONTROLLED_ARTIFACT_SANITIZED.mountTree;
