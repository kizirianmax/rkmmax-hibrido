# 🔗 Guia de Configuração de APIs Externas

**Integração com OpenAI, Anthropic, Google e Groq**

---

## 📋 Índice

1. [OpenAI](#openai)
2. [Anthropic](#anthropic)
3. [Google](#google)
4. [Groq](#groq)
5. [Configuração do Projeto](#configuração-do-projeto)
6. [Uso](#uso)
7. [Troubleshooting](#troubleshooting)

---

## 🔑 OpenAI

### 1. Criar Conta e API Key

**Passo 1:** Acessar [OpenAI Platform](https://platform.openai.com)

**Passo 2:** Sign up ou login

**Passo 3:** Ir para [API Keys](https://platform.openai.com/api-keys)

**Passo 4:** Click em "Create new secret key"

**Passo 5:** Copiar a chave (será exibida apenas uma vez)

### 2. Modelos Disponíveis

| Modelo | Max Tokens | Custo/1k tokens | Recomendado Para |
|--------|-----------|-----------------|------------------|
| gpt-4 | 8,192 | $0.03 | Tarefas complexas |
| gpt-4-turbo | 128,000 | $0.01 | Documentos longos |
| gpt-3.5-turbo | 4,096 | $0.0005 | Tarefas rápidas |

### 3. Configurar no Projeto

```env
OPENAI_API_KEY=sk-...
```

### 4. Usar na Aplicação

```javascript
const apiManager = new ExternalAPIManager({
  openaiKey: process.env.OPENAI_API_KEY,
});

const result = await apiManager.call('openai', 'Olá, como você está?', {
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
});

console.log(result.text);
```

---

## 🧠 Anthropic

### 1. Criar Conta e API Key

**Passo 1:** Acessar [Anthropic Console](https://console.anthropic.com)

**Passo 2:** Sign up ou login

**Passo 3:** Ir para [API Keys](https://console.anthropic.com/account/keys)

**Passo 4:** Click em "Create Key"

**Passo 5:** Copiar a chave

### 2. Modelos Disponíveis

| Modelo | Max Tokens | Custo/1k tokens | Recomendado Para |
|--------|-----------|-----------------|------------------|
| claude-3-opus | 200,000 | $0.015 | Tarefas muito complexas |
| claude-3-sonnet | 200,000 | $0.003 | Uso geral |
| claude-3-haiku | 200,000 | $0.00025 | Tarefas simples |

### 3. Configurar no Projeto

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Usar na Aplicação

```javascript
const result = await apiManager.call('anthropic', 'Explique IA em 100 palavras', {
  model: 'claude-3-sonnet',
  maxTokens: 500,
});

console.log(result.text);
```

---

## 🔍 Google

### 1. Criar Conta e API Key

**Passo 1:** Acessar [Google AI Studio](https://aistudio.google.com)

**Passo 2:** Click em "Get API Key"

**Passo 3:** Selecionar ou criar projeto

**Passo 4:** Click em "Create API key in new project"

**Passo 5:** Copiar a chave

### 2. Modelos Disponíveis

| Modelo | Max Tokens | Custo/1k tokens | Recomendado Para |
|--------|-----------|-----------------|------------------|
| gemini-pro | 32,768 | $0.0005 | Uso geral |
| gemini-pro-vision | 4,096 | $0.001 | Análise de imagens |

### 3. Configurar no Projeto

```env
GOOGLE_API_KEY=AIza...
```

### 4. Usar na Aplicação

```javascript
const result = await apiManager.call('google', 'Qual é a capital do Brasil?', {
  model: 'gemini-pro',
  maxTokens: 500,
});

console.log(result.text);
```

---

## ⚡ Groq

### 1. Criar Conta e API Key

**Passo 1:** Acessar [Groq Console](https://console.groq.com)

**Passo 2:** Sign up ou login

**Passo 3:** Ir para [API Keys](https://console.groq.com/keys)

**Passo 4:** Click em "Create API Key"

**Passo 5:** Copiar a chave

### 2. Modelos Disponíveis

| Modelo | Max Tokens | Custo/1k tokens | Recomendado Para |
|--------|-----------|-----------------|------------------|
| llama-2-70b | 4,096 | $0.0001 | Melhor custo-benefício |
| mixtral-8x7b | 4,096 | $0.00015 | Modelos mistos |
| llama-2-13b | 4,096 | $0.00005 | Mais rápido |

### 3. Configurar no Projeto

```env
GROQ_API_KEY=gsk_...
```

### 4. Usar na Aplicação

```javascript
const result = await apiManager.call('groq', 'Código em Python para Fibonacci', {
  model: 'llama-2-70b',
  maxTokens: 500,
});

console.log(result.text);
```

---

## ⚙️ Configuração do Projeto

### 1. Adicionar Secrets no GitHub

```
https://github.com/kizirianmax/Rkmmax-app/settings/secrets/actions
```

Adicionar:
```
OPENAI_API_KEY = sk-...
ANTHROPIC_API_KEY = sk-ant-...
GOOGLE_API_KEY = AIza...
GROQ_API_KEY = gsk_...
```

### 2. Adicionar ao `.env.local`

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

### 3. Adicionar ao `.env.example`

```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

---

## 🚀 Uso

### 1. Chamar com Fallback Automático

```javascript
const apiManager = new ExternalAPIManager();

const result = await apiManager.callWithFallback(
  'Explique machine learning',
  { maxTokens: 500 }
);

if (result.success) {
  console.log(`Resposta de ${result.provider}:`);
  console.log(result.result.text);
} else {
  console.error('Todas as APIs falharam:', result.errors);
}
```

### 2. Chamar API Específica

```javascript
const result = await apiManager.call('openai', 'Olá', {
  model: 'gpt-3.5-turbo',
  maxTokens: 100,
  temperature: 0.7,
});
```

### 3. Comparar Custos

```javascript
const costs = apiManager.compareCosts(1000); // 1000 tokens

console.log(costs);
// {
//   openai: { 'gpt-4': 0.03, 'gpt-3.5-turbo': 0.0005 },
//   anthropic: { 'claude-3-opus': 0.015, ... },
//   google: { 'gemini-pro': 0.0005, ... },
//   groq: { 'llama-2-70b': 0.0001, ... }
// }
```

### 4. Verificar Status

```javascript
const status = apiManager.getProvidersStatus();
console.log(status);
// { openai: 'available', anthropic: 'available', ... }

const models = apiManager.getAvailableModels();
console.log(models);
// { openai: ['gpt-4', 'gpt-3.5-turbo'], ... }
```

### 5. Monitorar Estatísticas

```javascript
const stats = apiManager.getStats();
console.log(stats);
// {
//   cacheSize: 42,
//   rateLimits: { openai: { calls: 15, resetTime: ... }, ... },
//   providers: { ... },
//   models: { ... }
// }
```

---

## 💰 Estratégia de Custos

### 1. Usar Groq para Tarefas Simples

```javascript
// Groq: $0.0001 por 1k tokens (MAIS BARATO)
const simple = await apiManager.call('groq', 'Olá');

// OpenAI: $0.0005 por 1k tokens
const complex = await apiManager.call('openai', 'Análise complexa');
```

### 2. Implementar Cache

```javascript
// Primeira chamada: API
const result1 = await apiManager.call('openai', 'Qual é a capital do Brasil?');

// Segunda chamada: Cache (grátis!)
const result2 = await apiManager.call('openai', 'Qual é a capital do Brasil?');
```

### 3. Monitorar Gastos

```javascript
const costs = apiManager.compareCosts(10000); // 10k tokens

let totalCost = 0;
for (const [provider, models] of Object.entries(costs)) {
  for (const [model, cost] of Object.entries(models)) {
    console.log(`${provider}/${model}: $${cost.toFixed(4)}`);
    totalCost += cost;
  }
}
console.log(`Total estimado: $${totalCost.toFixed(2)}`);
```

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"

**Solução:**
1. Verificar se a chave está correta
2. Verificar se a chave não expirou
3. Regenerar a chave se necessário

### Erro: "Rate limit exceeded"

**Solução:**
1. Aguardar 60 segundos
2. Implementar retry com backoff exponencial
3. Usar Groq para tarefas simples (limite maior)

### Erro: "Model not found"

**Solução:**
1. Verificar se o modelo existe
2. Usar `getAvailableModels()` para listar modelos
3. Usar modelo padrão se não especificado

### Erro: "Connection timeout"

**Solução:**
1. Verificar conexão de internet
2. Aumentar timeout
3. Usar fallback para outro provider

### Erro: "Insufficient credits"

**Solução:**
1. Adicionar créditos na conta
2. Usar modelo mais barato
3. Implementar cache agressivo

---

## 📊 Monitoramento

### 1. Rastrear Custos

```javascript
const costTracker = {
  openai: 0,
  anthropic: 0,
  google: 0,
  groq: 0,
};

const result = await apiManager.call('openai', 'prompt');
costTracker.openai += result.cost;

console.log(`Custo total: $${Object.values(costTracker).reduce((a, b) => a + b, 0)}`);
```

### 2. Alertar Sobre Gastos Altos

```javascript
const stats = apiManager.getStats();
const totalCalls = Object.values(stats.rateLimits)
  .reduce((sum, limit) => sum + limit.calls, 0);

if (totalCalls > 1000) {
  console.warn('⚠️ Muitas chamadas de API!');
  // Enviar alerta
}
```

### 3. Limpar Cache Periodicamente

```javascript
setInterval(() => {
  apiManager.clearCache();
  console.log('Cache limpo');
}, 3600000); // A cada hora
```

---

## ✅ Checklist de Implementação

- [ ] Criar contas em OpenAI, Anthropic, Google, Groq
- [ ] Obter API keys
- [ ] Adicionar secrets no GitHub
- [ ] Configurar `.env.local`
- [ ] Testar cada provider
- [ ] Implementar fallback automático
- [ ] Configurar alertas de custo
- [ ] Monitorar no Dashboard
- [ ] Implementar cache
- [ ] Documentar uso

---

**APIs Externas Configuradas e Prontas! 🚀**

*Última atualização: 2025-11-23*

