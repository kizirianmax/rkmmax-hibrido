# Auditoria Oficial — Variáveis de Ambiente Vercel

> **Status:** Concluída  
> **Data:** 2026-03-01  
> **Responsável:** Manus AI (auditoria autônoma)  
> **Escopo:** Todos os projetos da conta `kizirianmax` na Vercel  
> **Objetivo:** Identificar e remover variáveis obsoletas de provedores de IA (Gemini / Google AI)

---

## 1. Inventário Completo por Projeto

### 1.1 `rkmmax-hibrido`

| Variável | Ambientes | Tipo | Observação |
|---|---|---|---|
| `Key` | production, preview, development | encrypted | Placeholder — sem valor real configurado |
| `Value` | production, preview, development | encrypted | Placeholder — sem valor real configurado |

> **Nota:** O projeto `rkmmax-hibrido` possui apenas 2 variáveis placeholder na Vercel. As variáveis reais de produção devem ser configuradas conforme o `.env.example` do repositório.

---

### 1.2 `rkmmax-app`

| Variável | Ambientes | Tipo | Categoria |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | production, preview, development | encrypted | IA — Claude (Anthropic) |
| `GROQ_API_KEY` | production, preview | encrypted | IA — Groq |
| `CI` | production, preview | plain | CI/CD |
| `GITHUB_TOKEN` | preview, production | encrypted | CI/CD |
| `NEXTAUTH_SECRET` | production, preview, development | encrypted | Autenticação |
| `NEXTAUTH_URL` | production, preview, development | plain | Autenticação |
| `REACT_APP_SENTRY_DSN` | production, preview | encrypted | Monitoramento |
| `REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US` | production, preview, development | plain | Pagamentos |
| `REACT_APP_SUPABASE_ANON_KEY` | production, preview, development | encrypted | Banco de Dados |
| `REACT_APP_SUPABASE_URL` | production, preview, development | plain | Banco de Dados |
| `REACT_APP_TAVILY_API_KEY` | production, preview, development | encrypted | IA — Busca |

---

### 1.3 `kizi-agent`

| Variável | Ambientes | Tipo | Categoria |
|---|---|---|---|
| `VITE_GROQ_API_KEY` | production, preview, development | encrypted | IA — Groq |

---

### 1.4 `rkmmax-backup`

| Variável | Ambientes | Tipo | Categoria |
|---|---|---|---|
| `REACT_APP_SENTRY_DSN` | production, preview, development | encrypted | Monitoramento |
| `REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR` | production, preview, development | plain | Pagamentos |
| `REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US` | production, preview, development | plain | Pagamentos |

---

### 1.5 `formatador-abnt`

| Variável | Ambientes | Observação |
|---|---|---|
| — | — | Nenhuma variável configurada |

---

## 2. Varredura por Provedores de IA Obsoletos

**Padrões pesquisados:** `GEMINI`, `GOOGLE_AI`, `GOOGLE_GENERATIVE`, `GOOGLE_API_KEY`, `GEMINI_API`

| Projeto | Variáveis Gemini/Google AI encontradas | Ação |
|---|---|---|
| `rkmmax-hibrido` | **Nenhuma** | — |
| `rkmmax-app` | **Nenhuma** | — |
| `kizi-agent` | **Nenhuma** | — |
| `rkmmax-backup` | **Nenhuma** | — |
| `formatador-abnt` | **Nenhuma** | — |

> **Resultado:** Nenhuma variável relacionada a Gemini ou Google AI foi encontrada em nenhum dos 5 projetos da conta. O ambiente Vercel já está limpo dessas referências.

---

## 3. Análise das Variáveis de IA Ativas

### Provedores em uso (a manter intactos)

| Projeto | Variável | Provedor | Status no Código |
|---|---|---|---|
| `rkmmax-app` | `ANTHROPIC_API_KEY` | Anthropic (Claude) | ✅ **Em uso ativo** — `lib/claude-integration.js` + endpoint `/api/unified-claude` |
| `rkmmax-app` | `GROQ_API_KEY` | Groq | ✅ Em uso |
| `kizi-agent` | `VITE_GROQ_API_KEY` | Groq | ✅ Em uso |

### Referências de IA no código (sem variável correspondente na Vercel)

| Repositório | Arquivo | Referência | Status |
|---|---|---|---|
| `rkmmax-hibrido` | `src/api/ExternalAPIManager.js` | `process.env.ANTHROPIC_API_KEY` | ⚠️ Código morto — arquivo não é importado por nenhum endpoint serverless ativo |

---

## 4. Decisões e Ações Executadas

| Ação | Resultado |
|---|---|
| Remover variáveis Gemini/Google AI | ❌ **Não aplicável** — nenhuma variável desse tipo existe na Vercel |
| Remover `ANTHROPIC_API_KEY` | ❌ **Não executado** — variável está em uso ativo no `rkmmax-app` (endpoint `/api/unified-claude`) |
| Manter variáveis Groq | ✅ Mantidas intactas em todos os projetos |
| Manter variáveis de banco, autenticação, pagamentos | ✅ Mantidas intactas |

---

## 5. Recomendações

1. **`rkmmax-hibrido` — Configurar variáveis reais:** O projeto possui apenas placeholders na Vercel. Configurar as variáveis conforme o `.env.example` antes do próximo deploy.

2. **`rkmmax-hibrido` — `ExternalAPIManager.js`:** O arquivo referencia `ANTHROPIC_API_KEY` mas não é importado por nenhum endpoint ativo. Candidato a remoção na próxima rodada de limpeza de código morto.

3. **Monitoramento contínuo:** Recomenda-se repetir esta auditoria a cada trimestre ou após adição de novos provedores de IA.

---

*Documento gerado automaticamente via auditoria da API Vercel. Nenhuma variável foi alterada durante este processo.*
