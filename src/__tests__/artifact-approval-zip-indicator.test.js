// src/__tests__/artifact-approval-zip-indicator.test.js
// F3-02 — Validação estática: indicador de prontidão do ZIP no fluxo de aprovação

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(process.cwd());

describe('F3-02 — ArtifactPreviewPanel: indicador de ZIP no fluxo de aprovação', () => {
  let source;

  beforeAll(() => {
    source = fs.readFileSync(
      path.join(repoRoot, 'src/components/construtor/ArtifactPreviewPanel.jsx'),
      'utf8'
    );
  });

  // 1. O indicador de prontidão do ZIP é calculado a partir da validação
  test('zipReady é derivado de summary.validation?.valid', () => {
    expect(source).toContain('const zipReady = summary.validation?.valid === true');
  });

  // 2. O indicador de status ZIP está vinculado ao estado pendente
  test('indicador artifact-zip-status é renderizado condicionalmente no estado pendente', () => {
    expect(source).toContain('artifact-zip-status');
    expect(source).toContain('isPending');
    expect(source).toContain('artifact-zip-status--ready');
    expect(source).toContain('artifact-zip-status--warn');
  });

  // 3. A mensagem positiva ("ZIP válido") está presente
  test('mensagem de artefato ZIP válido está presente no componente', () => {
    expect(source).toContain('Artefato ZIP válido — pronto para exportar após aprovação');
  });

  // 4. A mensagem de aviso (erros de validação) está presente
  test('mensagem de aviso de erros de validação está presente no componente', () => {
    expect(source).toContain('Artefato com erros de validação — revise antes de aprovar');
  });

  // 5. Atributo de acessibilidade role="status" está presente no indicador
  test('indicador ZIP tem atributo role="status" para acessibilidade', () => {
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-label="Status do artefato ZIP"');
  });

  // 6. Botão de download existente (pós-aprovação) não foi removido
  test('botão de download pós-aprovação permanece intacto', () => {
    expect(source).toContain('📥 Baixar Artefato (.zip)');
    expect(source).toContain("decision === 'approved' && delivery?.zipBase64");
  });

  // 7. executeArtifact não foi reativado
  test('executeArtifact NÃO é chamado no componente de preview', () => {
    expect(source).not.toContain('executeArtifact');
  });

  // 8. Fluxo de aprovação (onDecision) permanece inalterado
  test("onDecision continua sendo chamado com 'approved' no handleApprove", () => {
    expect(source).toContain("onDecision?.('approved', null)");
  });
});

describe('F3-02 — HybridAgent.css: classes do indicador ZIP definidas', () => {
  let css;

  beforeAll(() => {
    css = fs.readFileSync(
      path.join(repoRoot, 'src/styles/HybridAgent.css'),
      'utf8'
    );
  });

  test('classe artifact-zip-status está definida no CSS', () => {
    expect(css).toContain('.artifact-zip-status');
  });

  test('classe artifact-zip-status--ready está definida no CSS', () => {
    expect(css).toContain('.artifact-zip-status--ready');
  });

  test('classe artifact-zip-status--warn está definida no CSS', () => {
    expect(css).toContain('.artifact-zip-status--warn');
  });
});
