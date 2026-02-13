/**
 * Health Check Endpoint
 * Verifica se Groq API está funcionando
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

    // Testar conexão com Groq (opcional)
    if (groqKey && req.query.test === 'true') {
      try {
        const testResponse = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${groqKey}`,
          },
        });

        status.providers.groq.apiStatus = testResponse.ok ? 'reachable' : 'error';
      } catch (error) {
        status.providers.groq.apiStatus = 'unreachable';
        status.providers.groq.error = error.message;
      }
    }

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
