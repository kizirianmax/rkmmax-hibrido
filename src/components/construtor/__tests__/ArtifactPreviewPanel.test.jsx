// src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx
// PASSO 4 — testes do fluxo de ajuste com feedback estruturado
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArtifactPreviewPanel from '../ArtifactPreviewPanel.jsx';

const buildPreview = (fileNames = []) => ({
  previewAvailable: true,
  decision: 'pending',
  feedback: null,
  decisionTimestamp: null,
  summary: {
    id: 'test-001',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    origin: { model: 'test-model', promptId: 'test-prompt' },
    validation: { valid: true, errorCount: 0, errors: [], warnings: [] },
    execution: null,
    status: { level: 'ok', label: 'OK', description: 'Artefato válido' },
    filesSummary: fileNames.length > 0
      ? { totalFiles: fileNames.length, contentType: 'multi-file', fileNames }
      : null,
    files: fileNames.map((name) => ({ path: name, size: 100 })),
    contentPreview: '// preview',
  },
});

describe('ArtifactPreviewPanel — PASSO 4 Feedback Estruturado', () => {
  // 1. Feedback livre simples continua funcionando
  test('feedback livre simples chama onRevision com comment e category null', () => {
    const onRevision = jest.fn();
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={onRevision} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    fireEvent.change(screen.getByLabelText(/notas de ajuste/i), { target: { value: 'Ajustar o bloco final' } });
    fireEvent.click(screen.getByText(/confirmar ajuste/i));

    expect(onRevision).toHaveBeenCalledWith({
      category: null,
      focusFile: null,
      comment: 'Ajustar o bloco final',
    });
  });

  // 2. Feedback estruturado inclui categoria quando selecionada
  test('selecionar chip de categoria inclui category no payload', () => {
    const onRevision = jest.fn();
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={onRevision} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    fireEvent.click(screen.getByTitle(/partes faltando ou truncadas/i));
    fireEvent.change(screen.getByLabelText(/notas de ajuste/i), { target: { value: 'Falta a função final' } });
    fireEvent.click(screen.getByText(/confirmar ajuste/i));

    expect(onRevision).toHaveBeenCalledWith({
      category: 'incompletude',
      focusFile: null,
      comment: 'Falta a função final',
    });
  });

  // 3. Fluxo não quebra quando categoria não é escolhida
  test('confirmar ajuste sem categoria não quebra o fluxo', () => {
    const onRevision = jest.fn();
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={onRevision} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    fireEvent.click(screen.getByText(/confirmar ajuste/i));

    expect(onRevision).toHaveBeenCalledWith({ category: null, focusFile: null, comment: null });
  });

  // 4. Payload de revisão fica mais rico com categoria + arquivo-foco + comentário
  test('payload completo quando categoria + arquivo-foco + comentário fornecidos', () => {
    const onRevision = jest.fn();
    const preview = buildPreview(['script.js', 'dados.json', 'README.md']);
    render(<ArtifactPreviewPanel preview={preview} onRevision={onRevision} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    fireEvent.click(screen.getByTitle(/organização dos arquivos ou blocos/i));
    fireEvent.change(screen.getByLabelText(/arquivo-foco do ajuste/i), { target: { value: 'script.js' } });
    fireEvent.change(screen.getByLabelText(/notas de ajuste/i), { target: { value: 'Blocos fora de ordem' } });
    fireEvent.click(screen.getByText(/confirmar ajuste/i));

    expect(onRevision).toHaveBeenCalledWith({
      category: 'estrutura',
      focusFile: 'script.js',
      comment: 'Blocos fora de ordem',
    });
  });

  // 5. Botões existentes continuam funcionando — aprovar e rejeitar
  test('botão Aprovar chama onDecision com "approved"', () => {
    const onDecision = jest.fn();
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={jest.fn()} onDecision={onDecision} />);

    fireEvent.click(screen.getByText(/aprovar/i));
    expect(onDecision).toHaveBeenCalledWith('approved', null);
  });

  test('botão Cancelar no formulário de ajuste fecha o formulário', () => {
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    expect(screen.getByLabelText(/notas de ajuste/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/cancelar/i));
    expect(screen.queryByLabelText(/notas de ajuste/i)).not.toBeInTheDocument();
  });

  // 6. Seletor de arquivo-foco aparece quando preview tem arquivos
  test('seletor de arquivo-foco renderiza quando preview tem fileNames', () => {
    const preview = buildPreview(['script.js', 'dados.json']);
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    const select = screen.getByLabelText(/arquivo-foco do ajuste/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByText('script.js')).toBeInTheDocument();
    expect(screen.getByText('dados.json')).toBeInTheDocument();
  });

  test('seletor de arquivo-foco não aparece quando preview não tem arquivos', () => {
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    expect(screen.queryByLabelText(/arquivo-foco do ajuste/i)).not.toBeInTheDocument();
  });

  // Toggle de categoria (clique duplo deseleciona)
  test('clicar no mesmo chip duas vezes deseleciona a categoria', () => {
    const onRevision = jest.fn();
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={onRevision} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByText(/solicitar ajuste/i));
    const chip = screen.getByTitle(/clareza, formatação, separação/i);
    fireEvent.click(chip); // seleciona
    fireEvent.click(chip); // deseleciona
    fireEvent.click(screen.getByText(/confirmar ajuste/i));

    expect(onRevision).toHaveBeenCalledWith({ category: null, focusFile: null, comment: null });
  });
});
