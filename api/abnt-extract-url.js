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
 */

async function extractMetadata(url) {
  const response = await fetch(url, {
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

  const html = await response.text();

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
    ]) || new URL(url).hostname.replace(/^www\./, "");

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

  return { title, author, publishedDate, siteName, url, accessDate, year };
}

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

  let ref = "";
  if (formattedAuthor) ref += `${formattedAuthor}. `;
  if (title) ref += `**${title}**. `;
  if (siteName) ref += `${siteName}, `;
  ref += `${year}. `;
  ref += `Disponível em: ${url}. `;
  ref += `Acesso em: ${accessDate}.`;

  return ref;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ success: false, error: "URL é obrigatória." });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ success: false, error: "URL inválida." });
  }

  try {
    const data = await extractMetadata(url);
    const abntReference = generateABNTReference(data);
    return res.status(200).json({ success: true, data, abntReference });
  } catch (err) {
    console.error("[ABNT-EXTRACT-URL] error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Erro ao extrair metadados.",
    });
  }
}
