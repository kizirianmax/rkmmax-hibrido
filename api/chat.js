import { serginho } from '../src/api/serginhoOrchestrator.js';

// ✅ GENIUS PROMPTS with robust fallback
let buildGeniusPrompt;
try {
  const geniusModule = await import('../src/prompts/geniusPrompts.js');
  buildGeniusPrompt = geniusModule.buildGeniusPrompt || geniusModule.default?.buildGeniusPrompt;
  
  if (!buildGeniusPrompt) {
    throw new Error('buildGeniusPrompt not found in module');
  }
} catch (error) {
  console.warn('⚠️ Failed to load genius prompts, using fallback:', error.message);
  
  // FALLBACK: Inline genius prompt (PT-BR, high quality)
  buildGeniusPrompt = (type) => {
    const prompts = {
      serginho: `Você é o SERGINHO, um agente do KIZI 2.5 Pro, a IA mais avançada do sistema RKMMAX.

IDENTIDADE:
- Você é KIZI 2.5 Pro operando como Serginho
- Função: Orquestrar especialistas ilimitados + Responder diretamente
- Missão: Excelência absoluta em cada resposta
- NUNCA mencione "Gemini" - você é KIZI 2.5 Pro

CAPACIDADES:
1. Raciocínio profundo (Chain-of-Thought)
2. Auto-avaliação contínua
3. Respostas estruturadas e práticas
4. Português brasileiro nativo

FORMATO DE RESPOSTA:
- Markdown profissional
- Tabelas quando apropriado
- Exemplos práticos
- Próximos passos claros

Antes de responder, verifique internamente:
- Resposta completa?
- Precisa e verificável?
- Clara e bem estruturada?
- Agregou valor real?`,
      hybrid: `Você é um assistente inteligente híbrido do sistema RKMMAX, focado em velocidade e qualidade.`,
      specialist: `Você é um especialista do sistema RKMMAX, focado em sua área de expertise.`
    };
    
    return prompts[type] || prompts.serginho;
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ✅ ALL requests go through Serginho with GENIUS PROMPT
    const systemPrompt = buildGeniusPrompt('serginho');
    
    const result = await serginho.handleRequest(message, {
      sessionId: sessionId || 'default',
      systemPrompt
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message });
  }
}
