# Guia de Deploy - RKMMax

Este guia contém instruções passo a passo para fazer o deploy do RKMMax na Vercel.

## Pré-requisitos

- [ ] Conta Vercel criada
- [ ] Conta Supabase configurada
- [ ] Conta Stripe configurada
- [ ] (Opcional) Conta Sentry
- [ ] (Opcional) Conta PostHog
- [ ] (Opcional) GitHub Personal Access Token

## Passo 1: Preparar o Repositório

```bash
# 1. Fazer commit de todas as mudanças
git add .
git commit -m "chore: auditoria completa e modernização"
git push origin main
```

## Passo 2: Conectar Vercel

### Opção A: Via Dashboard (Recomendado)

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em "Add New Project"
3. Importe o repositório `kizirianmax/Rkmmax-app`
4. Configure o framework: **Create React App**
5. Configure as variáveis de ambiente (veja Passo 3)
6. Clique em "Deploy"

### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## Passo 3: Configurar Variáveis de Ambiente

### Frontend (Públicas)

No Vercel Dashboard > Settings > Environment Variables:

```bash
# Supabase
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Payment Links
REACT_APP_LINK_PREMIUM_BR=https://buy.stripe.com/...
REACT_APP_LINK_PREMIUM_US=https://buy.stripe.com/...
REACT_APP_REGION_DEFAULT=BR

# Observabilidade (Opcional)
REACT_APP_SENTRY_DSN=https://xxx@sentry.io
REACT_APP_POSTHOG_KEY=phc_xxx
REACT_APP_POSTHOG_HOST=https://app.posthog.com
REACT_APP_VERSION=1.0.0
```

### Backend (Privadas)

```bash
# Stripe
STRIPE_SECRET_KEY_RKMMAX=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (Service Role)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# GitHub (Opcional - para feedback system)
GITHUB_TOKEN=ghp_...
GITHUB_REPO=kizirianmax/Rkmmax-app
```

**Importante:** Marque todas as variáveis backend como **Production, Preview, Development**.

## Passo 4: Configurar Webhook Stripe

1. Acesse [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.vercel.app/api/stripe-webhook`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Signing Secret** (whsec_...)
6. Adicione como `STRIPE_WEBHOOK_SECRET` na Vercel

### Testar Webhook Localmente

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Em outro terminal, testar
stripe trigger checkout.session.completed
```

## Passo 5: Configurar Domínio Custom (Opcional)

1. Vercel Dashboard > Settings > Domains
2. Adicione seu domínio (ex: `rkmmax.com`)
3. Configure DNS conforme instruções da Vercel
4. SSL será configurado automaticamente

## Passo 6: Configurar Sentry (Opcional)

1. Crie projeto em [sentry.io](https://sentry.io)
2. Copie o DSN
3. Adicione `REACT_APP_SENTRY_DSN` na Vercel
4. Deploy novamente

## Passo 7: Configurar PostHog (Opcional)

1. Crie projeto em [posthog.com](https://posthog.com)
2. Copie o Project API Key
3. Adicione `REACT_APP_POSTHOG_KEY` na Vercel
4. Deploy novamente

## Passo 8: Verificar Deploy

### Checklist Pós-Deploy

- [ ] Build passou sem erros
- [ ] Site está acessível
- [ ] Login/Signup funciona
- [ ] Botão de feedback aparece
- [ ] Página /help funciona
- [ ] Sentry está recebendo eventos (se configurado)
- [ ] PostHog está recebendo eventos (se configurado)

### Testar Fluxo de Pagamento

1. Acesse `/pricing`
2. Clique em "Assinar Premium"
3. Complete o checkout (use cartão de teste: `4242 4242 4242 4242`)
4. Verifique redirecionamento para `/success`
5. Verifique webhook no Stripe Dashboard
6. Verifique atualização no Supabase

## Passo 9: Monitoramento

### Vercel Analytics

- Acesse Vercel Dashboard > Analytics
- Monitore performance, erros e tráfego

### Sentry

- Acesse [sentry.io](https://sentry.io)
- Monitore erros em tempo real
- Configure alertas

### PostHog

- Acesse [posthog.com](https://posthog.com)
- Monitore eventos e funis
- Crie dashboards

## Rollback

Se algo der errado:

```bash
# Via CLI
vercel rollback

# Ou via Dashboard
# Vercel Dashboard > Deployments > [deployment anterior] > Promote to Production
```

## Troubleshooting

### Build falha com "Module not found"

**Solução:** Verifique se todos os imports usam extensões explícitas (`.jsx`, `.js`)

### Webhook não funciona

**Solução:**
1. Verifique `STRIPE_WEBHOOK_SECRET` na Vercel
2. Verifique endpoint no Stripe Dashboard
3. Teste com Stripe CLI

### Sentry não recebe eventos

**Solução:**
1. Verifique `REACT_APP_SENTRY_DSN`
2. Force um erro para testar
3. Verifique console do navegador

### PostHog não recebe eventos

**Solução:**
1. Verifique `REACT_APP_POSTHOG_KEY`
2. Verifique console do navegador
3. Desabilite ad blockers

## Próximos Passos

1. [ ] Configurar alertas no Sentry
2. [ ] Criar dashboards no PostHog
3. [ ] Configurar GitHub Actions secrets
4. [ ] Testar fluxo completo E2E
5. [ ] Executar Lighthouse audit
6. [ ] Configurar RLS no Supabase

---

**Deploy realizado com sucesso? Parabéns! 🎉**

Para suporte, abra um issue ou use o botão de feedback no app.
