import { prepareApprovedConstructorArtifactForWebContainer } from "./approvedConstructorArtifactHandoff.js";
import { selectConstructorApprovedArtifactSnapshotInput } from "./constructorApprovedArtifactPreviewSelector.js";

const FIXTURE_ENTRYPOINT = "index.js";
const FIXTURE_NOTE =
  "Fonte aprovada controlada via fixture client-safe; ainda não é artefato real aprovado do Construtor.";

export const CONTROLLED_APPROVED_PREVIEW_SUMMARY = {
  id: "controlled-webcontainer-artifact",
  version: "0.0.0-spike",
  entrypoint: FIXTURE_ENTRYPOINT,
  fileContents: {
    [FIXTURE_ENTRYPOINT]: `const manifest = require("./artifact-manifest.json");
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
  origin: {
    specialist: "hybrid",
    model: "fixture-controlado",
    promptId: "webcontainer-spike",
  },
};

function unavailable(reason, path) {
  return {
    ok: false,
    status: "approved-constructor-artifact: controlled-fixture-unavailable",
    reason,
    ...(path ? { path } : {}),
    activeSource: "controlled-approved-fixture",
    sourceType: "controlled-client-safe-approved-source",
    available: false,
    entrypoint: FIXTURE_ENTRYPOINT,
    safeFiles: [],
    fileCount: 0,
    apiUsed: false,
    storageUsed: false,
    rawPayloadAccessed: false,
    executeArtifactServerSide: "disabled",
    note: FIXTURE_NOTE,
  };
}

export function buildControlledApprovedWebContainerFixture() {
  const selected = selectConstructorApprovedArtifactSnapshotInput(CONTROLLED_APPROVED_PREVIEW_SUMMARY, "approved");

  if (!selected.ok) {
    return unavailable(selected.reason, selected.path);
  }

  const prepared = prepareApprovedConstructorArtifactForWebContainer(selected.artifact);

  if (!prepared.ok) {
    return unavailable(prepared.reason, prepared.path);
  }

  return {
    ok: true,
    status: "approved-constructor-artifact: controlled-fixture-ready",
    activeSource: "controlled-approved-fixture",
    sourceType: "controlled-client-safe-approved-source",
    available: true,
    entrypoint: FIXTURE_ENTRYPOINT,
    safeFiles: prepared.safeFiles,
    fileCount: prepared.fileCount,
    apiUsed: false,
    storageUsed: false,
    rawPayloadAccessed: false,
    executeArtifactServerSide: "disabled",
    note: FIXTURE_NOTE,
    mountTree: prepared.mountTree,
  };
}

export const CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE = buildControlledApprovedWebContainerFixture();

if (!CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.ok) {
  throw new Error(
    `Fixture aprovado controlado inválido: ${CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.reason || "invalid-fixture"}`
  );
}

export function getControlledApprovedWebContainerFixturePublicStatus() {
  const { mountTree: _mountTree, ...status } = CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE;
  return status;
}

export function getControlledApprovedWebContainerRuntimeInput() {
  return {
    mountTree: CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.mountTree,
    entrypoint: CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.entrypoint,
  };
}
