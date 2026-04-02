import { PROVIDERS, MODEL_METADATA, getEnabledProviders, getWeightedProviders } from './lib/providers-config.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const groqKey = !!process.env.GROQ_API_KEY;
  const geminiKey = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY);

  const enabledProviders = getEnabledProviders();
  const weightedProviders = getWeightedProviders();
  const primaryProvider = weightedProviders[0] || null;

  const models = enabledProviders.reduce((acc, name) => {
    const config = PROVIDERS[name];
    if (!config) return acc;
    const meta = MODEL_METADATA[name] || {};
    acc.push({
      id: name,
      model: config.model,
      tier: config.tier,
      displayName: meta.displayName || name,
      icon: meta.icon || '🤖',
      infrastructure: config.type,
    });
    return acc;
  }, []);

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({
    status: 'ok',
    service: 'rkmmax-hibrido',
    version: 'health-v1',
    environment: process.env.NODE_ENV || process.env.VERCEL_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'unknown',
    providers: {
      groq: groqKey,
      gemini: geminiKey,
      groqOnly: groqKey && !geminiKey,
    },
    models,
    primaryProvider,
  });
}
