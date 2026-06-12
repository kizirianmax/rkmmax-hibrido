const DEFAULT_MAX_SRCDOC_BYTES = 256 * 1024;
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none';">`;

const REMOVED_TAG_PATTERNS = [
  { name: 'script', pattern: /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi },
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

function extractScheme(urlValue) {
  const match = String(urlValue || '').match(/^([a-z][a-z0-9+.-]*):/i);
  return match ? match[1].toLowerCase() : null;
}

function isSafeImageDataUrl(normalizedUrl) {
  return /^data:image\/(?:png|jpe?g|gif|webp|bmp|avif);base64,/i.test(normalizedUrl);
}

function isDangerousUrl(value, attributeName = '') {
  const normalized = normalizeUrlValue(value);
  if (!normalized) return false;

  const scheme = extractScheme(normalized);
  if (scheme) {
    if (scheme === 'javascript' || scheme === 'vbscript') return true;
    if (scheme === 'data') {
      const attr = String(attributeName || '').toLowerCase();
      const canUseImageData = attr === 'src' || attr === 'poster' || attr === 'srcset';
      return !(canUseImageData && isSafeImageDataUrl(normalized));
    }
    if (scheme === 'http' || scheme === 'https') return true;
  }

  return (
    normalized.startsWith('//')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:image/svg+xml')
  );
}

function isDangerousCssUrl(value) {
  const normalized = normalizeUrlValue(value).replace(/^['"]|['"]$/g, '');
  if (!normalized) return false;

  const scheme = extractScheme(normalized);
  if (scheme) {
    if (scheme === 'javascript' || scheme === 'vbscript') return true;
    if (scheme === 'data') {
      return !isSafeImageDataUrl(normalized);
    }
    if (scheme === 'http' || scheme === 'https') return true;
  }

  return (
    normalized.startsWith('//')
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
    if (isDangerousUrl(value, attr)) {
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

    if (candidates.some((candidate) => isDangerousUrl(candidate, 'srcset'))) {
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

function sanitizeEventHandlerAttributes(html, removed) {
  return html.replace(/<([a-z][a-z0-9:-]*)([^>]*)>/gi, (fullMatch, tagName, attrs = '') => {
    if (fullMatch.startsWith('</')) {
      return fullMatch;
    }

    const sanitizedAttrs = String(attrs).replace(
      /\s+([^\s=/>]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi,
      (attrMatch, attrName) => {
        if (String(attrName).toLowerCase().startsWith('on')) {
          addRemoval(removed, 'event-handler-attribute');
          return '';
        }
        return attrMatch;
      },
    );

    return `<${tagName}${sanitizedAttrs}>`;
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
  if (/\son[a-z0-9_-]+\s*=/i.test(normalized)) {
    return true;
  }
  return ['<script', 'javascript:', '<iframe', '<object', '<embed', '<form', '<base', 'http://', 'https://', '@import'].some((token) => normalized.includes(token));
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
  sanitizedHtml = sanitizeEventHandlerAttributes(sanitizedHtml, removed);
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
