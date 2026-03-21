# Variáveis de Ambiente - RKMMAX Final (Groq-Only)

Copie e cole estas variáveis no Vercel (Settings → Environment Variables):

```
# MODELOS DE IA — Arquitetura Groq-Only
# O roteamento real é feito pelo Serginho Orchestrator usando os modelos abaixo.
# Estas variáveis servem como referência de configuração por tier de plano.
MODEL_BASIC=llama-3.1-8b-instant
MODEL_INTERMEDIATE=llama-3.3-70b-versatile
MODEL_PREMIUM=openai/gpt-oss-120b
MODEL_ULTRA=openai/gpt-oss-120b

# LIMITES RÍGIDOS DE TOKENS (Para o Serginho bloquear)
LIMIT_BASIC_TOKENS_DAILY=3500
LIMIT_INTERMEDIATE_TOKENS_DAILY=4700
LIMIT_PREMIUM_TOKENS_DAILY=7200
LIMIT_ULTRA_TOKENS_DAILY=9000

# CONFIGURAÇÃO DE ACESSO (Para o Serginho priorizar)
HARDWARE_PREMIUM_PRIORITY=GROQ
HARDWARE_ULTRA_PRIORITY=GROQ

# FALLBACK GROQ (modelo de fallback em caso de indisponibilidade do primary)
GROQ_FALLBACK_MODEL=mixtral-8x7b-32768
```

## Instruções:
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **rkmmax-app**
3. Vá em **Settings → Environment Variables**
4. Copie cada linha acima e adicione como nova variável
5. Deploy automático será acionado

## Variáveis Já Existentes (não alterar):
- GROQ_API_KEY
- RESEND_API_KEY
- FROM_EMAIL
- JWT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

