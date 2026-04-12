/**
 * Verificação JWT Supabase para endpoints de IA do RKMMAX
 *
 * Regra crítica — fail-closed em produção:
 * - Se SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não existem em produção → REJEITAR (503)
 * - Somente em desenvolvimento local puro (NODE_ENV !== 'production' E VERCEL_ENV ausente),
 *   quando as env vars estão ausentes, é permitido prosseguir sem auth para não quebrar dev local.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Verifica o JWT Supabase do header Authorization.
 *
 * @param {object} req - Vercel/Node request
 * @returns {Promise<{ user: object|null, error: string|null }>}
 */
export async function verifyAuth(req) {
  const headers = req.headers || {};
  const authHeader = headers.authorization || headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // FAIL-CLOSED em produção:
  // Na Vercel, VERCEL_ENV sempre existe ('production', 'preview', 'development').
  // Somente quando ambas estão ausentes (dev local puro) o fallback permissivo se aplica.
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL_ENV;

  if (!token) {
    // Dev local puro sem Supabase configurado — permitir para não bloquear desenvolvimento/testes
    if (!isProduction && !supabaseUrl && !supabaseServiceKey) {
      return { user: { id: 'dev-local', email: 'dev@localhost' }, error: null };
    }
    return { user: null, error: 'missing_token' };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    if (isProduction) {
      // Em produção, se não pode verificar, REJEITAR
      return { user: null, error: 'auth_unavailable' };
    }
    // Dev local sem Supabase configurado → permitir para não bloquear desenvolvimento
    return { user: { id: 'dev-local', email: 'dev@localhost' }, error: null };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return { user: null, error: 'invalid_token' };
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return { user: null, error: 'auth_error' };
  }
}
