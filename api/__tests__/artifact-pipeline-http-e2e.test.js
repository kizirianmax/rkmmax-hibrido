import { jest } from '@jest/globals';
import { createServer, request as httpRequest } from 'node:http';
import { artifactPipelineFixture } from '../__fixtures__/artifact-pipeline.fixture.js';

const TEST_HOST = '127.0.0.1';

jest.unstable_mockModule('../../src/lib/construtor/artifactPackager.js', () => ({
  packageArtifact: jest.fn().mockImplementation(async ({ metadata = {} }) => ({
    id: artifactPipelineFixture.expected.id,
    manifest: {
      id: artifactPipelineFixture.expected.id,
      version: '1.0.0',
      timestamp: '2026-05-24T00:00:00.000Z',
      origin: {
        specialist: metadata.specialist || 'hybrid',
        model: metadata.model || 'fixture-model',
        promptId: metadata.promptId || 'fixture-prompt',
      },
      checksum: 'sha256:' + 'b'.repeat(64),
    },
    zipBuffer: Buffer.from('PK\x03\x04'),
    zipBase64: artifactPipelineFixture.expected.zipBase64,
  })),
}));

jest.unstable_mockModule('../../src/lib/construtor/artifactValidator.js', () => ({
  validateArtifact: jest.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
}));

jest.unstable_mockModule('../../src/lib/construtor/artifactPreview.js', () => ({
  generatePreview: jest.fn().mockImplementation((artifact, validation, execution) => ({
    previewAvailable: true,
    summary: {
      id: artifact.id,
      version: artifact.manifest.version,
      timestamp: artifact.manifest.timestamp,
      origin: artifact.manifest.origin,
      validation: {
        valid: validation.valid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
      },
      execution,
      files: ['src/index.js'],
      contentPreview: 'console.log("hello artifact");',
    },
    decision: 'pending',
    feedback: null,
    decisionTimestamp: null,
  })),
  applyDecision: jest.fn().mockImplementation((preview, decision, feedback) => ({
    ...preview,
    decision,
    feedback: feedback || null,
    decisionTimestamp: '2026-05-24T00:00:00.000Z',
  })),
}));

jest.unstable_mockModule('../../src/lib/construtor/artifactRunner.js', () => ({
  executeArtifact: jest.fn(),
}));

jest.unstable_mockModule('../lib/auth.js', () => ({
  verifyAuth: jest.fn().mockResolvedValue({ user: { id: 'test-user' }, error: null }),
}));

const createReqResServer = ({ artifactHandler, previewHandler }) =>
  createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);

    const rawBody = Buffer.concat(chunks).toString('utf8');
    req.body = rawBody ? JSON.parse(rawBody) : {};

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };

    const url = new URL(req.url || '/', `http://${TEST_HOST}`);

    if (url.pathname === '/api/artifact') return artifactHandler(req, res);
    if (url.pathname === '/api/artifact-preview') return previewHandler(req, res);

    return res.status(404).json({ error: 'Not found' });
  });

describe('F4-01 — pipeline HTTP E2E mínimo (artifact + preview)', () => {
  let server;
  let baseUrl;
  let executeArtifactMock;

  const sendJsonRequest = (path, method, body) =>
    new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const req = httpRequest(
        `${baseUrl}${path}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            Authorization: 'Bearer test-token',
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            resolve({ status: res.statusCode, json: raw ? JSON.parse(raw) : {} });
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

  beforeAll(async () => {
    const artifactModule = await import('../artifact.js');
    const previewModule = await import('../artifact-preview.js');
    executeArtifactMock = (await import('../../src/lib/construtor/artifactRunner.js')).executeArtifact;

    server = createReqResServer({ artifactHandler: artifactModule.default, previewHandler: previewModule.default });

    await new Promise((resolve) => {
      server.listen(0, TEST_HOST, resolve);
    });

    const address = server.address();
    baseUrl = `http://${TEST_HOST}:${address.port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('deve percorrer pipeline HTTP real com payload determinístico sem execução automática', async () => {
    executeArtifactMock.mockClear();

    const artifactResponse = await sendJsonRequest('/api/artifact', 'POST', artifactPipelineFixture.artifactRequest);

    expect(artifactResponse.status).toBe(200);
    const artifactJson = artifactResponse.json;
    expect(artifactJson.success).toBe(true);
    expect(artifactJson.id).toBe(artifactPipelineFixture.expected.id);
    expect(artifactJson.zipBase64).toBe(artifactPipelineFixture.expected.zipBase64);
    expect(artifactJson.manifest).toEqual(
      expect.objectContaining({
        id: artifactPipelineFixture.expected.id,
        origin: expect.objectContaining({
          specialist: 'hybrid',
          model: 'fixture-model',
          promptId: 'fixture-prompt',
        }),
      }),
    );

    const previewResponse = await sendJsonRequest(
      '/api/artifact-preview',
      'POST',
      artifactPipelineFixture.artifactRequest,
    );

    expect(previewResponse.status).toBe(200);
    const previewJson = previewResponse.json;
    expect(previewJson.success).toBe(true);
    expect(previewJson.preview).toEqual(
      expect.objectContaining({
        previewAvailable: true,
        decision: 'pending',
        summary: expect.objectContaining({
          id: artifactPipelineFixture.expected.id,
          execution: expect.objectContaining({
            executed: false,
            reason: artifactPipelineFixture.expected.executionReason,
          }),
        }),
      }),
    );

    const reviewResponse = await sendJsonRequest('/api/artifact-preview', 'PATCH', {
        preview: previewJson.preview,
        decision: artifactPipelineFixture.previewDecisionRequest.decision,
        feedback: artifactPipelineFixture.previewDecisionRequest.feedback,
        content: artifactPipelineFixture.artifactRequest.content,
    });

    expect(reviewResponse.status).toBe(200);
    const reviewJson = reviewResponse.json;
    expect(reviewJson.success).toBe(true);
    expect(reviewJson.preview.decision).toBe('approved');
    expect(reviewJson.zipBase64).toBe(artifactPipelineFixture.expected.zipBase64);

    expect(executeArtifactMock).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
