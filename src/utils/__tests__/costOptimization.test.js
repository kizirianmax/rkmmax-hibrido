/**
 * COST OPTIMIZATION SYSTEM TESTS
 * Testes unitários para o sistema de otimização de custo
 */

import {
  responseCache,
  compressPrompt,
  deduplicateMessages,
  estimateTokens,
} from '../costOptimization.js';

describe('Cost Optimization System', () => {
  describe('ResponseCache', () => {
    beforeEach(() => {
      responseCache.clear();
    });

    describe('generateHash', () => {
      test('deve gerar hash MD5 consistente para mesmas mensagens', () => {
        const messages = [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ];

        const hash1 = responseCache.generateHash(messages);
        const hash2 = responseCache.generateHash(messages);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(32); // MD5 hash length
      });

      test('deve gerar hashes diferentes para mensagens diferentes', () => {
        const messages1 = [{ role: 'user', content: 'Hello' }];
        const messages2 = [{ role: 'user', content: 'Goodbye' }];

        const hash1 = responseCache.generateHash(messages1);
        const hash2 = responseCache.generateHash(messages2);

        expect(hash1).not.toBe(hash2);
      });

      test('deve funcionar com arrays de objetos', () => {
        const messages = [
          { role: 'user', content: 'Question 1' },
          { role: 'assistant', content: 'Answer 1' },
          { role: 'user', content: 'Question 2' },
        ];

        const hash = responseCache.generateHash(messages);

        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash).toHaveLength(32);
      });
    });

    describe('get', () => {
      test('deve retornar null para cache miss', () => {
        const messages = [{ role: 'user', content: 'New message' }];
        const result = responseCache.get(messages);

        expect(result).toBeNull();
      });

      test('deve retornar resposta cacheada para cache hit', () => {
        const messages = [{ role: 'user', content: 'Test message' }];
        const response = 'Cached response';

        // Salvar no cache
        responseCache.set(messages, response);

        // Buscar do cache
        const result = responseCache.get(messages);

        expect(result).toBe(response);
      });

      test('deve retornar null para cache expirado (TTL)', () => {
        // Criar cache com TTL muito curto (1ms)
        const shortTTLCache = new (responseCache.constructor)(1000, 1);
        const messages = [{ role: 'user', content: 'Expiring message' }];
        const response = 'Will expire';

        // Salvar no cache
        shortTTLCache.set(messages, response);

        // Aguardar expiração
        return new Promise((resolve) => {
          setTimeout(() => {
            const result = shortTTLCache.get(messages);
            expect(result).toBeNull();
            resolve();
          }, 10);
        });
      });
    });

    describe('set', () => {
      test('deve salvar resposta no cache', () => {
        const messages = [{ role: 'user', content: 'Save this' }];
        const response = 'Saved response';

        responseCache.set(messages, response);
        const result = responseCache.get(messages);

        expect(result).toBe(response);
      });

      test('deve limpar cache mais antigo quando atingir maxSize', () => {
        // Criar cache com tamanho máximo de 2
        const smallCache = new (responseCache.constructor)(2, 3600000);

        const messages1 = [{ role: 'user', content: 'Message 1' }];
        const messages2 = [{ role: 'user', content: 'Message 2' }];
        const messages3 = [{ role: 'user', content: 'Message 3' }];

        // Adicionar 3 itens (deve remover o primeiro)
        smallCache.set(messages1, 'Response 1');
        smallCache.set(messages2, 'Response 2');
        smallCache.set(messages3, 'Response 3');

        // O primeiro deve ter sido removido
        expect(smallCache.get(messages1)).toBeNull();
        // Os outros dois devem existir
        expect(smallCache.get(messages2)).toBe('Response 2');
        expect(smallCache.get(messages3)).toBe('Response 3');
      });
    });

    describe('clear', () => {
      test('deve limpar todos os itens do cache', () => {
        const messages1 = [{ role: 'user', content: 'Message 1' }];
        const messages2 = [{ role: 'user', content: 'Message 2' }];

        responseCache.set(messages1, 'Response 1');
        responseCache.set(messages2, 'Response 2');

        expect(responseCache.get(messages1)).toBe('Response 1');
        expect(responseCache.get(messages2)).toBe('Response 2');

        responseCache.clear();

        expect(responseCache.get(messages1)).toBeNull();
        expect(responseCache.get(messages2)).toBeNull();
      });
    });

    describe('stats', () => {
      test('deve retornar estatísticas do cache', () => {
        const messages = [{ role: 'user', content: 'Test' }];
        responseCache.set(messages, 'Response');

        const stats = responseCache.stats();

        expect(stats).toHaveProperty('size');
        expect(stats).toHaveProperty('maxSize');
        expect(stats).toHaveProperty('ttl');
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.maxSize).toBe(1000);
        expect(stats.ttl).toBe(3600000);
      });
    });
  });

  describe('compressPrompt', () => {
    test('deve remover múltiplos espaços', () => {
      const prompt = 'This   has    multiple     spaces';
      const result = compressPrompt(prompt);

      expect(result).toBe('This has multiple spaces');
    });

    test('deve remover quebras de linha desnecessárias', () => {
      const prompt = 'Line 1\n\n\n\nLine 2';
      const result = compressPrompt(prompt);

      // A função atual converte todos os espaços em brancos em um único espaço
      expect(result).toBe('Line 1 Line 2');
    });

    test('deve fazer trim do texto', () => {
      const prompt = '   Text with spaces   ';
      const result = compressPrompt(prompt);

      expect(result).toBe('Text with spaces');
    });

    test('deve aplicar todas as otimizações juntas', () => {
      const prompt = '  This   has   \n\n\n  multiple    issues  \n\n\n  ';
      const result = compressPrompt(prompt);

      // A função atual converte todos os espaços em brancos em um único espaço
      expect(result).toBe('This has multiple issues');
    });

    test('deve manter texto já otimizado inalterado', () => {
      const prompt = 'Already optimized text';
      const result = compressPrompt(prompt);

      expect(result).toBe('Already optimized text');
    });
  });

  describe('deduplicateMessages', () => {
    test('deve remover mensagens duplicadas consecutivas', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ];

      const result = deduplicateMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello');
      expect(result[1].content).toBe('Hi');
    });

    test('deve manter mensagens não-consecutivas duplicadas', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
        { role: 'user', content: 'Hello' },
      ];

      const result = deduplicateMessages(messages);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('Hello');
      expect(result[1].content).toBe('Hi');
      expect(result[2].content).toBe('Hello');
    });

    test('deve retornar array vazio para input vazio', () => {
      const messages = [];
      const result = deduplicateMessages(messages);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('deve manter mensagens únicas inalteradas', () => {
      const messages = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
      ];

      const result = deduplicateMessages(messages);

      expect(result).toHaveLength(3);
      expect(result).toEqual(messages);
    });

    test('deve lidar com múltiplas duplicatas consecutivas', () => {
      const messages = [
        { role: 'user', content: 'Same' },
        { role: 'user', content: 'Same' },
        { role: 'user', content: 'Same' },
        { role: 'assistant', content: 'Different' },
      ];

      const result = deduplicateMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Same');
      expect(result[1].content).toBe('Different');
    });
  });

  describe('estimateTokens', () => {
    test('deve estimar tokens baseado em caracteres', () => {
      const text = 'This is a test message';
      const tokens = estimateTokens(text);

      // Estimativa: ~4 caracteres = 1 token
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBe(Math.ceil(text.length / 4));
    });

    test('deve retornar 0 para string vazia', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });

    test('deve calcular tokens para textos longos', () => {
      const longText = 'a'.repeat(1000);
      const tokens = estimateTokens(longText);

      expect(tokens).toBe(250); // 1000 / 4 = 250
    });

    test('deve arredondar para cima', () => {
      const text = 'abc'; // 3 caracteres
      const tokens = estimateTokens(text);

      expect(tokens).toBe(1); // Math.ceil(3 / 4) = 1
    });
  });

  describe('limitContext', () => {
    test('deve manter todas as mensagens se dentro do limite', () => {
      const messages = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ];

      // Importar limitContext diretamente
      const { limitContext } = require('../costOptimization.js');
      const result = limitContext(messages, 1000);

      expect(result).toHaveLength(2);
      expect(result).toEqual(messages);
    });

    test('deve limitar mensagens quando exceder maxTokens', () => {
      const { limitContext } = require('../costOptimization.js');
      const messages = [
        { role: 'user', content: 'a'.repeat(2000) }, // ~500 tokens
        { role: 'assistant', content: 'b'.repeat(2000) }, // ~500 tokens
        { role: 'user', content: 'c'.repeat(8000) }, // ~2000 tokens
      ];

      const result = limitContext(messages, 2500);

      // Deve manter apenas as mensagens mais recentes que cabem no limite
      expect(result.length).toBeLessThan(messages.length);
    });

    test('deve manter mensagens recentes primeiro', () => {
      const { limitContext } = require('../costOptimization.js');
      const messages = [
        { role: 'user', content: 'Old message' },
        { role: 'assistant', content: 'Recent reply' },
      ];

      const result = limitContext(messages, 10); // Limite muito baixo

      // Deve manter apenas a mensagem mais recente
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1].content).toContain('reply');
    });
  });

  describe('cacheResponse', () => {
    test('deve salvar resposta no cache global', () => {
      const { cacheResponse } = require('../costOptimization.js');
      const messages = [{ role: 'user', content: 'Cache test' }];
      const response = 'Cached via cacheResponse';

      cacheResponse(messages, response);

      // Verificar que foi salvo
      const cached = responseCache.get(messages);
      expect(cached).toBe(response);
    });
  });

  describe('getCostStats', () => {
    test('deve retornar estatísticas de custo', () => {
      const { getCostStats } = require('../costOptimization.js');
      const stats = getCostStats();

      expect(stats).toHaveProperty('cache');
      expect(stats.cache).toHaveProperty('size');
      expect(stats.cache).toHaveProperty('maxSize');
      expect(stats.cache).toHaveProperty('ttl');
    });
  });
});
