import { serginho } from '../src/api/serginhoOrchestrator.js';
import { specialists } from '../src/config/specialists.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { specialistId, message, sessionId } = req.body;

    // Find specialist
    const specialist = specialists[specialistId];
    if (!specialist) {
      return res.status(404).json({ error: 'Specialist not found' });
    }

    // ✅ Use Serginho with specialist-specific system prompt
    const result = await serginho.handleRequest(message, {
      sessionId: `specialist-${specialistId}-${sessionId || 'default'}`,
      systemPrompt: specialist.systemPrompt,
      temperature: specialist.temperature || 0.7
    });

    return res.status(200).json({
      ...result,
      specialist: {
        id: specialist.id,
        name: specialist.name,
        category: specialist.category
      }
    });

  } catch (error) {
    console.error('Specialist chat error:', error);
    return res.status(500).json({ error: error.message });
  }
}
