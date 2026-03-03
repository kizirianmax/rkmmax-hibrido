export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const groqKey = !!process.env.GROQ_API_KEY;
  const geminiKey = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY);

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
  });
}
