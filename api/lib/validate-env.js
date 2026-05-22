/**
 * 🔍 ENVIRONMENT VALIDATION - Validação de variáveis de ambiente
 * 
 * Valida todas as variáveis necessárias no startup
 */

const REQUIRED_VARS = [
  // Não há variáveis OBRIGATÓRIAS - sistema funciona com o que estiver disponível
];

const RECOMMENDED_VARS = [
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE',
  'STRIPE_SECRET_KEY_RKMMAX',
  'GITHUB_TOKEN',
  'REACT_APP_SENTRY_DSN',
  'REACT_APP_POSTHOG_KEY',
];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Avisar sobre variáveis recomendadas faltando
  const missingRecommended = RECOMMENDED_VARS.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:', missingRecommended.join(', '));
  }

  return {
    valid: true,
    missing: missingRecommended,
    warnings: missingRecommended.length > 0 ? `${missingRecommended.length} recommended variables missing` : null,
  };
}

export function getEnvStatus() {
  return {
    // AI Providers (multi-provider: Groq + Gemini, orchestrated by Serginho)
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    
    // Supabase
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    REACT_APP_SUPABASE_URL: !!process.env.REACT_APP_SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
    
    // Payment
    STRIPE_SECRET_KEY_RKMMAX: !!process.env.STRIPE_SECRET_KEY_RKMMAX,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    
    // GitHub
    GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
    GITHUB_REPO: !!process.env.GITHUB_REPO,
    
    // Observability
    REACT_APP_SENTRY_DSN: !!process.env.REACT_APP_SENTRY_DSN,
    REACT_APP_POSTHOG_KEY: !!process.env.REACT_APP_POSTHOG_KEY,
    
    // Email
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  };
}
