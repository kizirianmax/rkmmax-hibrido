import { observeConstructorRealPreviewDiagnostic } from "../constructorRealPreviewDiagnosticObservation.js";

function createRealPreview() {
  return {
    summary: {
      id: "preview-artifact-001",
      version: "1.0.0",
      files: [
        { path: "lib/sum.js", size: 64, type: "application/javascript" },
        { path: "index.js", size: 96, type: "application/javascript" },
      ],
      fileContents: {
        "index.js": "const { sum } = require('./lib/sum.js');\nconsole.log(sum([1, 2, 3]));",
        "lib/sum.js": "function sum(values){return values.reduce((a,b)=>a+b,0);}module.exports={sum};",
      },
    },
  };
}

function expectVerdictOnlyWithoutPayloadLeak(result) {
  expect(result).not.toHaveProperty("rawContent");
  expect(result).not.toHaveProperty("fileContents");
  expect(result).not.toHaveProperty("artifact");
  expect(result).not.toHaveProperty("files");
  expect(result).not.toHaveProperty("contentPreview");
  expect(result).not.toHaveProperty("zipBase64");
  expect(result).not.toHaveProperty("agentMessage");
}

describe("constructorRealPreviewDiagnosticObservation", () => {
  test("consome summary real e infere entrypoint sem alterar contrato verdict-only", () => {
    const preview = {
      ...createRealPreview(),
      id: "top-level-ignorado",
      version: "9.9.9",
      fileContents: {
        "content.md": "# Ignorado",
      },
    };

    const result = observeConstructorRealPreviewDiagnostic(preview);

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("preview sem summary retorna unavailable do observador", () => {
    const result = observeConstructorRealPreviewDiagnostic({});

    expect(result).toMatchObject({
      ok: false,
      status: "constructor-real-preview-diagnostic-observation: unavailable",
      verdict: "unavailable",
      stage: "input",
      reason: "real-preview-summary-invalido",
      path: "summary",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });

  test("retorno permanece verdict-only mesmo com campos sensíveis no preview", () => {
    const result = observeConstructorRealPreviewDiagnostic({
      ...createRealPreview(),
      contentPreview: "conteúdo bruto",
      zipBase64: "UEsDBAoAAAAAA",
      agentMessage: { content: "payload cru" },
      artifact: { files: [] },
    });

    expect(result).toMatchObject({
      ok: true,
      status: "constructor-approved-preview-diagnostic-reader: eligible",
      verdict: "eligible",
      stage: "builder",
      rawPayloadAccessed: false,
      apiUsed: false,
      storageUsed: false,
      executeArtifactServerSide: "disabled",
    });
    expectVerdictOnlyWithoutPayloadLeak(result);
  });
});
