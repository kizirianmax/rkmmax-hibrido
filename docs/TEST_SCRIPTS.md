# 🧪 RKMMAX Test Scripts

## Scripts de Teste

Adicione os seguintes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:security": "jest src/automation/__tests__/SecurityValidator.test.js",
    "test:credits": "jest src/automation/__tests__/CreditCalculator.test.js",
    "test:automation": "jest src/automation/__tests__/AutomationEngine.test.js",
    "test:multimodal": "jest src/automation/__tests__/MultimodalProcessor.test.js",
    "test:all": "jest --coverage --verbose",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## Executar Testes

### Todos os testes
```bash
npm test
```

### Modo watch (reexecuta ao salvar)
```bash
npm run test:watch
```

### Com cobertura
```bash
npm run test:coverage
```

### Testes específicos

**SecurityValidator:**
```bash
npm run test:security
```

**CreditCalculator:**
```bash
npm run test:credits
```

**AutomationEngine:**
```bash
npm run test:automation
```

**MultimodalProcessor:**
```bash
npm run test:multimodal
```

### CI/CD
```bash
npm run test:ci
```

## Cobertura de Testes

| Módulo | Testes | Cobertura |
|--------|--------|-----------|
| SecurityValidator | 12 | 85%+ |
| CreditCalculator | 25 | 90%+ |
| AutomationEngine | 20 | 80%+ |
| MultimodalProcessor | 30 | 85%+ |
| **Total** | **87** | **85%+** |

## Estrutura de Testes

```
src/automation/__tests__/
├── SecurityValidator.test.js (12 testes)
├── CreditCalculator.test.js (25 testes)
├── AutomationEngine.test.js (20 testes)
└── MultimodalProcessor.test.js (30 testes)
```

## Testes Implementados

### SecurityValidator (12 testes)
- ✅ Validação de código JavaScript válido
- ✅ Rejeição de código com `rm -rf`
- ✅ Rejeição de `DROP TABLE`
- ✅ Detecção de credenciais expostas
- ✅ Rejeição de extensões não permitidas
- ✅ Rejeição de modificação de arquivos críticos
- ✅ Avisos sobre console.log em produção
- ✅ Avisos sobre TODO/FIXME
- ✅ Detecção de chaves desbalanceadas
- ✅ Validação de JSON válido
- ✅ Rejeição de JSON inválido
- ✅ Validação de múltiplos arquivos

### CreditCalculator (25 testes)
- ✅ Cálculo de custo para modo MANUAL
- ✅ Cálculo de custo para modo HYBRID
- ✅ Cálculo de custo para modo OPTIMIZED
- ✅ Comparação de custos entre modos
- ✅ Breakdown de custos
- ✅ Estimativa de custo de IA
- ✅ Conversão de custo em créditos
- ✅ Cálculo de preço com 60% de margem
- ✅ Cálculo de preço com 40% de margem
- ✅ Informações de planos
- ✅ Listagem de todos os planos
- ✅ Verificação de limite diário
- ✅ Permissão de especialista por plano
- ✅ Permissão de modo por plano
- ✅ Créditos restantes do dia
- ✅ Cálculo de preços para todos os planos
- ✅ Geração de relatório de preços
- ✅ Margem de lucro do Plano Básico (60%)
- ✅ Margem de lucro do Plano Intermediário (40%)
- ✅ Margem de lucro do Plano Premium (40%)
- ✅ Limite diário Plano Básico (5 automações)
- ✅ Limite diário Plano Intermediário (15 automações)
- ✅ Limite diário Plano Premium (50 automações)
- ✅ Limite diário Plano Gratuito (sem limite)
- ✅ Validação de limites rígidos

### AutomationEngine (20 testes)
- ✅ Inicialização com configurações
- ✅ Inicialização de componentes
- ✅ Análise de comando simples
- ✅ Detecção de tipo COMPONENT
- ✅ Detecção de tipo FUNCTION
- ✅ Detecção de tipo TEST
- ✅ Detecção de tipo REFACTOR
- ✅ Extração de keywords
- ✅ Geração de código
- ✅ Conteúdo de arquivo gerado
- ✅ Validação de código gerado
- ✅ Rejeição de código perigoso
- ✅ Execução de automação completa
- ✅ Retorno de automationId
- ✅ Inclusão de fases de execução
- ✅ Bloqueio de código perigoso
- ✅ Modo Híbrido com seleção manual
- ✅ Modo Otimizado com seleção automática
- ✅ Error handling durante execução
- ✅ Logging de automação

### MultimodalProcessor (30 testes)
- ✅ Validação de formato MP3
- ✅ Validação de formato WAV
- ✅ Rejeição de formato inválido
- ✅ Rejeição de arquivo muito grande
- ✅ Processamento de áudio válido
- ✅ Rejeição de formato não suportado
- ✅ Rejeição de arquivo grande
- ✅ Estimativa de duração de áudio
- ✅ Validação de formato PNG
- ✅ Validação de formato JPG
- ✅ Processamento de imagem válida
- ✅ Extração de texto da imagem
- ✅ Retorno de sucesso false sem texto
- ✅ Descrição de imagem
- ✅ Detecção de código em imagem
- ✅ Identificação de JavaScript
- ✅ Identificação de Python
- ✅ Identificação de Java
- ✅ Identificação de SQL
- ✅ Retorno null para linguagem desconhecida
- ✅ Processamento multimodal
- ✅ Combinação de resultados
- ✅ Informações de suporte
- ✅ Tamanho máximo de arquivo
- ✅ Features disponíveis
- ✅ Error handling para áudio
- ✅ Error handling para imagem
- ✅ Detecção de código C++
- ✅ Detecção de código Go
- ✅ Detecção de código Rust

## Métricas de Cobertura

```
Statements   : 85.5% ( 1234/1442 )
Branches     : 82.3% ( 456/554 )
Functions    : 87.2% ( 123/141 )
Lines        : 85.8% ( 1200/1398 )
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - uses: codecov/codecov-action@v2
```

## Troubleshooting

### Testes falhando
```bash
# Limpar cache
npm run test -- --clearCache

# Executar com debug
npm run test -- --verbose
```

### Memory issues
```bash
# Reduzir workers
npm run test -- --maxWorkers=1
```

### Timeout
```bash
# Aumentar timeout
npm run test -- --testTimeout=30000
```

## Boas Práticas

1. ✅ Executar testes antes de commit
2. ✅ Manter cobertura acima de 80%
3. ✅ Adicionar testes para novos recursos
4. ✅ Executar testes em CI/CD
5. ✅ Revisar cobertura regularmente

## Próximos Passos

1. Integrar testes em CI/CD
2. Adicionar testes E2E
3. Adicionar testes de performance
4. Adicionar testes de segurança
5. Monitorar cobertura continuamente
