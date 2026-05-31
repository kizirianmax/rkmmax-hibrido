# F9-04 — Validação visual manual controlada

## 1) Identificação

- **ID:** `F9-04`
- **Nome:** Validação visual manual controlada
- **Data de referência:** `2026-05-31`
- **Tipo:** documental / checklist / validação manual
- **Repositório auditado:** `kizirianmax/rkmmax-hibrido`
- **Escopo:** checklist de validação visual manual, sem alteração funcional

## 2) Veredito

- F9-04 é o Bloco 4 da Fase 9.
- Esta tarefa não altera UI, código, rotas ou runtime.
- A validação visual deve ser tratada como checklist controlado.
- Como não houve execução visual real nesta tarefa, o checklist fica pendente para execução manual pelo owner.
- Não declarar tela validada sem evidência visual/runtime.

## 3) Checklist de rotas públicas

| Rota | Objetivo da verificação | Resultado | Evidência | Observações |
|------|--------------------------|-----------|-----------|-------------|
| `/` | Confirmar renderização visual da página pública inicial sem regressões aparentes. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |
| `/startup` | Confirmar página institucional pública e ausência de seletor de IA. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Ausência de seletor é comportamento esperado. |
| `/demo` | Confirmar renderização visual da rota pública de demonstração. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |
| `/demo-autoplay` | Confirmar renderização visual da rota pública de autoplay da demo. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |
| `/showcase` | Confirmar renderização visual da vitrine pública. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |
| `/login` | Confirmar renderização visual da rota pública de autenticação. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |

## 4) Checklist de UIs operacionais

| UI operacional | O que verificar | Resultado | Evidência | Observações |
|----------------|-----------------|-----------|-----------|-------------|
| Serginho IA | Validar renderização visual da UI operacional e presença do seletor de IA. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |
| Híbrido/Construtor | Validar renderização visual da UI operacional e presença do seletor de IA. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |
| Especialistas | Validar renderização visual da UI operacional e presença do seletor de IA. | Pendente de validação manual pelo owner | Não anexada nesta tarefa | Verificação manual controlada pendente. |

## 5) Regra específica sobre `/startup`

- `/startup` é página institucional pública.
- `/startup` não deve ter seletor de IA.
- Ausência de seletor em `/startup` é comportamento arquitetural esperado.
- Esta tarefa não altera `/startup`.

## 6) Regra específica sobre seletor de IA

- O seletor de IA pertence às UIs operacionais: Serginho IA, Híbrido/Construtor e Especialistas.
- Esta tarefa não comprova renderização visual/runtime sem evidência visual anexada.
- A verificação real do seletor permanece dependente de execução manual pelo owner.

## 7) Pendências preservadas

- Dependabot #475.
- Dependabot #477.
- Tag/release futura.
- Observabilidade real.
- Métricas reais.
- Telemetria real.
- Implementação funcional futura.
- Qualquer evolução de Auth/SaaS/Payments.
- Qualquer alteração em providers/modelos/prompts/registry/fallback.
- Qualquer alteração no Serginho, Híbrido/Construtor, Especialistas ou ABNT.

## 8) Critério de sucesso desta tarefa

- Documento F9-04 criado.
- CHECKLIST.md atualizado no topo.
- Nenhuma alteração funcional.
- Checklist visual manual claro e executável pelo owner.
- Nenhuma evidência inventada.
- Nenhum overclaim de validação visual/runtime.

## 9) Declaração de não alteração funcional

Esta tarefa não altera runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional.

## 10) Rollback

`git revert <commit-sha>`
