# Checklist Operacional de Demonstração/Reprodutibilidade — F5-03

**Data:** 2026-05-25  
**Repositório:** `kizirianmax/rkmmax-hibrido`  
**Fase:** 5 — Confiabilidade de Banca e Prontidão Operacional  
**Tarefa:** F5-03 — Checklist operacional para banca/incubadora/demo  
**Escopo:** exclusivamente documental (`docs/audits/` + `CHECKLIST.md`)  
**Status:** ✅ Emitido

---

## Propósito

Este documento formaliza a sequência mínima, clara e reproduzível de validação que qualquer avaliador interno deve executar antes de apresentação em banca, incubadora, reunião de investidores ou gravação de demo.

O objetivo é garantir que o estado do repositório seja verificável e que a apresentação reflita a realidade técnica do projeto sem ambiguidade.

---

## 1. Pré-requisitos

| Requisito | Verificação |
|---|---|
| Node.js ≥ 20 (`.nvmrc` define a versão exata) | `node --version` |
| Dependências instaladas | `npm install --legacy-peer-deps` |
| Arquivo `.env.local` configurado (variáveis listadas em `.env.example`) | Confirmar existência local |

> **Nota:** `.env.local` nunca é commitado. Em CI/CD (Vercel), as variáveis são configuradas no painel da Vercel.

---

## 2. Sequência de Validação Técnica (Pré-Demo)

Execute os passos **nesta ordem** antes de qualquer apresentação:

### 2.1 — Lint

```bash
npm run lint
```

**Resultado esperado:** execução sem erros (`exit 0`). Warnings existentes no baseline são aceitáveis (dívida técnica controlada, não bloqueante). Erros novos devem ser investigados antes da apresentação.

**Baseline F5 (referência):** 258 warnings / 0 errors após F5-01.

---

### 2.2 — Build de produção

```bash
npm run build
```

**Resultado esperado:** `dist/` gerado sem erros. Confirmar que a saída contém `index.html` e assets estáticos.

---

### 2.3 — Suíte de testes

```bash
npm test -- --runInBand
```

**Resultado esperado:** todas as suítes passam. Nenhum teste pode falhar antes de uma apresentação.

**Baseline F5 (referência):** 66 suítes / 2455 testes PASS após F5-02.

> `--runInBand` garante execução serial, evitando falsos negativos por race condition em CI.

---

## 3. Verificação das Rotas Públicas

As rotas abaixo são a **vitrine pública** do projeto e devem funcionar sem autenticação:

| Rota | Componente | Verificação |
|---|---|---|
| `/demo` | `Demo.jsx` | Renderiza galeria de casos com status badges, botões "Ver exemplo"/"Ver estrutura" funcionando |
| `/demo-autoplay` | `DemoAutoplay.jsx` | Reproduz demonstração automática sem interação manual |
| `/startup` | `Projects.jsx` | Exibe projetos de portfólio/startup |
| `/showcase` | (redirect) | Redireciona corretamente para `/demo` (confirmado em `App.jsx`: `<Navigate to="/demo" replace />`) |

**Como verificar:** após `npm run build`, executar `npm run preview` (ou `vite preview`) e navegar para cada rota. Alternativa: abrir o ambiente de staging/produção na Vercel antes da apresentação.

---

## 4. Confirmação de Rotas Privadas

### 4.1 — `/hybrid` continua exigindo autenticação

A rota `/hybrid` dá acesso ao **Híbrido/Construtor** (geração, validação, preview, revisão e exportação de artefatos). Ela é intencionalmente limitada a usuários autenticados via Supabase Auth.

**Verificação:**
1. Acessar `/hybrid` sem login ativo.
2. Confirmar que o componente `HybridAgentSimple.jsx` verifica sessão via `supabase.auth.getSession()` antes de chamar qualquer endpoint de IA.
3. Chamadas sem `access_token` válido são bloqueadas no backend (`/api/chat`).

> **Confirmação arquitetural:** `/hybrid` usa `supabase.auth.getSession()` em todas as chamadas de backend (linhas 383, 447, 574 de `HybridAgentSimple.jsx`). O backend valida o token antes de processar.

---

## 5. Garantias Arquiteturais a Confirmar Antes da Demo

### 5.1 — Transparência: a demo NÃO promete IA em tempo real

A vitrine `/demo` exibe **casos fixos/fixture estática** para demonstração. Os resultados exibidos são exemplos pré-definidos, não geração ao vivo de IA.

**Onde confirmar:** `Demo.jsx` e os dados de fixture (não há chamada a `/api/chat` ou `/api/chat-stream` na rota `/demo`). O badge de status e a seção "Rastreabilidade" de cada card deixam explícito que o resultado é um artefato estruturado, não uma resposta em tempo real.

