/**
 * api/abnt-extract-url.js
 *
 * Extrai metadados de uma URL (título, autor, data, site) e gera
 * referência ABNT formatada. Operação de scraping HTTP — sem IA,
 * sem chaves de API, sem fetch a providers externos de IA.
 *
 * Chamado por: src/components/abnt/URLImporter.jsx → POST /api/abnt-extract-url
 * Body: { url: string }
 * Response: { success: true, data: {...}, abntReference: string }
 *
 * Não viola A4 Gateway Sovereignty: não faz fetch a providers de IA.
 *
 * Segurança:
 *   - Apenas http/https permitidos (SSRF: sem file://, ftp://, etc.)
 *   - Hosts locais e ranges RFC1918 bloqueados (SSRF: sem localhost, 127.x, 10.x, etc.)
 *   - Validação DNS para bloquear DNS rebinding / SSRF via resolução
 *   - Limite de 2MB na resposta HTML
 */

import dns from "node:dns";
import net from "node:net";

// ─── DNS / IP HELPERS ────────────────────────────────────────────────────────

/**
 * Verifica se um endereço IP (v4 ou v6) pertence a ranges privados/loopback/link-local.
 */
function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 127 ||                                   // 127.0.0.0/8
      a === 10 ||                                    // 10.0.0.0/8
      a === 0 ||                                     // 0.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) ||           // 172.16.0.0/12
      (a === 192 && b === 168) ||                    // 192.168.0.0/16
      (a === 169 && b === 254)                       // 169.254.0.0/16
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||                             // loopback
      lower.startsWith("fc") ||                     // fc00::/7 unique local (fc and fd prefixes)
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||                    // fe80::/10 link-local
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    );
  }
  return false;
}

/**
 * Resolve o hostname via DNS e lança erro se qualquer IP resolvido for privado.
 */
async function validateDns(hostname) {
  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw Object.assign(new Error("Não foi possível resolver o domínio da URL."), { status: 400 });
  }
  if (addresses.some(({ address }) => isPrivateIP(address))) {
    throw Object.assign(
      new Error("URL não permitida: endereço resolve para IP privado."),
      { status: 400 },
    );
  }
}

// ─── SSRF GUARD ───────────────────────────────────────────────────────────────

/**
 * Valida a URL contra SSRF:
 * - Apenas protocolo http/https
 * - Bloqueia localhost, 127.x, ::1, 0.0.0.0
 * - Bloqueia ranges RFC1918: 10.x, 172.16-31.x, 192.168.x
 * - Bloqueia link-local: 169.254.x
 * Retorna a URL validada ou lança erro com mensagem clara.
 */
function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error("URL inválida."), { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw Object.assign(new Error("URL não permitida: apenas http/https são aceitos."), { status: 400 });
  }

  const hostname = parsed.hostname.toLowerCase();

  // Bloquear hosts literais
  const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "::1", "0.0.0.0", "[::1]"];
  if (BLOCKED_HOSTS.includes(hostname)) {
    throw Object.assign(new Error("URL não permitida."), { status: 400 });
  }

  // Bloquear ranges RFC1918 e link-local por regex
  const PRIVATE_RANGES = [
    /^127\./,           // 127.0.0.0/8
    /^10\./,            // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12
    /^192\.168\./,      // 192.168.0.0/16
    /^169\.254\./,      // 169.254.0.0/16 (link-local)
    /^0\./,             // 0.0.0.0/8
    /^::1$/,            // IPv6 loopback
    /^fc00:/,           // IPv6 unique local
    /^fe80:/,           // IPv6 link-local
  ];

  if (PRIVATE_RANGES.some((re) => re.test(hostname))) {
    throw Object.assign(new Error("URL não permitida."), { status: 400 });
  }

  return parsed.href; // URL normalizada e segura
}

// ─── EXTRAÇÃO DE METADADOS ────────────────────────────────────────────────────

async function extractMetadata(safeUrl) {
  await validateDns(new URL(safeUrl).hostname);

  const response = await fetch(safeUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao acessar a URL`);
  }

  const MAX_BODY = 2 * 1024 * 1024; // 2 MB

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY) {
    throw Object.assign(new Error("Resposta muito grande (limite: 2 MB)."), { status: 400 });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY) {
      await reader.cancel();
      throw Object.assign(new Error("Resposta muito grande (limite: 2 MB)."), { status: 400 });
    }
    chunks.push(value);
  }

  const html = decoder.decode(
    (() => {
      const buf = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        buf.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return buf;
    })(),
  );

  const get = (patterns) => {
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return "";
  };

  const title = get([
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ]);

  const author = get([
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']author["']/i,
    /<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["']/i,
  ]);

  const rawDate = get([
    /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i,
    /<time[^>]*datetime=["']([^"']+)["']/i,
  ]);

  const siteName =
    get([
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i,
    ]) || new URL(safeUrl).hostname.replace(/^www\./, "");

  let publishedDate = "";
  const year = rawDate
    ? (() => {
        try {
          return new Date(rawDate).getFullYear().toString();
        } catch {
          return new Date().getFullYear().toString();
        }
      })()
    : new Date().getFullYear().toString();

  if (rawDate) {
    try {
      publishedDate = new Date(rawDate).toLocaleDateString("pt-BR");
    } catch {
      publishedDate = rawDate;
    }
  }

  const accessDate = new Date().toLocaleDateString("pt-BR");

  return { title, author, publishedDate, siteName, url: safeUrl, accessDate, year };
}

// ─── GERAÇÃO DE REFERÊNCIA ABNT ───────────────────────────────────────────────

function generateABNTReference(data) {
  const { author, title, siteName, year, url, accessDate } = data;

  let formattedAuthor = "";
  if (author) {
    const parts = author.trim().split(" ");
    if (parts.length > 1) {
      const last = parts.pop().toUpperCase();
      formattedAuthor = `${last}, ${parts.join(" ")}`;
    } else {
      formattedAuthor = author.toUpperCase();
    }
  }

  // authorPrefix garante que não saia ". " no começo quando não há autor
  const authorPrefix = formattedAuthor ? `${formattedAuthor}. ` : "";

  let ref = authorPrefix;
  if (title) ref += `${title}. `;   // sem ** — texto ABNT puro
  if (siteName) ref += `${siteName}, `;
  ref += `${year}. `;
  ref += `Disponível em: ${url}. `;
  ref += `Acesso em: ${accessDate}.`;

  return ref;
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ success: false, error: "URL é obrigatória." });
  }

  // Validação SSRF — lança erro com .status se inválida
  let safeUrl;
  try {
    safeUrl = validateUrl(url);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, error: err.message });
  }

  try {
    const data = await extractMetadata(safeUrl);
    const abntReference = generateABNTReference(data);
    return res.status(200).json({ success: true, data, abntReference });
  } catch (err) {
    console.error("[ABNT-EXTRACT-URL] error:", err.message);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || "Erro ao extrair metadados.",
    });
  }
}
