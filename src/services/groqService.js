/**
 * Groq API Service
 * Serviço para integração com Groq AI (Llama 3.1 70B)
 * Gratuito com rate limits generosos
 */

// Usar API serverless do Vercel ao invés de chamar Groq diretamente
const API_URL = "/api/chat";

/**
 * Envia mensagem para o Groq AI
 * @param {Array} messages - Array de mensagens no formato OpenAI
 * @param {Object} options - Opções adicionais
 * @returns {Promise<string>} - Resposta do AI
 */
export async function sendMessageToGroq(messages) {
  try {
    // Chamar API serverless do Vercel
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    // Verificar erros
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao comunicar com API");
    }

    // Parsear resposta
    const data = await response.json();

    // Retornar conteúdo da mensagem
    return data.response;
  } catch (error) {
    console.error("Erro no Groq Service:", error);
    throw error;
  }
}

/**
 * Gera resposta com streaming (para mostrar texto aparecendo aos poucos)
 * @param {Array} messages - Array de mensagens
 * @param {Function} onChunk - Callback para cada chunk de texto
 * @returns {Promise<string>} - Texto completo
 */
export async function sendMessageToGroqStream(messages, onChunk) {
  try {
    // Streaming não suportado via API serverless por enquanto
    // Usar método normal e simular streaming

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao comunicar com API");
    }

    const data = await response.json();
    const fullText = data.response;

    // Simular streaming dividindo o texto
    const words = fullText.split(" ");
    for (const word of words) {
      onChunk(word + " ");
      await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay
    }

    return fullText;
  } catch (error) {
    console.error("Erro no Groq Stream:", error);
    throw error;
  }
}

/**
 * Modelos disponíveis no Groq
 */
export const GROQ_MODELS = {
  LLAMA_70B: "llama-3.3-70b-versatile", // Atualizado: 3.1 foi descontinuado
  LLAMA_8B: "llama-3.1-8b-instant",
  GPT_OSS_120B: "openai/gpt-oss-120b",
  GPT_OSS_20B: "openai/gpt-oss-20b",
};

const groqService = {
  sendMessageToGroq,
  sendMessageToGroqStream,
  GROQ_MODELS,
};

export default groqService;
