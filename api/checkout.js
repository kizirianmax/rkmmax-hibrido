// api/checkout.js
import Stripe from "stripe";

// CORS + preflight
function applyCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Se não tiver STRIPE configurado ainda, responde de forma segura
  if (!process.env.STRIPE_SECRET_KEY_RKMMAX) {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    return res.status(200).json({
      ok: true,
      reason: "fallback_no_stripe_env",
      would_create: { lookupKey: body.lookupKey },
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_RKMMAX, {
    apiVersion: "2024-06-20",
  });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { lookupKey } = body;

    if (!lookupKey) {
      return res.status(400).json({ ok: false, error: "Missing lookupKey" });
    }

    // Encontra o price pelo lookup_key (igual ao Netlify)
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
      expand: ["data.product"],
    });
    const price = prices.data?.[0];
    if (!price) {
      return res.status(404).json({ ok: false, error: "Price not found for lookupKey" });
    }

    // Descobre o site base
    const proto = (req.headers["x-forwarded-proto"] || "https").toString();
    const hostHdr = req.headers["x-forwarded-host"] || req.headers.host;
    const vercelHost = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
    const site = process.env.SITE_URL || process.env.URL || vercelHost || `${proto}://${hostHdr}`;

    const successUrl = `${site}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${site}/pricing`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { lookup_key: lookupKey },
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
}
