import { serginho } from '../src/api/serginhoOrchestrator.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    // ✅ Betinho Hybrid Mode (parallel execution)
    const result = await serginho.handleRequest(message, {
      mode: 'betinho-hybrid',
      sessionId: sessionId || 'hybrid-session'
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Hybrid error:', error);
    return res.status(500).json({ error: error.message });
  }
}
