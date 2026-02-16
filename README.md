⚠️ POLÍTICA DE DESENVOLVIMENTO - Este é um projeto individual desenvolvido por @kizirianmax. Regra absoluta: Todo merge na branch main é feito APENAS com todos os testes passando (CI verde). Veja detalhes completos em DEVELOPMENT_GUIDELINES.md


# Existing Content

[Existing content of the README.md file goes here]

## 🛡️ Circuit Breaker Pattern

Protects against serverless timeouts with automatic failover:

- **8s timeout** per operation (4s margin for 12s Vercel limit)
- **3-state pattern:** CLOSED → OPEN → HALF_OPEN
- **Auto-recovery:** Retries after cooldown period

```javascript
import CircuitBreaker from './api/lib/circuit-breaker.js';

const breaker = new CircuitBreaker({
  timeout: 8000,
  failureThreshold: 3,
  resetTimeout: 60000
});

const result = await breaker.execute(async () => {
  return await callExternalAPI();
});
```