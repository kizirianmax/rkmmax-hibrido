import { buildZipBlobFromTextFiles, buildZipBytesFromTextFiles } from '../clientZipBuilder.jsx';

describe('clientZipBuilder', () => {
  test('gera bytes de ZIP com assinatura PK\\x03\\x04', () => {
    const bytes = buildZipBytesFromTextFiles({ 'index.html': '<h1>ok</h1>' });
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  test('inclui todos os paths do filesMap, inclusive aninhados', () => {
    const bytes = buildZipBytesFromTextFiles({
      'index.html': '<h1>ok</h1>',
      'logs/generation.log': 'linha 1',
      'manifest.json': '{"version":"1.0.0"}',
    });

    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('index.html');
    expect(text).toContain('logs/generation.log');
    expect(text).toContain('manifest.json');
    expect(text).toContain('<h1>ok</h1>');
    expect(text).toContain('linha 1');
  });

  test('é determinístico para a mesma entrada', () => {
    const files = {
      'style.css': 'body{margin:0;}',
      'index.html': '<html>ok</html>',
    };

    const first = buildZipBytesFromTextFiles(files);
    const second = buildZipBytesFromTextFiles(files);
    expect(Array.from(first)).toEqual(Array.from(second));
  });

  test('buildZipBlobFromTextFiles retorna blob zip não vazio', async () => {
    const blob = buildZipBlobFromTextFiles({ 'README.md': '# teste' });
    expect(blob.type).toBe('application/zip');
    const buffer = await blob.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
