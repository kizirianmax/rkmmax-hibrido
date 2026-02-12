// api/stripe-webhook.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// CORS headers
function applyCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ ok: false, error: "Webhook secret not configured" });
  }

  if (!process.env.STRIPE_SECRET_KEY_RKMMAX) {
    console.error("❌ STRIPE_SECRET_KEY_RKMMAX not configured");
    return res.status(500).json({ ok: false, error: "Stripe key not configured" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_RKMMAX, {
    apiVersion: "2024-06-20",
  });

  // Read raw body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).json({ ok: false, error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const email = session.customer_details?.email || session.metadata?.email || null;
        const subscriptionId = session.subscription || null;

        let priceId = session.metadata?.priceId || null;
        if (!priceId) {
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ["line_items.data.price"],
            });
            priceId = fullSession.line_items?.data?.[0]?.price?.id || null;
          } catch (e) {
            console.warn("Could not expand line_items:", e.message);
          }
        }

        let sub = null;
        if (subscriptionId) {
          sub = await stripe.subscriptions.retrieve(subscriptionId);
        }

        await upsertSubscription({
          email,
          priceId,
          subscriptionId,
          status: sub?.status || "active",
          currentPeriodEnd: sub?.current_period_end || null,
        });

        // Enviar e-mail de boas-vindas
        if (email) {
          try {
            await sendWelcomeEmail({ email, session });
          } catch (emailError) {
            console.error("❌ Erro ao enviar e-mail de boas-vindas:", emailError);
            // Não falhar o webhook por causa do e-mail
          }
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;

        let email = null;
        try {
          const customer = await stripe.customers.retrieve(sub.customer);
          email = customer?.email || null;
        } catch (_) {
          console.warn("Could not retrieve customer email");
        }

        await upsertSubscription({
          email,
          priceId: sub.items?.data?.[0]?.price?.id || null,
          subscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
        });

        break;
      }

      default:
        // Ignore other events
        break;
    }

    return res.status(200).json({ ok: true, received: true });
  } catch (err) {
    console.error("❌ Error processing webhook:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

async function upsertSubscription({ email, priceId, subscriptionId, status, currentPeriodEnd }) {
  if (!email) {
    console.warn("Webhook without email — skipping upsert");
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error("❌ Supabase credentials not configured");
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  const payload = {
    email,
    stripe_price_id: priceId,
    stripe_subscription_id: subscriptionId,
    status,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const onConflict = subscriptionId ? "stripe_subscription_id" : "email,stripe_price_id";
  const match = subscriptionId
    ? { stripe_subscription_id: subscriptionId }
    : { email, stripe_price_id: priceId };

  const { error } = await supabase
    .from("subscriptions")
    .upsert({ ...payload, ...match }, { onConflict });

  if (error) {
    throw error;
  }
}

async function sendWelcomeEmail({ email, session }) {
  if (!email) return;

  // Extrair nome do cliente se disponível
  const customerName = session?.customer_details?.name || null;

  // Determinar plano baseado no priceId ou metadata
  const priceId = session?.metadata?.priceId || null;
  let planName = "Premium";
  if (priceId?.includes("basic")) planName = "Básico";
  else if (priceId?.includes("inter")) planName = "Intermediário";

  const emailHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao RKMMAX</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px;">RKMMAX</div>
      <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 16px;">Bem-vindo ao RKMMAX Premium! 🎉</h1>
      <p style="font-size: 16px; color: #64748b;">
        ${customerName ? `Olá ${customerName}! ` : ""}Sua assinatura foi ativada com sucesso!
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">O que você ganhou:</h2>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 12px;">🤖 <strong>54 Especialistas em IA</strong></li>
        <li style="margin-bottom: 12px;">💬 <strong>KIZI - Assistente Pessoal 24/7</strong></li>
        <li style="margin-bottom: 12px;">📚 <strong>Study Lab Premium</strong></li>
        <li style="margin-bottom: 12px;">⚡ <strong>Processamento Prioritário</strong></li>
        <li style="margin-bottom: 12px;">💎 <strong>Suporte Premium</strong></li>
      </ul>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://rkmmax-app.vercel.app/agents" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%); color: #000; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 8px;">
        🎯 Explorar Especialistas
      </a>
      <a href="https://rkmmax-app.vercel.app/serginho" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 8px;">
        💬 Chat com KIZI
      </a>
    </div>

    <div style="text-align: center; padding-top: 24px; border-top: 2px solid #e2e8f0; font-size: 14px; color: #64748b;">
      <p>Precisa de ajuda? <a href="mailto:suporte@kizirianmax.site" style="color: #6366f1;">suporte@kizirianmax.site</a></p>
    </div>
  </div>
</body>
</html>
  `;

  // Enviar e-mail via API Resend
  try {
    const apiUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/send-email`
      : "http://localhost:3000/api/send-email";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Bem-vindo ao RKMMAX Premium! 🎉",
        html: emailHTML,
        type: "welcome",
      }),
    });

    await response.json();
  } catch (error) {
    // Error sending welcome email
  }
}
