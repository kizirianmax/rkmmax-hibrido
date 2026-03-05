/**
 * API de Transcrição de Áudio
 * Enterprise-grade transcription using Serginho Orchestrator
 * 
 * Features:
 * - Serginho Orchestrator for centralized provider management
 * - Circuit breaker protection
 * - Timeout protection
 * - Automatic fallback
 * - Optimized for fast transcription (uses gemini-2.0-flash)
 */
import busboy from "busboy";
import serginho from "./lib/serginho-orchestrator.js";
import { getEnabledProviders } from './lib/providers-config.js';

/**
 * Transcribe audio using Serginho Orchestrator
 */
async function transcribeAudio(audioBuffer) {
  // Convert audio to base64
  const audioBase64 = audioBuffer.toString("base64");
  
  // Create transcription prompt
  const prompt = `Transcreva este áudio em português. Retorne APENAS o texto transcrito, sem explicações ou comentários adicionais.`;
  
  // Use Serginho Orchestrator with forced provider for fast transcription
  // Phase A5.7: Only force gemini-2.0-flash if Gemini is actually enabled
  const enabledProviders = getEnabledProviders();
  const geminiAvailable = enabledProviders.includes('gemini-2.0-flash');

  const result = await serginho.handleRequest({
    message: prompt,
    messages: [],
    context: {
      type: 'audio-transcription',
      audioData: audioBase64,
      mimeType: 'audio/mpeg',
    },
    options: {
      ...(geminiAvailable ? { forceProvider: 'gemini-2.0-flash' } : {}),
    },
  });
  
  return result.text;
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

  // Guard: transcription requires Gemini (GOOGLE_API_KEY)
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GERMINI_API_KEY;
  if (!googleKey) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Transcrição de áudio requer GOOGLE_API_KEY. Configure a variável de ambiente para habilitar este recurso.',
      hint: 'Set GOOGLE_API_KEY in Vercel environment variables',
    });
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
