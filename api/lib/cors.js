/**
 * CORS restrito para endpoints de IA do RKMMAX
 * Substitui o antigo Access-Control-Allow-Origin: "*"
 */

// Domínios permitidos do projeto RKMMAX
const ALLOWED_ORIGINS = [
  'https://kizirianmax.site',
  'https://www.kizirianmax.site',
  'https://rkmmax-app.vercel.app',
];

// Em desenvolvimento, permitir localhost
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
  const devOrigins = ['http://localhost:3000', 'http://localhost:5173'];
  for (const origin of devOrigins) {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      ALLOWED_ORIGINS.push(origin);
    }
  }
}

/**
 * Aplica política CORS restrita à resposta.
 * Retorna true se a requisição foi tratada (OPTIONS preflight) — o caller deve retornar.
 * Retorna false se a execução deve continuar.
 *
 * @param {object} req - Vercel/Node request
 * @param {object} res - Vercel/Node response
 * @returns {boolean}
 */
export function applyCorsRestricted(req, res) {
  const origin = (req.headers && req.headers.origin) || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Se origin não bate, NÃO define o header — browser bloqueia

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // handled
  }
  return false; // continue
}
