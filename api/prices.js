// api/prices.js
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey) : null;

/* ------------------------ Helpers ------------------------ */
function allowCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

// sinônimos/aliases que reconhecemos por lookup_key, metadata.tier ou nome do produto
const TIER_ALIASES = {
  basic: ["basic", "básico"],
  intermediate: ["intermediate", "intermediario", "intermediário", "medio", "médio"],
  premium: ["premium"],
};

function matchesRegion(price, region) {
  const lk = (price.lookup_key || "").toLowerCase();
  const metaRegion = (price.metadata?.region || "").toLowerCase();
  return lk.startsWith(`rkm_${region.toLowerCase()}_`) || metaRegion === region.toLowerCase();
}

function matchesTier(price, tierKey) {
  const lk = (price.lookup_key || "").toLowerCase();
  const metaTier = (price.metadata?.tier || "").toLowerCase();
  const prodName = (price.product?.name || "").toLowerCase();
  const aliases = TIER_ALIASES[tierKey] || [tierKey];
  return aliases.some((a) => lk.includes(a) || metaTier === a || prodName.includes(a));
}

function fmtMoney(amount, currency, locale = "pt-BR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: (currency || "BRL").toUpperCase(),
    minimumFractionDigits: 2,
  }).format((amount || 0) / 100);
}

/* ------------------------ Handler ------------------------ */
export default async function handler(req, res) {
  if (allowCORS(req, res)) return;

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const region = (req.query.region || "BR").toUpperCase();

  // Fallback amigável se faltar ENV na Vercel
  if (!stripe) {
    return res.status(200).json({ region, planos: [], reason: "fallback_no_stripe_env" });
  }

  try {
    const list = await stripe.prices.list({
      active: true,
      type: "recurring",
      limit: 100,
      expand: ["data.product"],
    });

    // filtra por região (via lookup_key rkm_<REG>_* ou metadata.region)
    const regional = list.data.filter((p) => matchesRegion(p, region));

    // inclui o plano intermediário
    const tiers = ["basic", "intermediate", "premium"];
    const labels =
      region === "US"
        ? { basic: "Basic", intermediate: "Intermediate", premium: "Premium" }
        : { basic: "Básico", intermediate: "Intermediário", premium: "Premium" };

    const resultados = tiers
      .map((tier) => {
        const candidates = regional.filter((p) => matchesTier(p, tier));
        if (candidates.length === 0) return null;

        // escolhe o mais barato do tier
        const chosen = candidates.reduce(
          (acc, p) => (!acc || (p.unit_amount || 0) < (acc.unit_amount || 0) ? p : acc),
          null
        );

        const currency = (chosen.currency || (region === "US" ? "USD" : "BRL")).toUpperCase();
        const locale = region === "US" ? "en-US" : "pt-BR";

        return {
          id: chosen.id,
          tier, // "basic" | "intermediate" | "premium"
          nome: labels[tier],
          produto: chosen.product?.name || labels[tier],
          descricao: chosen.product?.description || "",
          moeda: currency,
          intervalo: chosen.recurring?.interval || "month",
          valor_centavos: chosen.unit_amount || 0,
          valor_formatado: fmtMoney(chosen.unit_amount, currency, locale),
          lookup_key: chosen.lookup_key || null,
          metadata: {
            region: chosen.metadata?.region || null,
            ...(chosen.metadata || {}),
          },
        };
      })
      .filter(Boolean);

    if (resultados.length === 0) {
      return res.status(404).json({ error: "Nenhum plano encontrado para a região.", region });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ region, planos: resultados });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
