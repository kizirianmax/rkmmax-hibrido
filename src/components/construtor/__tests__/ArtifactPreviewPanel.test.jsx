/** @jest-environment jsdom */
// src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx
// PASSO 4 — testes do fluxo de ajuste com feedback estruturado
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArtifactPreviewPanel from '../ArtifactPreviewPanel.jsx';
import * as clientZipBuilder from '../../../lib/construtor/clientZipBuilder.jsx';

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
  const originalClipboard = global.navigator.clipboard;
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalRevokeObjectURL = global.URL.revokeObjectURL;
  const originalAtob = global.atob;
  const createObjectURLMock = jest.fn();
  const revokeObjectURLMock = jest.fn();
  const getFileItem = (path) => {
    const filePathElement = screen.getAllByText(path).find((el) => el.classList.contains('artifact-file-path'));
    return filePathElement?.closest('li') || null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    createObjectURLMock.mockReset();
    createObjectURLMock.mockReturnValue('blob:mock-url');
    revokeObjectURLMock.mockReset();
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
    Object.defineProperty(global.URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURLMock,
    });
    if (typeof global.atob !== 'function') {
      Object.defineProperty(global, 'atob', {
        configurable: true,
        value: (value) => Buffer.from(value, 'base64').toString('binary'),
      });
    }
  });

  afterEach(() => {
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
    Object.defineProperty(global.URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
    Object.defineProperty(global, 'atob', {
      configurable: true,
      value: originalAtob,
    });
    jest.restoreAllMocks();
    jest.clearAllMocks();
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

  test('botão "📋 Copiar" não tenta copiar conteúdo vazio', async () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = {};
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '📋 Copiar' }));

    await waitFor(() => {
      expect(screen.getByText('⚠️ Conteúdo vazio para copiar.')).toBeInTheDocument();
    });
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  test('botão "📋 Copiar tudo" ignora binários e copia apenas conteúdo textual', async () => {
    const preview = buildPreview(['index.html', 'logo.png']);
    preview.summary.files = [
      { path: 'index.html', size: 100, type: 'text/html' },
      { path: 'logo.png', size: 50, type: 'image/png' },
    ];
    preview.summary.fileContents = {
      'index.html': '<html>ok</html>',
    };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /copiar tudo/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('--- index.html ---'));
      expect(writeTextMock).not.toHaveBeenCalledWith(expect.stringContaining('logo.png'));
    });
  });

  test('botão "✏️ Editar" abre editor local com conteúdo completo do arquivo textual', () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = { 'script.js': 'linha 1\nlinha 2' };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '✏️ Editar' }));

    expect(screen.getByLabelText('Editor local do arquivo script.js')).toHaveValue('linha 1\nlinha 2');
  });

  test('aplicar edição local mostra feedback "Edição aplicada"', () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = { 'script.js': 'console.log("a");' };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo script.js'), {
      target: { value: 'console.log("editado");' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));

    expect(screen.getByText('Edição aplicada')).toBeInTheDocument();
  });

  test('botão "📋 Copiar" copia versão editada após aplicar edição local', async () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = { 'script.js': 'console.log("original");' };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo script.js'), {
      target: { value: 'console.log("editado");' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '📋 Copiar' }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith('console.log("editado");');
    });
  });

  test('"📋 Copiar tudo" usa conteúdo editado quando existir e original quando não houver edição', async () => {
    const preview = buildPreview(['index.html', 'style.css']);
    preview.summary.fileContents = {
      'index.html': '<html>original</html>',
      'style.css': 'body{color:#000;}',
    };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('index.html')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo index.html'), {
      target: { value: '<html>editado</html>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    fireEvent.click(screen.getByRole('button', { name: /copiar tudo/i }));

    await waitFor(() => {
      const copied = writeTextMock.mock.calls[writeTextMock.mock.calls.length - 1][0];
      expect(copied).toContain('--- index.html ---\n\n<html>editado</html>');
      expect(copied).toContain('--- style.css ---\n\nbody{color:#000;}');
    });
  });

  test('restaurar original repõe conteúdo inicial e exibe feedback', async () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = { 'script.js': 'console.log("original");' };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo script.js'), {
      target: { value: 'console.log("editado");' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar original' }));

    expect(screen.getByLabelText('Editor local do arquivo script.js')).toHaveValue('console.log("original");');
    expect(screen.getByText('Original restaurado')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '📋 Copiar' }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith('console.log("original");');
    });
  });

  test('cancelar edição fecha editor sem aplicar e mostra feedback', async () => {
    const preview = buildPreview(['script.js']);
    preview.summary.fileContents = { 'script.js': 'console.log("original");' };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo script.js'), {
      target: { value: 'console.log("cancelado");' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Editor local do arquivo script.js')).not.toBeInTheDocument();
    expect(screen.getByText('Edição cancelada')).toBeInTheDocument();

    fireEvent.click(within(getFileItem('script.js')).getByRole('button', { name: '📋 Copiar' }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith('console.log("original");');
    });
  });

  test('não mostra "✏️ Editar" para binário, sem conteúdo textual, manifest.json e logs/*', () => {
    const preview = buildPreview(['index.html', 'logo.png', 'manifest.json', 'logs/run.log', 'script.js']);
    preview.summary.files = [
      { path: 'index.html', size: 100, type: 'text/html' },
      { path: 'logo.png', size: 50, type: 'image/png' },
      { path: 'manifest.json', size: 30, type: 'application/json' },
      { path: 'logs/run.log', size: 10, type: 'text/plain' },
      { path: 'script.js', size: 80, type: 'application/javascript' },
    ];
    preview.summary.fileContents = {
      'index.html': '<html>ok</html>',
      'manifest.json': '{"name":"app"}',
      'logs/run.log': 'linha',
    };
    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    expect(within(getFileItem('index.html')).getByRole('button', { name: '✏️ Editar' })).toBeInTheDocument();
    expect(within(getFileItem('logo.png')).queryByRole('button', { name: '✏️ Editar' })).not.toBeInTheDocument();
    expect(within(getFileItem('manifest.json')).queryByRole('button', { name: '✏️ Editar' })).not.toBeInTheDocument();
    expect(within(getFileItem('logs/run.log')).queryByRole('button', { name: '✏️ Editar' })).not.toBeInTheDocument();
    expect(within(getFileItem('script.js')).queryByRole('button', { name: '✏️ Editar' })).not.toBeInTheDocument();
  });

  test('renderiza painel de rastreabilidade observacional read-only com fallback conservador', () => {
    render(<ArtifactPreviewPanel preview={buildPreview()} onRevision={jest.fn()} onDecision={jest.fn()} />);

    expect(screen.getByTestId('artifact-observability-panel')).toBeInTheDocument();
    expect(screen.getByText(/rastreabilidade observacional \(read-only\)/i)).toBeInTheDocument();
    expect(screen.getByText(/não executa artefato/i)).toBeInTheDocument();
    expect(screen.getByText(/traceId:/i)).toBeInTheDocument();
    expect(screen.getByText(/indisponível no payload seguro atual/i)).toBeInTheDocument();
    expect(screen.getByText(/flag de checksum:/i)).toBeInTheDocument();
    expect(screen.getByText(/indisponível neste preview/i)).toBeInTheDocument();
    expect(screen.getByText(/hasFeedback:/i)).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  test('painel observacional exibe metadados seguros quando traceId/checksum estão disponíveis', () => {
    const preview = buildPreview();
    preview.summary.origin.traceId = 'trace-xyz-001';
    preview.summary.checksum = 'sha256:abc123';
    preview.decision = 'approved';
    preview.feedback = 'Feedback humano detalhado';

    render(<ArtifactPreviewPanel preview={preview} onRevision={jest.fn()} onDecision={jest.fn()} />);

    expect(screen.getByText('trace-xyz-001')).toBeInTheDocument();
    expect(screen.getByText(/presente/i)).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  test('download sem edição local usa delivery.zipBase64 e não chama builder client-side', () => {
    const buildZipSpy = jest.spyOn(clientZipBuilder, 'buildZipBlobFromTextFiles');
    const atobSpy = jest.spyOn(global, 'atob');
    const preview = buildPreview(['index.html']);
    preview.decision = 'approved';
    preview.summary.fileContents = { 'index.html': '<html>original</html>' };
    const delivery = { zipBase64: Buffer.from('ORIGINAL_ZIP_BYTES', 'binary').toString('base64') };

    render(<ArtifactPreviewPanel preview={preview} delivery={delivery} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /baixar artefato/i }));

    expect(buildZipSpy).not.toHaveBeenCalled();
    expect(atobSpy).toHaveBeenCalledWith(delivery.zipBase64);
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
  });

  test('download com edição local reproduzível gera ZIP client-side com conteúdo editado e original', async () => {
    const buildZipSpy = jest.spyOn(clientZipBuilder, 'buildZipBlobFromTextFiles');
    const preview = buildPreview(['index.html', 'style.css', 'manifest.json', 'logs/generation.log']);
    preview.decision = 'approved';
    preview.summary.fileContents = {
      'index.html': '<html>original</html>',
      'style.css': 'body { color: #000; }',
      'manifest.json': '{"checksum":"sha256:abc"}',
      'logs/generation.log': 'original log',
    };
    const delivery = { zipBase64: Buffer.from('ORIGINAL_ZIP_BYTES', 'binary').toString('base64') };

    render(<ArtifactPreviewPanel preview={preview} delivery={delivery} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('index.html')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo index.html'), {
      target: { value: '<html>editado</html>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    expect(screen.getByText(/a exportação incluirá as edições locais aplicadas neste preview/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /baixar artefato/i }));

    expect(buildZipSpy).toHaveBeenCalledTimes(1);
    expect(buildZipSpy).toHaveBeenCalledWith({
      'index.html': '<html>editado</html>',
      'style.css': 'body { color: #000; }',
      'manifest.json': '{"checksum":"sha256:abc"}',
      'logs/generation.log': 'original log',
    });
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
  });

  test('fail-closed com arquivo sem conteúdo textual: mantém download original e mostra aviso', () => {
    const buildZipSpy = jest.spyOn(clientZipBuilder, 'buildZipBlobFromTextFiles');
    const atobSpy = jest.spyOn(global, 'atob');
    const preview = buildPreview(['index.html', 'logo.png']);
    preview.decision = 'approved';
    preview.summary.files = [
      { path: 'index.html', size: 100, type: 'text/html' },
      { path: 'logo.png', size: 200, type: 'image/png' },
    ];
    preview.summary.fileContents = {
      'index.html': '<html>original</html>',
    };
    const delivery = { zipBase64: Buffer.from('ORIGINAL_ZIP_BYTES', 'binary').toString('base64') };

    render(<ArtifactPreviewPanel preview={preview} delivery={delivery} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('index.html')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo index.html'), {
      target: { value: '<html>editado</html>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    expect(screen.getByText(/não permite zip editado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /baixar artefato/i }));

    expect(buildZipSpy).not.toHaveBeenCalled();
    expect(atobSpy).toHaveBeenCalledWith(delivery.zipBase64);
    expect(screen.getByText(/zip com edições locais indisponível; baixando artefato original/i)).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
  });

  test('erro ao gerar ZIP editado não quebra painel e mostra aviso sem download', () => {
    jest.spyOn(clientZipBuilder, 'buildZipBlobFromTextFiles').mockImplementation(() => {
      throw new Error('zip-error');
    });
    const preview = buildPreview(['index.html']);
    preview.decision = 'approved';
    preview.summary.fileContents = {
      'index.html': '<html>original</html>',
    };
    const delivery = { zipBase64: Buffer.from('ORIGINAL_ZIP_BYTES', 'binary').toString('base64') };

    render(<ArtifactPreviewPanel preview={preview} delivery={delivery} onRevision={jest.fn()} onDecision={jest.fn()} />);

    fireEvent.click(within(getFileItem('index.html')).getByRole('button', { name: '✏️ Editar' }));
    fireEvent.change(screen.getByLabelText('Editor local do arquivo index.html'), {
      target: { value: '<html>editado</html>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar edição local' }));
    fireEvent.click(screen.getByRole('button', { name: /baixar artefato/i }));

    expect(screen.getByText(/falha ao gerar zip com edições locais/i)).toBeInTheDocument();
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });
});
