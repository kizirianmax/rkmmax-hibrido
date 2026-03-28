// src/services/emailService.js

/**
 * Serviço de envio de e-mails
 *
 * Em produção, isso pode usar:
 * - SendGrid
 * - Mailgun
 * - AWS SES
 * - Resend
 * - ImprovMX (já configurado para receber)
 */

export async function sendWelcomeEmail({ to, name, plan }) {
  try {
    // Em produção, fazer chamada para API de e-mail
    // Por enquanto, apenas log
    console.log("📧 Enviando e-mail de boas-vindas:", { to, name, plan });

    const emailData = {
      to,
      from: "suporte@kizirianmax.site",
      subject: "Bem-vindo ao RKMMAX Premium! 🎉",
      html: generateWelcomeEmailHTML({ name, plan }),
      text: generateWelcomeEmailText({ name, plan }),
    };

    // Enviar e-mail via API
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Erro ao enviar e-mail");
    }

    console.log("✅ E-mail de boas-vindas enviado com sucesso:", result.emailId);
    return { success: true, emailId: result.emailId };
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    return { success: false, error };
  }
}

function generateWelcomeEmailHTML({ name, plan }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao RKMMAX</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 32px;
    }
    .benefits {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .benefit-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .benefit-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    .benefit-text {
      flex: 1;
    }
    .benefit-text strong {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .benefit-text p {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
      color: #000;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      text-align: center;
      margin: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
      font-size: 14px;
      color: #64748b;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">RKMMAX</div>
      <h1>Bem-vindo ao RKMMAX Premium! 🎉</h1>
      <p class="subtitle">
        ${name ? `Olá ${name}! ` : ""}Sua assinatura foi ativada com sucesso e você agora tem acesso completo a todos os recursos premium.
      </p>
    </div>

    <div class="benefits">
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">O que você ganhou:</h2>
      
      <div class="benefit-item">
        <span class="benefit-icon">🤖</span>
        <div class="benefit-text">
          <strong>47 Especialistas em IA</strong>
          <p>Acesso ilimitado a todos os agentes especializados para qualquer tarefa</p>
        </div>
      </div>

      <div class="benefit-item">
        <span class="benefit-icon">💬</span>
        <div class="benefit-text">
          <strong>Serginho - Seu Assistente Pessoal</strong>
          <p>Disponível 24/7 para te ajudar com qualquer dúvida ou tarefa</p>
        </div>
      </div>

      <div class="benefit-item">
        <span class="benefit-icon">📚</span>
        <div class="benefit-text">
          <strong>Study Lab Premium</strong>
          <p>Formatação ABNT/APA, cronogramas e ferramentas acadêmicas profissionais</p>
        </div>
      </div>

      <div class="benefit-item">
        <span class="benefit-icon">⚡</span>
        <div class="benefit-text">
          <strong>Processamento Prioritário</strong>
          <p>Respostas mais rápidas com prioridade na fila de processamento</p>
        </div>
      </div>

      <div class="benefit-item">
        <span class="benefit-icon">💎</span>
        <div class="benefit-text">
          <strong>Suporte Premium</strong>
          <p>Atendimento prioritário e suporte dedicado</p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Comece agora mesmo:</h2>
      
      <a href="https://rkmmax-app.vercel.app/agents" class="cta-button">
        🎯 Explorar Especialistas
      </a>
      
      <a href="https://rkmmax-app.vercel.app/serginho" class="cta-button">
        💬 Chat com Serginho
      </a>
      
      <a href="https://rkmmax-app.vercel.app/study" class="cta-button">
        📚 Study Lab
      </a>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">📋 Próximos Passos:</h3>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Explore os 47 especialistas e descubra qual se encaixa melhor nas suas necessidades</li>
        <li style="margin-bottom: 8px;">Converse com Serginho para conhecer todos os recursos disponíveis</li>
        <li style="margin-bottom: 8px;">Configure suas preferências em <a href="https://rkmmax-app.vercel.app/settings">Configurações</a></li>
        <li style="margin-bottom: 8px;">Gerencie sua assinatura em <a href="https://rkmmax-app.vercel.app/subscription">Minha Assinatura</a></li>
      </ol>
    </div>

    <div class="footer">
      <p><strong>Precisa de ajuda?</strong></p>
      <p>
        Nossa equipe está disponível em 
        <a href="mailto:suporte@kizirianmax.site">suporte@kizirianmax.site</a>
      </p>
      <p style="margin-top: 16px;">
        <a href="https://rkmmax-app.vercel.app">Acessar RKMMAX</a> | 
        <a href="https://rkmmax-app.vercel.app/help">Central de Ajuda</a> | 
        <a href="https://rkmmax-app.vercel.app/subscription">Gerenciar Assinatura</a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
        © 2025 RKMMAX. Todos os direitos reservados.<br>
        Você está recebendo este e-mail porque criou uma conta no RKMMAX.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateWelcomeEmailText({ name, plan }) {
  return `
Bem-vindo ao RKMMAX Premium!

${name ? `Olá ${name}! ` : ""}Sua assinatura foi ativada com sucesso e você agora tem acesso completo a todos os recursos premium.

O QUE VOCÊ GANHOU:

🤖 47 Especialistas em IA
Acesso ilimitado a todos os agentes especializados para qualquer tarefa

💬 Serginho - Seu Assistente Pessoal
Disponível 24/7 para te ajudar com qualquer dúvida ou tarefa

📚 Study Lab Premium
Formatação ABNT/APA, cronogramas e ferramentas acadêmicas profissionais

⚡ Processamento Prioritário
Respostas mais rápidas com prioridade na fila de processamento

💎 Suporte Premium
Atendimento prioritário e suporte dedicado

COMECE AGORA MESMO:

🎯 Explorar Especialistas: https://rkmmax-app.vercel.app/agents
💬 Chat com Serginho: https://rkmmax-app.vercel.app/serginho
📚 Study Lab: https://rkmmax-app.vercel.app/study

PRÓXIMOS PASSOS:

1. Explore os 47 especialistas e descubra qual se encaixa melhor nas suas necessidades
2. Converse com Serginho para conhecer todos os recursos disponíveis
3. Configure suas preferências em: https://rkmmax-app.vercel.app/settings
4. Gerencie sua assinatura em: https://rkmmax-app.vercel.app/subscription

PRECISA DE AJUDA?

Nossa equipe está disponível em suporte@kizirianmax.site

---

© 2025 RKMMAX. Todos os direitos reservados.
Você está recebendo este e-mail porque criou uma conta no RKMMAX.
  `;
}

export default {
  sendWelcomeEmail,
};
