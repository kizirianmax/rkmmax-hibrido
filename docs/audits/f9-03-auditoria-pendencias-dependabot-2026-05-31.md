# F9-03 — Auditoria controlada das pendências Dependabot

## 1) Identificação

- **ID:** `F9-03`
- **Nome:** Auditoria controlada das pendências Dependabot
- **Data de referência:** `2026-05-31`
- **Tipo:** documental / governança / decisão técnica
- **Repositório auditado:** `kizirianmax/rkmmax-hibrido`
- **Escopo:** auditoria sem atualização de dependências

## 2) Veredito geral

- F9-03 é o **Bloco 3 da Fase 9**.
- Esta tarefa **não atualiza dependências**.
- `#475` e `#477` **não devem ser tratados juntos** em implementação.
- Qualquer avanço técnico deve ocorrer em **PR isolado e posterior**.
- `#477` deve ser tratado como **risco técnico maior** por envolver `archiver` em upgrade major e potencial breaking change.
- `#475` deve ser tratado como **risco menor/isolado**, sem mistura com Auth/SaaS/Payments.

## 3) Auditoria do Dependabot #475

- **PR:** `#475` (estado atual: **open**, não mergeado)
- **Pacote:** `@stripe/stripe-js`
- **Versão atual:** `9.2.0`
- **Versão proposta:** `9.6.0`
- **Área provável impactada:** camada de integração frontend de Stripe.js (se/onde existir uso futuro).

### Uso real no repositório (inspeção estática)

- Declarado em `package.json` como dependência direta: `"@stripe/stripe-js": "^9.2.0"`.
- Presente em `package-lock.json` com resolução `9.2.0`.
- Busca por `@stripe/stripe-js` e `loadStripe` em `src/` e `api/`: **sem uso ativo encontrado em código funcional** nesta auditoria.

### Risco

- **Baixo a moderado** no estado atual (sem evidência de uso ativo em runtime), com risco principal de alteração indireta de tipagem/comportamento em futura ativação de Stripe.js no frontend.

### Recomendação

- **Manter pendente e tratar em PR técnico isolado futuro** (não misturar com `#477` e não misturar com Auth/SaaS/Payments).
- Não alterar nada nesta tarefa documental.

## 4) Auditoria do Dependabot #477

- **PR:** `#477` (estado atual: **open**, não mergeado)
- **Pacote:** `archiver`
- **Versão atual:** `7.0.1`
- **Versão proposta:** `8.0.0`
- **Área provável impactada:** pipeline de artefatos/ZIP/exportação do Construtor/Híbrido.

### Uso real no repositório (inspeção estática)

- Declarado em `package.json` como dependência direta: `"archiver": "^7.0.1"`.
- Presente em `package-lock.json` com resolução `7.0.1`.
- Uso direto em `src/lib/construtor/artifactPackager.js`:
  - `import archiver from 'archiver';`
  - criação de ZIP com `archiver('zip', { zlib: { level: 6 } })`.
- Área conectada ao pipeline de artefatos/exportação com dependência operacional de empacotamento.

### Risco

- **Alto** por upgrade **major** (`7.x` → `8.x`) e possibilidade real de breaking change de import/compatibilidade (incluindo mudanças ESM/export).

### Recomendação

- **Não aceitar automaticamente**.
- Tratar **somente** em PR técnico isolado, com adaptação explícita de código e testes dedicados antes de eventual merge.
- Não alterar nada nesta tarefa documental.

## 5) Decisão recomendada

- Decidir `#475` e `#477` **separadamente**.
- **Não misturar** ambos no mesmo PR técnico.
- **Não misturar** com F9-04, tag/release, Auth/SaaS/Payments, Stripe funcional ou runtime do Construtor.
- **Ordem mais segura recomendada:**
  1. `#475` (risco menor/isolado) em PR técnico próprio, se aprovado pelo owner.
  2. `#477` (risco maior/major) em PR técnico próprio, com adaptação + testes.

## 6) Pendências preservadas

- `#475`.
- `#477`.
- Validação visual manual controlada.
- Observabilidade real.
- Métricas reais.
- Telemetria real.
- Tag/release futura.
- Implementação funcional futura.

## 7) Critério de sucesso

- Documento criado.
- `CHECKLIST.md` atualizado no topo.
- Nenhuma dependência alterada.
- `package.json` e `package-lock.json` intactos.
- Decisão clara para `#475`.
- Decisão clara para `#477`.
- Riscos documentados sem overclaim.

## 8) Declaração de não alteração funcional

Esta tarefa não altera runtime, UI, código, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional.

## 9) Rollback

`git revert <commit-sha>`
