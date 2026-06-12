import {
  DEFAULT_MAX_SRCDOC_BYTES,
  sanitizeConstructorStaticPreviewHtml,
} from '../constructorStaticPreviewSanitizer.js';

describe('constructorStaticPreviewSanitizer', () => {
  test('preserva HTML/CSS seguro', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<html><head><style>body{color:#111;}</style></head><body><h1>OK</h1></body></html>');

    expect(result.ok).toBe(true);
    expect(result.html).toContain('<h1>OK</h1>');
    expect(result.html).toContain('body{color:#111;}');
  });

  test('remove <script>', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<html><body><script>alert(1)</script><p>x</p></body></html>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('<script');
  });

  test('remove onclick, onerror e onload', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<img src="data:image/png;base64,AA==" onclick="x()" onerror="y()" onload="z()">');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('onclick=');
    expect(result.html.toLowerCase()).not.toContain('onerror=');
    expect(result.html.toLowerCase()).not.toContain('onload=');
  });

  test('remove javascript: em href/src', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<a href="javascript:alert(1)">x</a><img src="javascript:alert(2)">');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('javascript:');
  });

  test('remove <iframe>, <object>, <embed>, <form>', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<iframe></iframe><object></object><embed src="x"><form action="/"></form><div>ok</div>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('<iframe');
    expect(result.html.toLowerCase()).not.toContain('<object');
    expect(result.html.toLowerCase()).not.toContain('<embed');
    expect(result.html.toLowerCase()).not.toContain('<form');
  });

  test('remove <base>', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<head><base href="https://evil.com"></head><body>ok</body>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('<base');
  });

  test('remove <meta http-equiv="refresh">', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<head><meta http-equiv="refresh" content="0;url=https://evil.com"></head><body>ok</body>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('http-equiv="refresh"');
  });

  test('bloqueia URLs remotas http:// e https://', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<img src="https://evil.com/x.png"><a href="http://evil.com">x</a>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('http://');
    expect(result.html.toLowerCase()).not.toContain('https://');
  });

  test('bloqueia URLs protocolo-relativas', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<img src="//evil.com/x.png">');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('//evil.com');
  });

  test('bloqueia CSS @import remoto', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<style>@import "https://evil.com/a.css"; body { color: red; }</style>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('@import');
  });

  test('bloqueia CSS url(http/https//) em style tag', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<style>.x{background:url(https://evil.com/a.png)}.y{background:url(http://evil.com/b.png)}.z{background:url(//evil.com/c.png)}</style>');

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('http://');
    expect(result.html.toLowerCase()).not.toContain('https://');
    expect(result.html.toLowerCase()).not.toContain('//evil.com');
  });

  test('srcdoc acima do limite retorna ok false', () => {
    const oversized = 'a'.repeat(DEFAULT_MAX_SRCDOC_BYTES + 1);
    const result = sanitizeConstructorStaticPreviewHtml(oversized);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('srcdoc-too-large');
  });

  test('inclui CSP defensiva no HTML final', () => {
    const result = sanitizeConstructorStaticPreviewHtml('<html><head></head><body>ok</body></html>');

    expect(result.ok).toBe(true);
    expect(result.html).toContain("default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none';");
  });

  test('html final não contém tokens perigosos', () => {
    const html = [
      '<html><head><meta http-equiv="refresh" content="0"></head><body>',
      '<script>alert(1)</script>',
      '<a href="javascript:alert(1)" onclick="x()">x</a>',
      '<img src="https://evil.com/x.png" onerror="y()">',
      '<iframe></iframe><object></object><embed src="x"><form></form><base href="//evil">',
      '<style>@import "https://evil.com/a.css";</style>',
      '</body></html>',
    ].join('');

    const result = sanitizeConstructorStaticPreviewHtml(html);

    expect(result.ok).toBe(true);
    expect(result.html.toLowerCase()).not.toContain('<script');
    expect(result.html.toLowerCase()).not.toContain('javascript:');
    expect(result.html.toLowerCase()).not.toContain('onclick=');
    expect(result.html.toLowerCase()).not.toContain('onerror=');
    expect(result.html.toLowerCase()).not.toContain('<iframe');
    expect(result.html.toLowerCase()).not.toContain('<object');
    expect(result.html.toLowerCase()).not.toContain('<embed');
    expect(result.html.toLowerCase()).not.toContain('<form');
    expect(result.html.toLowerCase()).not.toContain('<base');
    expect(result.html.toLowerCase()).not.toContain('http://');
    expect(result.html.toLowerCase()).not.toContain('https://');
    expect(result.html.toLowerCase()).not.toContain('@import');
  });

  test('rejeita entrada vazia ou não-string', () => {
    expect(sanitizeConstructorStaticPreviewHtml('').ok).toBe(false);
    expect(sanitizeConstructorStaticPreviewHtml(null).ok).toBe(false);
  });
});
