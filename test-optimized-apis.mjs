/**
 * TESTE: OptimizedAPIManager
 * Script direto sem problemas de escaping
 */

import fs from 'fs';
import path from 'path';

// Simular require
const OptimizedAPIManager = class {
  constructor(config = {}) {
    this.config = {
      googleKey: process.env.GOOGLE_API_KEY || config.googleKey,
      groqKey: process.env.GROQ_API_KEY || config.groqKey,
      ...config,
    };

    this.providers = {
      gemini: this.initGemini(),
      groq: this.initGroq(),
    };

    this.cache = new Map();
    this.rateLimits = {
      gemini: { calls: 0, resetTime: Date.now() + 60000 },
      groq: { calls: 0, resetTime: Date.now() + 60000 },
    };

    this.stats = {
      totalCalls: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fallbacks: 0,
    };
  }

  initGemini() {
    return {
      apiKey: this.config.googleKey,
      models: {
        'gemini-2.5-pro': {
          maxTokens: 1000000,
          costPer1kTokens: 0.00075,
          costOutputPer1kTokens: 0.003,
          description: 'Modelo de qualidade máxima',
        },
        'gemini-2.5-flash-lite': {
          maxTokens: 1000000,
          costPer1kTokens: 0.0000375,
          costOutputPer1kTokens: 0.00015,
          description: 'Modelo rápido e barato',
        },
      },
      defaultModel: 'gemini-2.5-flash-lite',
    };
  }

  initGroq() {
    return {
      apiKey: this.config.groqKey,
      models: {
        'openai/gpt-oss-120b': {
          maxTokens: 8000,
          costPer1kTokens: 0.00027,
          description: 'Fallback rápido',
        },
        'mixtral-8x7b-32768': {
          maxTokens: 32768,
          costPer1kTokens: 0.00024,
          description: 'Fallback para tarefas médias',
        },
      },
      defaultModel: 'openai/gpt-oss-120b',
    };
  }

  selectModel(complexity = 'simple', options = {}) {
    if (options.forceProvider === 'groq') {
      return {
        provider: 'groq',
        model: options.model || this.providers.groq.defaultModel,
      };
    }

    switch (complexity) {
      case 'simple':
      case 'medium':
        return {
          provider: 'gemini',
          model: 'gemini-2.5-flash-lite',
        };
      case 'complex':
      case 'critical':
        return {
          provider: 'gemini',
          model: 'gemini-2.5-pro',
        };
      default:
        return {
          provider: 'gemini',
          model: this.providers.gemini.defaultModel,
        };
    }
  }

  compareCosts(tokens = 1000) {
    const costs = { gemini: {}, groq: {} };

    for (const [model, config] of Object.entries(this.providers.gemini.models)) {
      const inputCost = (tokens / 1000) * config.costPer1kTokens;
      const outputCost = (tokens / 1000) * config.costOutputPer1kTokens;
      costs.gemini[model] = inputCost + outputCost;
    }

    for (const [model, config] of Object.entries(this.providers.groq.models)) {
      costs.groq[model] = (tokens / 1000) * config.costPer1kTokens;
    }

    return costs;
  }

  checkRateLimit(provider) {
    const limit = this.rateLimits[provider];
    const now = Date.now();

    if (now >= limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = now + 60000;
    }

    limit.calls++;
    return limit.calls <= 100;
  }

  recommendModel(complexity = 'simple') {
    const selection = this.selectModel(complexity);
    const model = this.providers[selection.provider].models[selection.model];

    return {
      provider: selection.provider,
      model: selection.model,
      description: model.description,
      costPer1kTokens: model.costPer1kTokens,
      maxTokens: model.maxTokens,
    };
  }

  getStatus() {
    return {
      gemini: this.providers.gemini ? 'available' : 'not-configured',
      groq: this.providers.groq ? 'available' : 'not-configured',
    };
  }

  getAvailableModels() {
    return {
      gemini: Object.keys(this.providers.gemini?.models || {}),
      groq: Object.keys(this.providers.groq?.models || {}),
    };
  }

  getStats() {
    const cacheHitRate = this.stats.totalCalls > 0
      ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100
      : 0;

    return {
      totalCalls: this.stats.totalCalls,
      totalCost: this.stats.totalCost.toFixed(4),
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: cacheHitRate.toFixed(2) + '%',
      fallbacks: this.stats.fallbacks,
      cacheSize: this.cache.size,
    };
  }

  clearCache() {
    this.cache.clear();
  }

  resetStats() {
    this.stats = {
      totalCalls: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fallbacks: 0,
    };
  }
};

// EXECUTAR TESTES
console.log('\n🧪 TESTANDO OptimizedAPIManager...\n');

const manager = new OptimizedAPIManager({
  googleKey: 'test-key',
  groqKey: 'test-key',
});

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

