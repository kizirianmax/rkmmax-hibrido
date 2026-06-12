const DEFAULT_MAX_SRCDOC_BYTES = 256 * 1024;
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none';">`;

const REMOVED_TAG_PATTERNS = [
  { name: 'script', pattern: /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi },
  { name: 'iframe', pattern: /<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi },
  { name: 'object', pattern: /<object\b[^>]*>[\s\S]*?<\/object\s*>/gi },
  { name: 'embed', pattern: /<embed\b[^>]*\/?\s*>/gi },
  { name: 'form', pattern: /<form\b[^>]*>[\s\S]*?<\/form\s*>/gi },
  { name: 'base', pattern: /<base\b[^>]*>/gi },
  { name: 'meta-refresh', pattern: /<meta\b(?=[^>]*http-equiv\s*=\s*(["'])?refresh\1)[^>]*>/gi },
];

const URL_ATTR_PATTERN = /\s+(src|href|action|poster)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const SRCSET_PATTERN = /\s+srcset\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const STYLE_ATTR_PATTERN = /\s+style\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const STYLE_BLOCK_PATTERN = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
const EVENT_HANDLER_ATTR_PATTERN = /\s+on[a-z0-9_-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function normalizeUrlValue(value) {
  return decodeHtmlEntities(String(value || '')).trim().replace(/\s+/g, '').toLowerCase();
}

function isDangerousUrl(value) {
  const normalized = normalizeUrlValue(value);
  if (!normalized) return false;

  return (
    normalized.startsWith('javascript:')
    || normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('//')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:image/svg+xml')
  );
}

function isDangerousCssUrl(value) {
  const normalized = normalizeUrlValue(value).replace(/^['"]|['"]$/g, '');
  if (!normalized) return false;

  return (
    normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('//')
    || normalized.startsWith('javascript:')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:image/svg+xml')
  );
}

function addRemoval(removed, name) {
  if (!removed.includes(name)) {
    removed.push(name);
  }
}

function removeForbiddenTags(html, removed) {
  let result = html;

  for (const { name, pattern } of REMOVED_TAG_PATTERNS) {
    if (pattern.test(result)) {
      addRemoval(removed, name);
      result = result.replace(pattern, '');
    }
    pattern.lastIndex = 0;
  }

  return result;
}

function sanitizeUrlAttributes(html, removed) {
  return html.replace(URL_ATTR_PATTERN, (match, attr, fullValue, dqValue, sqValue, bareValue) => {
    const value = dqValue ?? sqValue ?? bareValue ?? '';
    if (isDangerousUrl(value)) {
      addRemoval(removed, `${String(attr).toLowerCase()}-dangerous-url`);
      return '';
    }
    return match;
  });
}

function sanitizeSrcSetAttribute(html, removed) {
  return html.replace(SRCSET_PATTERN, (match, fullValue, dqValue, sqValue, bareValue) => {
    const value = dqValue ?? sqValue ?? bareValue ?? '';
    const candidates = value
      .split(',')
      .map((entry) => entry.trim().split(/\s+/)[0])
      .filter(Boolean);

    if (candidates.some((candidate) => isDangerousUrl(candidate))) {
      addRemoval(removed, 'srcset-dangerous-url');
      return '';
    }

    return match;
  });
}

function sanitizeStyleAttribute(html, removed) {
  return html.replace(STYLE_ATTR_PATTERN, (match, fullValue, dqValue, sqValue, bareValue) => {
    const value = dqValue ?? sqValue ?? bareValue ?? '';
    const normalized = String(value).toLowerCase();

    if (normalized.includes('@import') || /url\s*\(/i.test(normalized)) {
      addRemoval(removed, 'style-attr-unsafe-url');
      return '';
    }

    return match;
  });
}

function sanitizeStyleBlocks(html, removed) {
  return html.replace(STYLE_BLOCK_PATTERN, (fullMatch, cssContent = '') => {
    let safeCss = cssContent;

    if (/@import/i.test(safeCss)) {
      addRemoval(removed, 'style-tag-import-removed');
      safeCss = safeCss.replace(/@import[^;]*;?/gi, '');
    }

    safeCss = safeCss.replace(/url\(([^)]*)\)/gi, (urlMatch, rawUrl = '') => {
      if (isDangerousCssUrl(rawUrl)) {
        addRemoval(removed, 'style-tag-remote-url-removed');
        return 'none';
      }
      return urlMatch;
    });

    return `<style>${safeCss}</style>`;
  });
}

function injectCspMeta(html) {
  if (/<meta\b(?=[^>]*http-equiv\s*=\s*(["'])?content-security-policy\1)[^>]*>/i.test(html)) {
    return html;
  }

  if (/<head\b[^>]*>/i.test(html)) {
    return html.replace(/<head\b[^>]*>/i, (headOpen) => `${headOpen}${CSP_META}`);
  }

  return `${CSP_META}${html}`;
}

function containsForbiddenTokens(html) {
  const normalized = String(html || '').toLowerCase();
  return [
    '<script',
    'onerror=',
    'onclick=',
    'onload=',
    'javascript:',
    '<iframe',
    '<object',
    '<embed',
    '<form',
    '<base',
    'http://',
    'https://',
    '@import',
  ].some((token) => normalized.includes(token));
}

export function sanitizeConstructorStaticPreviewHtml(inputHtml, options = {}) {
  const maxSrcdocBytes = Number.isFinite(options?.maxSrcdocBytes)
    ? Math.max(1, Math.floor(options.maxSrcdocBytes))
    : DEFAULT_MAX_SRCDOC_BYTES;

  if (typeof inputHtml !== 'string' || inputHtml.trim().length === 0) {
    return {
      ok: false,
      html: '',
      reason: 'invalid-input-html',
      removed: [],
    };
  }

  if (inputHtml.length > maxSrcdocBytes) {
    return {
      ok: false,
      html: '',
      reason: 'srcdoc-too-large',
      removed: [],
    };
  }

  const removed = [];
  let sanitizedHtml = inputHtml;

  sanitizedHtml = removeForbiddenTags(sanitizedHtml, removed);
  sanitizedHtml = sanitizedHtml.replace(EVENT_HANDLER_ATTR_PATTERN, () => {
    addRemoval(removed, 'event-handler-attribute');
    return '';
  });
  sanitizedHtml = sanitizeUrlAttributes(sanitizedHtml, removed);
  sanitizedHtml = sanitizeSrcSetAttribute(sanitizedHtml, removed);
  sanitizedHtml = sanitizeStyleAttribute(sanitizedHtml, removed);
  sanitizedHtml = sanitizeStyleBlocks(sanitizedHtml, removed);
  sanitizedHtml = injectCspMeta(sanitizedHtml);

  if (containsForbiddenTokens(sanitizedHtml)) {
    return {
      ok: false,
      html: '',
      reason: 'unsafe-tokens-remain',
      removed,
    };
  }

  if (sanitizedHtml.length > maxSrcdocBytes) {
    return {
      ok: false,
      html: '',
      reason: 'srcdoc-too-large',
      removed,
    };
  }

  return {
    ok: true,
    html: sanitizedHtml,
    removed,
  };
}

export { DEFAULT_MAX_SRCDOC_BYTES };
