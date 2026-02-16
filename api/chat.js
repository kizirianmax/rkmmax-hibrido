import { serginho } from '../src/api/serginhoOrchestrator.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ✅ ALL requests go through Serginho
    const result = await serginho.handleRequest(message, {
      sessionId: sessionId || 'default',
      systemPrompt: 'You are Serginho, an intelligent AI assistant.'
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message });
  }
}
