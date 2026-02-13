/**
 * Health Check Endpoint
 * Verifica configuração do Groq API (não faz chamadas reais à API por segurança)
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const groqKey = process.env.GROQ_API_KEY;
    
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      providers: {
        groq: {
          configured: !!groqKey,
          models: {
            primary: 'openai/gpt-oss-120b',
            fallback: 'llama-3.3-70b-versatile',
          },
        },
      },
    };

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
