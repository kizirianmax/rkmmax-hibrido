# 🚨 Guia de Configuração de Alertas

**Configurar notificações automáticas via Slack, Email e Dashboard**

---

## 📋 Índice

1. [Slack Integration](#slack-integration)
2. [Email Integration](#email-integration)
3. [GitHub Actions Notifications](#github-actions-notifications)
4. [Alert Thresholds](#alert-thresholds)
5. [Dashboard Alerts](#dashboard-alerts)
6. [Troubleshooting](#troubleshooting)

---

## 🔗 Slack Integration

### 1. Criar Webhook do Slack

**Passo 1:** Acessar Slack App Directory
```
https://api.slack.com/apps
```

**Passo 2:** Criar nova app
- Click em "Create New App"
- Selecionar "From scratch"
- Nome: "RKMMAX Alerts"
- Workspace: Seu workspace Slack

**Passo 3:** Ativar Incoming Webhooks
- No menu esquerdo: "Incoming Webhooks"
- Ativar toggle
- Click em "Add New Webhook to Workspace"
- Selecionar canal: #alerts (ou criar novo)
- Autorizar

**Passo 4:** Copiar Webhook URL
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Configurar no GitHub

**Passo 1:** Acessar GitHub Secrets
```
https://github.com/kizirianmax/Rkmmax-app/settings/secrets/actions
```

**Passo 2:** Adicionar novo secret
- Name: `SLACK_WEBHOOK_URL`
- Value: Cole a URL do webhook
- Click em "Add secret"

### 3. Testar Webhook

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 📧 Email Integration

### 1. Configurar SMTP

**Opção 1: Gmail**

```env
EMAIL_SMTP_URL=smtps://seu-email@gmail.com:sua-senha@smtp.gmail.com:465
EMAIL_FROM=seu-email@gmail.com
EMAIL_TO=destinatario@example.com
```

**Opção 2: SendGrid**

```env
EMAIL_SMTP_URL=smtps://apikey:SG.xxxxx@smtp.sendgrid.net:465
EMAIL_FROM=noreply@kizirianmax.site
EMAIL_TO=roberto@kizirianmax.site
```

**Opção 3: AWS SES**

```env
EMAIL_SMTP_URL=smtps://username:password@email-smtp.region.amazonaws.com:465
EMAIL_FROM=noreply@kizirianmax.site
EMAIL_TO=roberto@kizirianmax.site
```

### 2. Configurar no GitHub

**Passo 1:** Acessar GitHub Secrets
```
https://github.com/kizirianmax/Rkmmax-app/settings/secrets/actions
```

**Passo 2:** Adicionar secrets
```
EMAIL_SMTP_URL = smtps://...
EMAIL_FROM = seu-email@example.com
EMAIL_TO = destinatario@example.com
```

### 3. Testar Email

```javascript
const AlertSystem = require('./src/monitoring/AlertSystem');

const alertSystem = new AlertSystem({
  enableEmail: true,
  emailSmtp: process.env.EMAIL_SMTP_URL,
  emailFrom: process.env.EMAIL_FROM,
  emailTo: process.env.EMAIL_TO,
});

await alertSystem.send({
  title: 'Test Email',
  message: 'This is a test email',
  severity: 'INFO',
  component: 'Testing',
});
```

---

## 🔔 GitHub Actions Notifications

### 1. Arquivo de Workflow

O arquivo `.github/workflows/notifications.yml` já está configurado com:

- ✅ Notificações de sucesso
- ✅ Notificações de falha
- ✅ Health check periódico
- ✅ Relatório semanal

### 2. Ativar Notificações

**Passo 1:** Certificar que `SLACK_WEBHOOK_URL` está configurado

**Passo 2:** Fazer um push para disparar workflow
```bash
git add .
git commit -m "test: trigger notifications"
git push origin main
```

**Passo 3:** Verificar notificações no Slack

### 3. Personalizar Notificações

Editar `.github/workflows/notifications.yml`:

```yaml
# Mudar canal Slack
- name: 📤 Send Slack notification
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ env.SLACK_WEBHOOK }}
    channel: '#alerts'  # Adicionar isso
```

---

## ⚙️ Alert Thresholds

### 1. Padrões Configurados

```javascript
const thresholds = {
  memoryUsage: 40,        // MB
  responseTime: 1000,     // ms
  errorRate: 0.05,        // 5%
  cacheHitRate: 0.5,      // 50%
  buildTime: 300,         // segundos
  apiCalls: 100,          // por hora
};
```

### 2. Personalizar Thresholds

```javascript
const alertSystem = new AlertSystem();

// Atualizar um threshold
alertSystem.updateThreshold('memoryUsage', 50);

// Obter todos os thresholds
const thresholds = alertSystem.getThresholds();
```

### 3. Adicionar Novo Threshold

Editar `src/monitoring/AlertSystem.js`:

```javascript
this.thresholds = {
  // ... existentes
  customMetric: 100, // Novo threshold
};
```

---

## 📊 Dashboard Alerts

### 1. Visualizar Alertas no Dashboard

O `HybridSystemDashboard.jsx` mostra:

- ✅ Alertas em tempo real
- ✅ Histórico de alertas
- ✅ Alertas por severidade
- ✅ Alertas por componente

### 2. Acessar Dashboard

```
https://kizirianmax.site/dashboard
```

### 3. Filtrar Alertas

```javascript
// Alertas críticos
const critical = alertSystem.getAlertsBySeverity('CRITICAL');

// Alertas de um componente
const cacheAlerts = alertSystem.getAlertsByComponent('Cache');

// Últimos 50 alertas
const recent = alertSystem.getHistory(50);
```

---

## 🔧 Usar Alert System

### 1. Inicializar

```javascript
const AlertSystem = require('./src/monitoring/AlertSystem');

const alertSystem = new AlertSystem({
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  emailSmtp: process.env.EMAIL_SMTP_URL,
  emailFrom: process.env.EMAIL_FROM,
  emailTo: process.env.EMAIL_TO,
});
```

### 2. Enviar Alerta Manual

```javascript
await alertSystem.send({
  title: 'Custom Alert',
  message: 'Something happened',
  severity: 'WARNING',
  component: 'MyComponent',
  value: 42,
  unit: 'units',
});
```

### 3. Verificar Métricas

```javascript
const metrics = {
  memoryUsage: 45,
  responseTime: 1200,
  errorRate: 0.08,
  cacheHitRate: 0.6,
  buildTime: 350,
  apiCalls: 120,
};

const alerts = await alertSystem.checkMetrics(metrics);
console.log(`Generated ${alerts.length} alerts`);
```

### 4. Alertas Customizados

```javascript
// Deployment bem-sucedido
await alertSystem.alertDeploymentSuccess({
  environment: 'production',
  duration: 45000,
});

// Deployment falhou
await alertSystem.alertDeploymentFailure(
  { environment: 'production' },
  new Error('Build timeout')
);

// Ameaça de segurança
await alertSystem.alertSecurityThreat({
  type: 'SQL Injection',
  description: 'Detected in user input',
  count: 3,
});

// Anomalia de cache
await alertSystem.alertCacheAnomaly({
  description: 'Cache hit rate dropped 30%',
  hitRate: 45,
});
```

### 5. Obter Estatísticas

```javascript
const stats = alertSystem.getStats();
// {
//   totalAlerts: 42,
//   bySeverity: { CRITICAL: 2, WARNING: 10, INFO: 30 },
//   byComponent: { Cache: 15, Build: 10, ... },
//   lastAlert: { ... }
// }
```

---

## 🐛 Troubleshooting

### Slack Webhook Não Funciona

**Erro:** `Invalid webhook URL`

**Solução:**
1. Verificar URL do webhook
2. Testar com curl:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  YOUR_WEBHOOK_URL
```
3. Regenerar webhook se necessário

### Email Não Envia

**Erro:** `SMTP connection failed`

**Solução:**
1. Verificar credenciais SMTP
2. Verificar porta (465 para TLS, 587 para STARTTLS)
3. Ativar "Less secure app access" (Gmail)
4. Testar com:
```bash
npm install nodemailer
node -e "require('nodemailer').createTransport('YOUR_SMTP_URL').verify(console.log)"
```

### Alertas Não Aparecem no Dashboard

**Erro:** Alertas não sincronizam

**Solução:**
1. Verificar se AlertSystem está inicializado
2. Verificar console para erros
3. Limpar cache do navegador
4. Verificar permissões de acesso

### Muitos Alertas Falsos

**Erro:** Alertas disparando constantemente

**Solução:**
1. Aumentar thresholds:
```javascript
alertSystem.updateThreshold('memoryUsage', 60);
```
2. Implementar deduplicação
3. Adicionar delay entre alertas

---

## 📈 Melhores Práticas

### 1. Alertas Significativos

- ✅ Alertar apenas sobre problemas reais
- ❌ Evitar alert fatigue
- ✅ Usar severidades apropriadas

### 2. Escalação

```
INFO → Log apenas
WARNING → Slack + Email
CRITICAL → Slack + Email + SMS (futuro)
```

### 3. Limpeza

```javascript
// Limpar alertas antigos (> 24h)
alertSystem.clearOldAlerts(24);

// Executar periodicamente
setInterval(() => {
  alertSystem.clearOldAlerts(24);
}, 3600000); // A cada hora
```

### 4. Monitoramento

```javascript
// Acompanhar alertas
setInterval(() => {
  const stats = alertSystem.getStats();
  console.log(`Total alerts: ${stats.totalAlerts}`);
  console.log(`Critical: ${stats.bySeverity.CRITICAL}`);
}, 60000); // A cada minuto
```

---

## 🔐 Segurança

### 1. Proteger Secrets

- ✅ Usar GitHub Secrets
- ✅ Nunca commitar credenciais
- ✅ Rotacionar tokens regularmente

### 2. Validar Webhooks

```javascript
// Verificar assinatura Slack
const crypto = require('crypto');
const timestamp = req.headers['x-slack-request-timestamp'];
const signature = req.headers['x-slack-signature'];

const baseString = `v0:${timestamp}:${body}`;
const mySignature = 'v0=' + crypto
  .createHmac('sha256', SIGNING_SECRET)
  .update(baseString)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  signature,
  mySignature
);
```

### 3. Rate Limiting

```javascript
const alertsPerMinute = 10;
let alertCount = 0;

setInterval(() => {
  alertCount = 0;
}, 60000);

if (alertCount >= alertsPerMinute) {
  console.warn('Alert rate limit exceeded');
  return;
}
alertCount++;
```

---

## 📚 Referências

- [Slack API Documentation](https://api.slack.com/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Alert Best Practices](https://www.atlassian.com/incident-management/on-call/alerting-best-practices)

---

**Alertas Configurados e Prontos! 🚀**

*Última atualização: 2025-11-23*

