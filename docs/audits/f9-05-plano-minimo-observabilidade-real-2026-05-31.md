# F9-05 — Plano mínimo de observabilidade real sem implementação externa

## 1) Identificação

- ID: `F9-05`
- Nome: Plano mínimo de observabilidade real sem implementação externa
- Data de referência: `2026-05-31`
- Tipo: documental / governança / planejamento de observabilidade
- Repositório auditado: `kizirianmax/rkmmax-hibrido`
- Escopo: plano documental de observabilidade futura, sem implementação funcional

## 2) Veredito

- F9-05 é o Bloco 5 da Fase 9.
- Esta tarefa não implementa observabilidade real.
- Esta tarefa não cria dashboard, endpoint, integração externa ou telemetria nova.
- O objetivo é definir um plano mínimo e seguro de métricas/sinais futuros.
- Nenhuma métrica deve ser tratada como existente sem evidência real.

## 3) Estado atual da observabilidade

- `/api/health` existe como referência de saúde mínima, confirmado no repositório (`api/health.js`).
- Há documentação anterior sobre observabilidade mínima da camada IA/providers, confirmada em `docs/audits/f8-obs-05-observabilidade-camada-ia-providers-serginho-2026-05-30.md`.
- Há checks/CI no GitHub Actions, com workflows confirmados em `.github/workflows/coverage.yml` e `.github/workflows/test.yml`.
- Há Vercel Preview/Deploy como sinal externo de deploy, mas esta tarefa não acessa dashboards externos.
- Não há comprovação nesta tarefa de dashboard real, telemetria persistente, SLA, p95/p99, uptime, custo real, usuários reais, clientes ou receita.

## 4) Métricas futuras mínimas recomendadas

| Métrica futura | Por que importa | Camada relacionada | Status atual | Como poderia ser medida no futuro | Risco de overclaim |
|---|---|---|---|---|---|
| disponibilidade básica do `/api/health` | detectar indisponibilidade mínima da API | API pública mínima de saúde | não medido nesta tarefa | coleta periódica de sucesso/falha por janela de tempo | alto se for tratado como uptime real já comprovado |
| taxa de erro por endpoint crítico | identificar degradação funcional | APIs operacionais (`/api/ai`, `/api/artifact`, `/api/artifact-preview`) | não medido nesta tarefa | contagem de respostas de erro por endpoint e período | alto se for apresentado como confiabilidade validada |
| latência por endpoint crítico | monitorar experiência e gargalos | APIs operacionais e rota de saúde | não medido nesta tarefa | distribuição de tempo de resposta por endpoint (p50/p95/p99 somente após dados reais) | alto se p95/p99 for declarado sem medição real |
| falhas por provider/modelo | separar falha de orquestração e falha de motor | camada de execução/modelo abaixo do Serginho | documentado, mas sem telemetria real comprovada nesta tarefa | registro de erro com `provider` e `model` em eventos padronizados | alto se atribuir estabilidade real sem base empírica |
| fallback acionado por provider/modelo | verificar resiliência da execução de IA | orquestração do Serginho e fallback entre motores | documentado, mas sem telemetria real comprovada nesta tarefa | contagem de eventos de fallback por origem/destino e motivo | alto se alegar robustez operacional não medida |
| falha no empacotamento de artefato | prevenir perda de entrega do artefato | Híbrido/Construtor (pipeline de artefatos) | não medido nesta tarefa | eventos de erro no empacotamento e taxa de falha por versão | médio se tratado como incidente recorrente sem histórico |
| falha no preview de artefato | detectar quebra da visualização de resultado | camada de preview de artefatos | não medido nesta tarefa | contagem de falhas de preview por rota e tipo de artefato | médio se confundido com indisponibilidade geral sem dados |
| aprovação/rejeição/ajuste no ciclo de revisão | acompanhar qualidade do fluxo de revisão | ciclo de revisão (Híbrido/Construtor/Especialistas/ABNT) | não medido nesta tarefa | registrar decisão final por ciclo (aprovado/rejeitado/ajuste) | médio se virar claim de qualidade sem evidência longitudinal |
| custo estimado por provider/modelo | orientar decisão de otimização | camada de execução/modelo e governança de custo | não medido nesta tarefa | estimativa por chamada com tabela de preços e volume observado | alto se publicado como custo real comprovado |
| volume de uso por rota operacional | dimensionar demanda real | rotas operacionais (Serginho IA, Híbrido/Construtor, Especialistas) | não medido nesta tarefa | contagem de requisições por rota, origem e janela temporal | alto se tratado como base de usuários reais sem validação |
| taxa de erro em rotas públicas críticas | monitorar estabilidade da camada pública | UI/UX/Demo e rotas públicas institucionais | não medido nesta tarefa | monitoramento de erros por rota pública e versão | médio se convertido em SLA externo sem série histórica |

## 5) Eventos/sinais operacionais futuros

- erro em `/api/ai`;
- erro em `/api/artifact`;
- erro em `/api/artifact-preview`;
- erro em `/api/health`;
- fallback de provider;
- timeout/circuit breaker;
- falha de geração;
- falha de empacotamento;
- falha de validação;
- falha de exportação;
- decisão de revisão: aprovado, rejeitado, ajuste solicitado;
- carregamento de rotas públicas;
- falha em login/autenticação, apenas como camada separada e sem mexer em Auth nesta tarefa.

## 6) Limites explícitos

- Não há SLA comprovado nesta tarefa.
- Não há uptime comprovado nesta tarefa.
- Não há p95/p99 comprovado nesta tarefa.
- Não há custo real comprovado nesta tarefa.
- Não há volume real de usuários comprovado nesta tarefa.
- Não há clientes/receita/tração comprovados nesta tarefa.
- Não há dashboard real criado nesta tarefa.
- Não há integração externa criada nesta tarefa.
- Não há alteração de runtime nesta tarefa.

## 7) Ordem segura futura

1. consolidar nomes mínimos de eventos;
2. definir formato de log/registro;
3. decidir armazenamento ou ferramenta somente depois;
4. criar dashboard apenas em fase posterior e com autorização explícita;
5. validar dados reais antes de qualquer claim externo.

## 8) Pendências preservadas

- Dependabot #475.
- Dependabot #477.
- Tag/release futura.
- Validação visual manual real.
- Observabilidade real ainda não implementada.
- Métricas reais ainda não medidas.
- Telemetria real ainda não implementada.
- Implementação funcional futura.
- Qualquer evolução de Auth/SaaS/Payments.
- Qualquer alteração em providers/modelos/prompts/registry/fallback.
- Qualquer alteração no Serginho, Híbrido/Construtor, Especialistas ou ABNT.

## 9) Critério de sucesso desta tarefa

- Documento F9-05 criado.
- CHECKLIST.md atualizado no topo.
- Nenhuma alteração funcional.
- Nenhum dashboard criado.
- Nenhum endpoint criado.
- Nenhuma integração externa criada.
- Nenhuma métrica inventada.
- Nenhum overclaim operacional.

## 10) Declaração de não alteração funcional

Esta tarefa não altera runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release, dashboard, endpoint, telemetria real ou implementação funcional.

## 11) Rollback

`git revert <commit-sha>`
