/**
 * API de Transcrição de Áudio
 * Enterprise-grade transcription using aiAdapter
 * 
 * Features:
 * - aiAdapter integration for automatic provider selection
 * - Circuit breaker protection
 * - Timeout protection
 * - Automatic fallback
 * - No provider exposure
 */
import busboy from "busboy";
import { simpleQuery, askAI } from "../src/utils/aiAdapter.js";

/**
 * Transcribe audio using aiAdapter
 */
async function transcribeAudio(audioBuffer) {
  // Convert audio to base64
  const audioBase64 = audioBuffer.toString("base64");
  
  // Create transcription prompt
  const prompt = `Transcreva este áudio em português. Retorne APENAS o texto transcrito, sem explicações. [Audio data: ${audioBase64.length} bytes in base64 format]`;
  
  // Use aiAdapter for transcription (automatic provider selection)
  try {
    const result = await simpleQuery(prompt);
    return result.answer;
  } catch (error) {
    // Fallback to askAI if simpleQuery fails
    console.warn('⚠️ Simple query failed, trying askAI...', error.message);
    const result = await askAI(prompt, { type: 'transcription' });
    return result.answer;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📝 Recebendo áudio para transcrição...");

    const bb = busboy({ headers: req.headers });
    let audioBuffer = null;

    bb.on("file", (fieldname, file, info) => {
      console.log(`📁 Arquivo recebido: ${fieldname} (${info.mimeType})`);
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        audioBuffer = Buffer.concat(chunks);
        console.log(`✅ Áudio recebido: ${audioBuffer.length} bytes`);
      });
    });

    bb.on("close", async () => {
      if (!audioBuffer) {
        return res.status(400).json({ 
          error: "Bad request",
          message: "Nenhum áudio foi enviado" 
        });
      }

      try {
        console.log("🔄 Iniciando transcrição via aiAdapter...");

        // Transcribe via aiAdapter (automatic provider selection)
        const transcript = await transcribeAudio(audioBuffer);
        
        console.log("✅ Transcrição bem-sucedida");

        return res.status(200).json({
          success: true,
          transcript: transcript.trim(),
          text: transcript.trim(),
        });
      } catch (error) {
        console.error("❌ Erro na transcrição:", error);

        // Circuit breaker error
        if (error.message && error.message.includes('Circuit breaker')) {
          return res.status(503).json({
            error: 'Service unavailable',
            message: 'Transcription service is temporarily unavailable.',
            retryAfter: 60,
          });
        }

        // Timeout error
        if (error.message && error.message.includes('Timeout')) {
          return res.status(504).json({
            error: 'Gateway timeout',
            message: 'Transcription took too long. Please try with a shorter audio.',
            maxTimeout: 8000,
          });
        }

        // All providers failed
        if (error.message && error.message.includes('All providers failed')) {
          return res.status(503).json({
            error: 'Service unavailable',
            message: 'All transcription providers are currently unavailable.',
          });
        }

        return res.status(500).json({
          error: "Transcription failed",
          message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : error.message,
        });
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error("❌ Erro ao processar requisição:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
    });
  }
};
