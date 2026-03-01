// api/admin.js
// Função consolidada: prices + me-plan + send-email
// Rota: /api/admin?action=prices|me-plan|send-email
// Mantém retrocompatibilidade via /api/prices, /api/me-plan, /api/send-email (rewrites no vercel.json)

import Stripe from "stripe";
import { Resend } from "resend";

/* ─────────────────────────────────────────────
   CORS helper
───────────────────────────────────────────── */
function applyCORS(req, res, methods = "GET,HEAD,POST,OPTIONS") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-email, X-User-Email");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

/* ─────────────────────────────────────────────
   PRICES handler
───────────────────────────────────────────── */
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey) : null;

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

async function handlePrices(req, res) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const region = (req.query.region || "BR").toUpperCase();
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
    const regional = list.data.filter((p) => matchesRegion(p, region));
    const tiers = ["basic", "intermediate", "premium"];
    const labels =
      region === "US"
        ? { basic: "Basic", intermediate: "Intermediate", premium: "Premium" }
        : { basic: "Básico", intermediate: "Intermediário", premium: "Premium" };
    const resultados = tiers
      .map((tier) => {
        const candidates = regional.filter((p) => matchesTier(p, tier));
        if (candidates.length === 0) return null;
        const chosen = candidates.reduce(
          (acc, p) => (!acc || (p.unit_amount || 0) < (acc.unit_amount || 0) ? p : acc),
          null
        );
        const currency = (chosen.currency || (region === "US" ? "USD" : "BRL")).toUpperCase();
        const locale = region === "US" ? "en-US" : "pt-BR";
        return {
          id: chosen.id,
          tier,
          nome: labels[tier],
          produto: chosen.product?.name || labels[tier],
          descricao: chosen.product?.description || "",
          moeda: currency,
          intervalo: chosen.recurring?.interval || "month",
          valor_centavos: chosen.unit_amount || 0,
          valor_formatado: fmtMoney(chosen.unit_amount, currency, locale),
          lookup_key: chosen.lookup_key || null,
          metadata: { region: chosen.metadata?.region || null, ...(chosen.metadata || {}) },
        };
      })
      .filter(Boolean);
    if (resultados.length === 0) {
      return res.status(404).json({ error: "Nenhum plano encontrado para a região.", region });
    }
    return res.status(200).json({ region, planos: resultados });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/* ─────────────────────────────────────────────
   ME-PLAN handler
───────────────────────────────────────────── */
const FALLBACK_PLAN = "basic";

async function handleMePlan(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const emailHeader = req.headers["x-user-email"] || req.headers["X-User-Email"];
  const email = (emailHeader || req.query?.email || "").toString().trim().toLowerCase();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({
      userPlan: FALLBACK_PLAN,
      reason: "fallback_no_supabase_env",
      email: email || undefined,
    });
  }
  if (!email) {
    return res.status(200).json({ userPlan: "basic", reason: "missing_email" });
  }
  let createClient;
  try {
    ({ createClient } = await import("@supabase/supabase-js"));
  } catch {
    return res.status(200).json({
      userPlan: FALLBACK_PLAN,
      reason: "supabase_js_not_installed",
      email: email || undefined,
    });
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status, stripe_price_id, current_period_end")
      .eq("email", email)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(200).json({ userPlan: "basic", reason: "no_subscription" });
    const isActive = ["active", "trialing"].includes(data.status);
    if (!isActive) return res.status(200).json({ userPlan: "basic", reason: "inactive" });
    return res.status(200).json({
      userPlan: "premium",
      current_period_end: data.current_period_end,
      price_id: data.stripe_price_id,
    });
  } catch (e) {
    return res.status(500).json({ userPlan: "basic", error: String(e) });
  }
}

/* ─────────────────────────────────────────────
   SEND-EMAIL handler
───────────────────────────────────────────── */
async function handleSendEmail(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
    if (!RESEND_API_KEY) {
      return res.status(500).json({ ok: false, error: "RESEND_API_KEY não configurada. Adicione no Vercel." });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { to, subject, html, text } = body;
    if (!to || !subject) {
      return res.status(400).json({ ok: false, error: "Missing required fields: to, subject" });
    }
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, ""),
    });
    if (error) {
      return res.status(400).json({ ok: false, error: error.message || "Erro ao enviar e-mail" });
    }
    return res.status(200).json({
      ok: true,
      message: "Email sent successfully",
      emailId: data.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "Internal server error" });
  }
}

/* ─────────────────────────────────────────────
   ROUTER principal
───────────────────────────────────────────── */
export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  // Detecta ação via query param ou path (ex: /api/admin?action=prices)
  const action = req.query.action || "";

  switch (action) {
    case "prices":
      return handlePrices(req, res);
    case "me-plan":
      return handleMePlan(req, res);
    case "send-email":
      return handleSendEmail(req, res);
    default:
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid action. Use ?action=prices|me-plan|send-email",
      });
  }
}