**Instrução para apresentador:** ao mostrar `/demo`, deixar claro que a galeria é uma vitrine de exemplos reais gerados pela plataforma — não geração ao vivo.

---

### 5.2 — Sem bypass do Serginho

O **Serginho** é o orquestrador soberano. Nenhuma rota, componente ou endpoint pode chamar modelos de IA diretamente sem passar pelo Serginho ou pelo pipeline de orquestração designado.

**Verificação:**
- Frontend **nunca** chama a Groq API diretamente (sem chaves expostas no bundle).
- Toda chamada de IA passa por `/api/chat` ou `/api/chat-stream` no backend.
- `serginho-orchestrator.js` é o único ponto de cascata de modelos.

**Como confirmar:** executar `npm run build` e inspecionar `dist/assets/*.js` — nenhuma string `GROQ_API_KEY` ou `gsk_` deve aparecer no bundle.

---

### 5.3 — `executeArtifact` continua desativado

A execução direta de artefatos (sandbox real) permanece **intencionalmente desativada** por decisão arquitetural de segurança.

**Onde confirmar:** `docs/audits/P4-artifactRunner-audit.md` documenta a decisão. Código de execução não está presente no pipeline ativo.

**Instrução para apresentador:** ao mostrar o preview do artefato gerado, deixar claro que o painel exibe uma **visualização estruturada** do artefato — não execução de código arbitrário. A sandbox real é trilha futura com gate de segurança explícito (F5-04).

---

## 6. Roteiro Sugerido para Apresentação Curta (≤ 10 minutos)

| # | O que mostrar | Rota / Área | Duração sugerida |
|---|---|---|---|
| 1 | Vitrine pública — galeria de casos | `/demo` | 2 min |
| 2 | Demo autoplay — fluxo automático | `/demo-autoplay` | 2 min |
| 3 | Login e acesso ao Construtor | `/login` → `/hybrid` | 1 min |
| 4 | Geração de artefato real (ao vivo ou gravado) | `/hybrid` | 3 min |
| 5 | Validação/preview do artefato gerado | `/hybrid` (painel lateral) | 1 min |
| 6 | Especialistas disponíveis | `/specialists` | 30 s |

> **Dica:** se a conexão de rede for incerta, gravar a etapa 4 com antecedência e exibir o vídeo. Deixar claro para a banca que é uma gravação real, não simulação.

---

## 7. Limites Conhecidos e Avisos ao Apresentador

| Limite | Orientação |
|---|---|
| Demo em `/demo` usa fixture estática | Informar explicitamente — não é geração ao vivo |
| `/hybrid` requer Supabase Auth ativo e `GROQ_API_KEY` configurada | Testar login e geração antes da apresentação |
| Warnings de lint no baseline (258 warnings) | São dívida técnica controlada, não erros — não impactam funcionalidade |
| `executeArtifact` desativado | Preview de artefato é visualização, não execução — deixar claro |
| Cascata de modelos (Groq) pode ter latência variável | Testar conexão antes; ter gravação de backup disponível |
| Sandbox real (F5-04) não está implementada | Não prometer para banca — registrar como trilha futura |

---

## 8. Confirmação de Integridade Arquitetural

Antes de qualquer apresentação, confirmar que os seguintes invariantes estão preservados:

| Invariante | Status a confirmar |
|---|---|
| Serginho = orquestrador soberano | ✅ Sem bypass direto a modelos |
| `executeArtifact` desativado | ✅ Sem execução de código arbitrário |
| Frontend sem chaves de API expostas | ✅ Confirmar no bundle gerado |
| `/hybrid` protegido por auth | ✅ Sem acesso sem sessão válida |
| Rotas públicas funcionando | ✅ `/demo`, `/demo-autoplay`, `/startup`, `/showcase` |
| Build e testes verdes | ✅ Baseline F5 |

---

## 9. Rollback de Emergência

Se um problema crítico for descoberto imediatamente antes da apresentação:

```bash
# Reverter o último commit de este PR
git revert <commit-sha>

# Para reverter múltiplos PRs da Fase 5 de uma vez
git revert F5-03-sha F5-02-sha F5-01-sha
```

O baseline pré-Fase 5 (pós-Fase 4) era estável para apresentação. Em caso de dúvida, usar o último tag/commit da Fase 4 e comunicar claramente o que está sendo apresentado.

---

## 10. Referências

- `CHECKLIST.md` — histórico consolidado F1 → F5
- `docs/audits/fase-4-para-fase-5-auditoria-transicao-2026-05-25.md` — decisão formal da Fase 5
- `docs/audits/fase4-demo-showcase-final-audit-2026-05-25.md` — auditoria final da Fase 4
- `docs/audits/P4-artifactRunner-audit.md` — decisão sobre executeArtifact
- `src/App.jsx` — roteamento e proteção de rotas
- `api/lib/serginho-orchestrator.js` — orquestrador Serginho
