# 📧 Configurar E-mail com Resend

## 🎯 O Que É Resend?

Resend é um serviço moderno de envio de e-mails, usado por empresas como Vercel, Linear e Cal.com.

**Plano Gratuito:**
- ✅ 3.000 e-mails/mês
- ✅ 100 e-mails/dia
- ✅ Domínio personalizado
- ✅ API moderna e simples

## 🚀 Passo a Passo

### 1. Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Faça login com GitHub ou Google
3. Confirme seu e-mail

### 2. Pegar API Key

1. Acesse: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Nome: `RKMMAX Production`
4. Permissão: **"Sending access"**
5. Clique em **"Add"**
6. **COPIE A CHAVE** (ela só aparece uma vez!)

Exemplo: `re_123abc456def...`

### 3. Configurar Domínio (Opcional mas Recomendado)

**Opção A: Usar domínio padrão (mais rápido)**
- E-mails serão enviados de: `onboarding@resend.dev`
- Funciona imediatamente
- **Limitação:** Alguns provedores podem marcar como spam

**Opção B: Configurar domínio próprio (recomendado)**
1. Acesse: https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite: `kizirianmax.site`
4. Siga as instruções para adicionar registros DNS no GoDaddy:
   - **SPF**: `v=spf1 include:resend.com ~all`
   - **DKIM**: (copiar do Resend)
   - **DMARC**: `v=DMARC1; p=none;`
5. Aguarde verificação (5-30 minutos)

Depois, e-mails serão enviados de: `suporte@kizirianmax.site`

### 4. Adicionar Variáveis no Vercel

1. Acesse: https://vercel.com/seu-usuario/rkmmax-app/settings/environment-variables

2. Adicione estas variáveis:

```
RESEND_API_KEY=re_123abc456def...
FROM_EMAIL=onboarding@resend.dev
```

**Se configurou domínio próprio:**
```
FROM_EMAIL=suporte@kizirianmax.site
```

3. Selecione: **Production, Preview, Development**
4. Clique em **"Save"**

### 5. Fazer Deploy

```bash
cd /home/ubuntu/Rkmmax-app
git add -A
git commit -m "feat: Ativar envio real de e-mails com Resend"
git push origin feature/voice-image-ultra-plan
```

Ou faça merge direto para `main`:
```bash
git checkout main
git merge feature/voice-image-ultra-plan
git push origin main
```

O Vercel fará deploy automático.

### 6. Testar E-mail

Após o deploy, teste no seu app:

1. Acesse a página de assinatura
2. Insira seu e-mail
3. Clique em "Assinar"
4. Verifique sua caixa de entrada

**Se não receber:**
- Verifique a pasta de spam
- Verifique se `RESEND_API_KEY` está configurada no Vercel
- Veja os logs no Vercel: https://vercel.com/seu-usuario/rkmmax-app/logs

## 📊 Monitorar Envios

Acesse o dashboard do Resend:
- https://resend.com/emails

Você verá:
- ✅ E-mails enviados
- ❌ E-mails falhados
- 📈 Taxa de entrega
- 🔍 Logs detalhados

## 🛠️ Troubleshooting

### Erro: "RESEND_API_KEY não configurada"
**Solução:** Adicione a variável no Vercel e faça novo deploy

### Erro: "Invalid API key"
**Solução:** Verifique se copiou a chave correta do Resend

### E-mail não chega
**Possíveis causas:**
1. E-mail na pasta de spam
2. Domínio não verificado (use `onboarding@resend.dev` temporariamente)
3. Limite diário atingido (100 emails/dia no plano gratuito)

### Erro: "Rate limit exceeded"
**Solução:** Aguarde 24h ou faça upgrade para plano pago

## 💰 Custos

**Plano Gratuito:**
- 3.000 e-mails/mês
- 100 e-mails/dia
- **Custo:** R$ 0

**Se precisar mais:**
- **Pro:** $20/mês (50.000 e-mails)
- **Business:** $80/mês (500.000 e-mails)

## 📝 Tipos de E-mail Implementados

1. **Boas-vindas** - Após cadastro
2. **Confirmação de assinatura** - Após pagamento
3. **Notificações** - Atualizações do sistema

## ✅ Checklist

- [ ] Criar conta no Resend
- [ ] Pegar API Key
- [ ] (Opcional) Configurar domínio próprio
- [ ] Adicionar `RESEND_API_KEY` no Vercel
- [ ] Adicionar `FROM_EMAIL` no Vercel
- [ ] Fazer deploy
- [ ] Testar envio de e-mail
- [ ] Verificar recebimento
- [ ] Monitorar no dashboard Resend

## 🎉 Pronto!

Agora seus e-mails serão enviados de verdade! 🚀

---

**Desenvolvido para o RKMMAX** 💙