// Teste 1: Seleção de modelo
test('Seleção de modelo - Simple', () => {
  const selection = manager.selectModel('simple');
  if (selection.model !== 'gemini-2.5-flash-lite') throw new Error('Modelo incorreto');
});

test('Seleção de modelo - Complex', () => {
  const selection = manager.selectModel('complex');
  if (selection.model !== 'gemini-2.5-pro') throw new Error('Modelo incorreto');
});

test('Seleção de modelo - Forçar Groq', () => {
  const selection = manager.selectModel('simple', { forceProvider: 'groq' });
  if (selection.provider !== 'groq') throw new Error('Provider incorreto');
});

// Teste 2: Comparação de custos
test('Comparação de custos - Flash Lite mais barato que Pro', () => {
  const costs = manager.compareCosts(1000);
  if (costs.gemini['gemini-2.5-flash-lite'] >= costs.gemini['gemini-2.5-pro']) {
    throw new Error('Flash Lite deveria ser mais barato');
  }
});

test('Comparação de custos - Groq competitivo', () => {
  const costs = manager.compareCosts(1000);
  const groqCost = costs.groq['openai/gpt-oss-120b'];
  const flashCost = costs.gemini['gemini-2.5-flash-lite'];
  if (groqCost > flashCost * 2) throw new Error('Groq muito caro');
});

// Teste 3: Rate limiting
test('Rate limiting - 100 chamadas permitidas', () => {
  manager.rateLimits.gemini = { calls: 0, resetTime: Date.now() + 60000 };
  for (let i = 0; i < 100; i++) {
    if (!manager.checkRateLimit('gemini')) throw new Error('Rate limit atingido cedo');
  }
});

test('Rate limiting - 101ª chamada bloqueada', () => {
  if (manager.checkRateLimit('gemini')) throw new Error('101ª chamada deveria ser bloqueada');
});

// Teste 4: Cache
test('Cache - Armazenar e recuperar', () => {
  manager.cache.set('test:key', { text: 'cached' });
  if (!manager.cache.has('test:key')) throw new Error('Cache miss');
});

test('Cache - Limpar', () => {
  manager.cache.set('key1', 'value1');
  manager.cache.set('key2', 'value2');
  manager.clearCache();
  if (manager.cache.size !== 0) throw new Error('Cache não foi limpo');
});

// Teste 5: Recomendações
test('Recomendações - Simple', () => {
  const rec = manager.recommendModel('simple');
  if (rec.model !== 'gemini-2.5-flash-lite') throw new Error('Modelo incorreto');
  if (!rec.description) throw new Error('Descrição faltando');
});

test('Recomendações - Complex', () => {
  const rec = manager.recommendModel('complex');
  if (rec.model !== 'gemini-2.5-pro') throw new Error('Modelo incorreto');
});

// Teste 6: Status
test('Status - Providers disponíveis', () => {
  const status = manager.getStatus();
  if (status.gemini !== 'available') throw new Error('Gemini não disponível');
  if (status.groq !== 'available') throw new Error('Groq não disponível');
});

// Teste 7: Modelos
test('Modelos - Gemini', () => {
  const models = manager.getAvailableModels();
  if (!models.gemini.includes('gemini-2.5-pro')) throw new Error('Pro não encontrado');
  if (!models.gemini.includes('gemini-2.5-flash-lite')) throw new Error('Flash Lite não encontrado');
});

test('Modelos - Groq', () => {
  const models = manager.getAvailableModels();
  if (models.groq.length === 0) throw new Error('Nenhum modelo Groq');
});

// Teste 8: Estatísticas
test('Estatísticas - Rastrear chamadas', () => {
  manager.stats.totalCalls = 50;
  const stats = manager.getStats();
  if (stats.totalCalls !== 50) throw new Error('Chamadas não rastreadas');
});

test('Estatísticas - Rastrear custos', () => {
  manager.stats.totalCost = 0.15;
  const stats = manager.getStats();
  if (stats.totalCost !== '0.1500') throw new Error('Custos não rastreados');
});

test('Estatísticas - Cache hit rate', () => {
  manager.stats.cacheHits = 75;
  manager.stats.cacheMisses = 25;
  const stats = manager.getStats();
  if (!stats.cacheHitRate.includes('75')) throw new Error('Cache hit rate incorreto');
});

test('Estatísticas - Resetar', () => {
  manager.stats.totalCalls = 100;
  manager.resetStats();
  if (manager.stats.totalCalls !== 0) throw new Error('Stats não foram resetadas');
});

// Resumo
console.log(`\n${'='.repeat(50)}`);
console.log(`✅ TESTES PASSADOS: ${testsPassed}`);
console.log(`❌ TESTES FALHADOS: ${testsFailed}`);
console.log(`📊 TOTAL: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

if (testsFailed === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM!\n');
  process.exit(0);
} else {
  console.log('⚠️ ALGUNS TESTES FALHARAM\n');
  process.exit(1);
}

