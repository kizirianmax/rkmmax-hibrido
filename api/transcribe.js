/**
 * API de Transcrição de Áudio
 * Transcrição direta via Groq Whisper (whisper-large-v3-turbo)
 *
 * Features:
 * - Chamada direta ao Groq Whisper — sem dependência do Serginho Orchestrator
 * - multipart/form-data montado com package form-data@^4.0.5
 * - fetch nativo do Node 22
 * - response_format=text → body plain string
 */
import busboy from "busboy";
import FormData from "form-data";

/**
 * Transcreve áudio via Groq Whisper (whisper-large-v3-turbo).
 * @param {Buffer} audioBuffer - Buffer do arquivo de áudio
 * @param {string} mimeType - MIME type do áudio (ex: audio/webm)
 * @returns {Promise<string>} Texto transcrito
 */
async function transcribeWithGroq(audioBuffer, mimeType = 'audio/webm') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const groqForm = new FormData();
  groqForm.append('file', audioBuffer, { filename: 'audio.webm', contentType: mimeType });
  groqForm.append('model', 'whisper-large-v3-turbo');
  groqForm.append('language', 'pt');
  groqForm.append('response_format', 'text');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...groqForm.getHeaders(),
    },
    body: groqForm,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Whisper error ${response.status}: ${errText}`);
  }

  // response_format=text → body é string pura (não JSON)
  return (await response.text()).trim();
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
    let audioMimeType = 'audio/webm';

    bb.on("file", (fieldname, file, info) => {
      console.log(`📁 Arquivo recebido: ${fieldname} (${info.mimeType})`);
      audioMimeType = info.mimeType || 'audio/webm';
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
        console.log("🔄 Iniciando transcrição via Groq Whisper...");

        const transcript = await transcribeWithGroq(audioBuffer, audioMimeType);
        
        console.log("✅ Transcrição bem-sucedida");

        return res.status(200).json({
          success: true,
          transcript: transcript.trim(),
          text: transcript.trim(),
        });
      } catch (error) {
        console.error("❌ Erro na transcrição:", error);

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
