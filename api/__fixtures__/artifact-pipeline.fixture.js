export const artifactPipelineFixture = {
  artifactRequest: {
    content: '--- FILE: src/index.js ---\nconsole.log("hello artifact");\n',
    metadata: {
      specialist: 'hybrid',
      model: 'fixture-model',
      promptId: 'fixture-prompt',
      tier: 'test',
    },
  },
  previewDecisionRequest: {
    decision: 'approved',
    feedback: 'Aprovado no fluxo E2E HTTP',
  },
  expected: {
    id: 'fixture-artifact-id',
    zipBase64: 'UEsDBA==',
    executionReason: 'execution-disabled-by-security-policy',
  },
};
