// api/_utils/plans.js
import meta from "./plans.json" assert { type: "json" };

// Mapeia os price_ids (ENV) para cada chave do JSON
const PRICE_IDS = {
  basic_br: process.env.R_BASIC,
  intermediate_br: process.env.R_INTER,
  premium_br: process.env.R_PREMIUM,
  basic_us: process.env.R_BASIC_US,
  intermediate_us: process.env.R_INTER_US,
  premium_us: process.env.R_PREMIUM_US,
};

const tierOf = (k) =>
  k.startsWith("basic") ? "basic" : k.startsWith("intermediate") ? "intermediate" : "premium";
const regionOf = (k) => (k.endsWith("_us") ? "US" : "BR");

export function getPlanByKey(key) {
  const plan = meta[key];
  if (!plan) return null;
  return {
    key,
    ...plan,
    tier: tierOf(key),
    region: regionOf(key),
    price_id: PRICE_IDS[key] || null,
  };
}

export function getPlanByLookup(lookup_key) {
  const lk = String(lookup_key || "").toLowerCase();
  const key = Object.keys(meta).find((k) => (meta[k].lookup_key || "").toLowerCase() === lk);
  return key ? getPlanByKey(key) : null;
}

export function listPlansByRegion(region = "BR") {
  const suffix = region.toUpperCase() === "US" ? "_us" : "_br";
  return Object.keys(meta)
    .filter((k) => k.endsWith(suffix))
    .map(getPlanByKey)
    .filter(Boolean);
}
