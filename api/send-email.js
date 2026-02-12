// api/send-email.js
import { Resend } from "resend";

/**
 * Endpoint para enviar e-mails via Resend
 * Documentação: https://resend.com/docs
 */

// CORS
function applyCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"; // Email padrão do Resend

    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY não configurada");
      return res.status(500).json({
        ok: false,
        error: "RESEND_API_KEY não configurada. Adicione no Vercel.",
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { to, subject, html, text } = body;

    if (!to || !subject) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: to, subject",
      });
    }

    // Inicializar Resend
    const resend = new Resend(RESEND_API_KEY);

    // Enviar e-mail
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, ""), // Fallback: remover HTML tags
    });

    if (error) {
      return res.status(400).json({
        ok: false,
        error: error.message || "Erro ao enviar e-mail",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Email sent successfully",
      emailId: data.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Internal server error",
    });
  }
}
