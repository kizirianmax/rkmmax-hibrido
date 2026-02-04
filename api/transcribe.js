/**
 * API de Transcrição de Áudio usando Gemini 2.0 Flash
 * Endpoint: /api/transcribe
 * Fallback: Groq (se Gemini falhar)
 *
 * Compatível com Vercel Serverless
 */
const busboy = require("busboy");

async function transcribeWithGemini(audioBase64, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/mpeg",
                  data: audioBase64,
                },
              },
              {
                text: "Transcreva este áudio em português. Retorne APENAS o texto transcrito, sem explicações.",
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini transcription error: ${error.error?.message || "Unknown"}`);
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid Gemini response");
  }

  return data.candidates[0].content.parts[0].text;
}

async function transcribeWithGroq(audioBuffer) {
  // Fallback para GROQ se Gemini falhar
  const FormData = require("form-data");
  const formData = new FormData();

  formData.append("file", audioBuffer, {
    filename: "audio.mp3",
    contentType: "audio/mpeg",
  });
  formData.append("model", "whisper-large-v3");
  formData.append("language", "pt");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("GROQ transcription failed");
  }

  const data = await response.json();
  return data.text;
}

module.exports = async function handler(req, res) {
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
        return res.status(400).json({ error: "Nenhum áudio foi enviado" });
      }

      try {
        const audioBase64 = audioBuffer.toString("base64");
        console.log("🔄 Iniciando transcrição com Gemini...");

        let transcript;
        try {
          transcript = await transcribeWithGemini(audioBase64, process.env.GOOGLE_API_KEY);
          console.log("✅ Transcrição com Gemini bem-sucedida:", transcript);
        } catch (error) {
          console.warn("⚠️ Gemini falhou, tentando GROQ...", error.message);
          transcript = await transcribeWithGroq(audioBuffer);
          console.log("✅ Transcrição com GROQ bem-sucedida:", transcript);
        }

        return res.status(200).json({
          success: true,
          transcript: transcript.trim(),
          text: transcript.trim(),
        });
      } catch (error) {
        console.error("❌ Erro na transcrição:", error);
        return res.status(500).json({
          error: "Erro na transcrição",
          message: error.message,
        });
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error("❌ Erro ao processar requisição:", error);
    return res.status(500).json({
      error: "Erro ao processar áudio",
      message: error.message,
    });
  }
};
