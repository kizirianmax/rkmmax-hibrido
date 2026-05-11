# P5 — Página pública de métricas/status do Construtor/Híbrido

**Data:** 2026-05-11
**Roadmap:** P5 Sebrae/USP/SciBiz

---

## Registro de conclusão

| Item | Detalhe |
|------|---------|
| **O quê** | Criação da página pública `/status` — métricas e status demonstrativos do Construtor/Híbrido do Serginho IA para avaliadores externos |
| **Por quê** | P5 do roadmap: após P4 (auditoria documental de `artifactRunner.js`), entregar página pública de status sem login e sem expor dados sensíveis |
| **Arquivos** | `src/pages/PublicStatus.jsx` (NOVO), `src/pages/PublicStatus.css` (NOVO), `src/App.jsx` (rota `/status` atualizada de `<Help />` para `<PublicStatus />`), `docs/P5-status-publico.md` (este arquivo) |
| **Escopo** | Frontend estático puro. Nenhuma camada interna (Serginho, Especialistas, ABNT, API, auth, Supabase, Stripe, billing, Vercel, providers) foi alterada. `artifactRunner.js` intocado. Nenhuma dependência adicionada |
| **AuthGate** | `src/auth/AuthGate.jsx` já listava `/status` como rota pública — **nenhuma alteração necessária** |

---

## Conteúdo da página `/status`

1. **Aviso público** — destaque claro de que a página é demonstrativa, não expõe dados reais de produção
2. **Status da demo** — `/demo` operacional, `/demo-autoplay` disponível, vídeo demo P3 publicado
3. **Links** — `/demo` e vídeo YouTube registrado em `docs/DEMO.md`
4. **5 artefatos demonstráveis** — listados via `demoArtifacts.js` (sem duplicação de dados)
5. **Status do pipeline** — geração, validação, preview, revisão, empacotamento
6. **Status documental** — P1, P2, P3 e P4 concluídos
7. **Seção "O que não é exposto"** — lista explícita

---

## Ajustes arquiteturais aplicados

- Nomes de providers removidos → **"Providers de IA, configurações de modelo ou chaves de integração"**
- Linguagem de vitrine pública (demonstrável), não de validação em tempo real
- Scores → **"Scores demonstrativos exibidos na vitrine pública"**
- Frase da vitrine → **"A vitrine pública apresenta os seguintes tipos de artefatos digitais demonstráveis."**

---

## Validação manual

| # | Validação | Resultado esperado |
|---|-----------|-------------------|
| 1 | Acessar `/status` sem login | Página carrega com aviso, status, artefatos, pipeline, docs e seção de não-exposição |
| 2 | Links `/demo` e vídeo YouTube | Funcionais |
| 3 | Rotas existentes intactas | `/`, `/serginho`, `/hybrid`, `/specialists`, `/demo`, `/demo-autoplay` |
| 4 | `npm run build` | Sem erros |
| 5 | `npm test -- --runInBand` | Sem regressão (nenhuma lógica de negócio alterada) |

---

## Rollback

```bash
git revert 463725df178ee31ff99c85700fb3c84d4d60d9c3
# Remove PublicStatus.jsx, PublicStatus.css, reverte App.jsx → <Help /> em /status
```

---

## O que não é exposto pela página `/status`

- ❌ Autenticação, sessões ou dados de usuários reais
- ❌ Supabase, banco de dados ou registros de assinaturas
- ❌ Stripe, billing ou dados financeiros
- ❌ Providers de IA, configurações de modelo ou chaves de integração
- ❌ Segredos, variáveis de ambiente ou credenciais
- ❌ Dados reais de produção de qualquer natureza
- ❌ Camada interna do Serginho IA (orquestrador soberano)
- ❌ Especialistas de domínio ou camada ABNT
