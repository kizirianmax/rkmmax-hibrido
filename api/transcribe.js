/**
 * API de Transcrição de Áudio
 * Funcionalidade temporariamente indisponível até implementação real de áudio.
 */

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

  return res.status(501).json({
    error: "Not implemented",
    code: "TRANSCRIPTION_NOT_AVAILABLE",
    message: "A transcrição de áudio está temporariamente indisponível até a implementação real do fluxo de voz.",
  });
};
