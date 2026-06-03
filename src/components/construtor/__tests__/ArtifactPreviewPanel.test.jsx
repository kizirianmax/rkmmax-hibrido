/** @jest-environment jsdom */
// src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx
// PASSO 4 — testes do fluxo de ajuste com feedback estruturado
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
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
  let writeTextMock;

  beforeEach(() => {
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
  });

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

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));
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
    expect(within(select).getByRole('option', { name: 'script.js' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'dados.json' })).toBeInTheDocument();
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

  test('botão "📋 Copiar" copia conteúdo completo do arquivo', async () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = { 'script.js': 'console.log("arquivo completo");'.repeat(40) };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '📋 Copiar' }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(preview.summary.fileContents['script.js']);
    });
  });

  test('botão "📋 Copiar tudo" copia todos os arquivos formatados', async () => {
    const preview = buildPreview(['index.html', 'style.css']);
    preview.summary.fileContents = {
      'index.html': '<html>ok</html>',
      'style.css': 'body{color:#000;}',
    };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /copiar tudo/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('--- index.html ---\n\n<html>ok</html>'),
      );
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('--- style.css ---\n\nbody{color:#000;}'),
      );
    });
  });
});
