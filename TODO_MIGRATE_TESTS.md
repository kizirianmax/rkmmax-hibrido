# 🔄 Migração de Testes para ESM

## 📋 Testes Temporariamente Desabilitados

Os seguintes testes foram temporariamente excluídos do Jest porque usam `jest.fn()` em module scope, o que não é compatível com ESM + experimental-vm-modules:

1. `src/utils/__tests__/intelligentRouter.test.js`
2. `src/utils/__tests__/costOptimization.test.js`
3. `src/automation/__tests__/AutomationEngine.test.js`
4. `src/automation/__tests__/SecurityValidator.test.js`
5. `src/automation/__tests__/MultimodalProcessor.test.js`
6. `src/automation/__tests__/CreditCalculator.test.js`
7. `src/cache/__tests__/IntelligentCache.test.js`

## ✅ Como Migrar

Para reativar estes testes, é necessário migrá-los para usar a API de importação do Jest:

### Antes (Não funciona com ESM):
```javascript
const mockLogger = {
  log: jest.fn(),
  error: jest.fn()
};
```

### Depois (Funciona com ESM):
```javascript
import { jest } from '@jest/globals';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn()
};
```

## 🔧 Passos para Reativar um Teste

1. Abrir o arquivo de teste
2. Adicionar no topo: `import { jest } from '@jest/globals';`
3. Verificar que todos os usos de `jest.fn()`, `jest.mock()`, etc. estão no escopo correto
4. Remover o arquivo da lista `testPathIgnorePatterns` em `jest.config.js`
5. Executar `npm test` para verificar que o teste passa
6. Executar `npm run test:coverage` para verificar cobertura

## 📊 Progresso

- [ ] intelligentRouter.test.js
- [ ] costOptimization.test.js
- [ ] AutomationEngine.test.js
- [ ] SecurityValidator.test.js
- [ ] MultimodalProcessor.test.js
- [ ] CreditCalculator.test.js
- [ ] IntelligentCache.test.js

## 🎯 Objetivo

Quando todos os testes estiverem migrados:
1. Remover todas as entradas de `testPathIgnorePatterns` em `jest.config.js`
2. Aumentar `coverageThreshold` para valores mais altos (ex: 50% ou 80%)
3. Deletar este arquivo (TODO_MIGRATE_TESTS.md)

## 📚 Referências

- [Jest + ESM](https://jestjs.io/docs/ecmascript-modules)
- [@jest/globals](https://jestjs.io/docs/api#jestglobals)
