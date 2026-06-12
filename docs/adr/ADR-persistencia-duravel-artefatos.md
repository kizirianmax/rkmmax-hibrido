# ADR — persistência durável de artefatos (Construtor/Híbrido)

## 1) Estado atual

A FASE 1 já está concluída em produção com `artifact_ledger` (metadados e decisões), sem persistir conteúdo real do artefato nem prompt por padrão.

- `api/_utils/artifactLedger.js` registra eventos `preview_generated` e `decision_applied`.
- `artifact_ledger` é append-only (triggers anti-`UPDATE`/`DELETE`).
- `api/artifact-ledger.js` expõe leitura autenticada por `artifact_id` + `user_id`.
- O ciclo local do Construtor/Híbrido usa `sessionStorage` (`reviewCycleStorage`, `inputDraftStorage` e `construtor_artifact_preview`), portanto é volátil/client-side.

Ainda não existem persistência durável de conteúdo/versões/edições, reabertura de projeto e dashboard “Meus Artefatos”.

## 2) Decisão

Evoluir a persistência durável por fases, mantendo minimização de dados:

- sem persistir prompts por padrão;
- sem persistir conteúdo real antes da base de segurança/privacidade estar formalmente pronta;
- sem alterar runtime nesta fase documental.

## 3) Modelo mínimo futuro (conceitual, sem migration)

### `artifact_project`

- `project_id`
- `user_id`
- `title`
- `status`
- `latest_checksum`
- `created_at`
- `updated_at`

### `artifact_version`

- `version_id`
- `project_id`
- `version_number`
- `content` (apenas em fase futura)
- `checksum`
- `created_at`

## 4) Campos obrigatórios vs. adiados

| Entidade | Campo | MVP | Fase posterior |
|---|---|:---:|:---:|
| `artifact_project` | `project_id` | ✅ | |
| `artifact_project` | `user_id` | ✅ | |
| `artifact_project` | `title` | ✅ | |
| `artifact_project` | `status` | ✅ | |
| `artifact_project` | `latest_checksum` | ✅ | |
| `artifact_project` | `created_at`, `updated_at` | ✅ | |
| `artifact_project` | `plan_at_creation` | | ✅ |
| `artifact_project` | `tags` | | ✅ |
| `artifact_version` | `version_id` | ✅ | |
| `artifact_version` | `project_id` | ✅ | |
| `artifact_version` | `version_number` | ✅ | |
| `artifact_version` | `checksum` | ✅ | |
| `artifact_version` | `created_at` | ✅ | |
| `artifact_version` | `content` | | ✅ |

## 5) Regra de privacidade

- Prompt do usuário **nunca** é persistido por padrão.
- Conteúdo de artefato só pode ser salvo em fase futura com consentimento/ação clara do usuário.
- Arquivos grandes/binários não vão para coluna de banco (Storage/bucket em fase futura, fora deste escopo).
- ZIP/base64 não é salvo por padrão.

## 6) Relação com usuário

`user_id` é a raiz de isolamento. Todo dado persistido pertence a um usuário e o usuário só pode ler seus próprios artefatos.

## 7) Decisão de RLS

`artifact_ledger` já está com RLS habilitado, porém sem policy de dono efetiva. Antes da FASE 2 (persistência de conteúdo real), é pré-requisito obrigatório criar policy de dono.

Exemplo conceitual (não executar nesta fase): usuário autenticado só acessa registros cujo `user_id` corresponda ao dono; `service_role` pode existir no backend como camada operacional, mas não deve ser a única defesa.

## 8) Limites por plano

Limites futuros (quantidade de projetos, versões e afins) devem reutilizar `src/lib/planCaps.js` e o padrão operacional do `guardAndBill`, sem implementação nesta fase.

## 9) Critérios de aceite futuros

- Isolamento validado entre dois usuários.
- Prompt não persistido por padrão.
- Fluxos de exclusão/exportação aderentes a LGPD/GDPR.
- Testes com dois `user_id` diferentes.
- Nenhum acesso cruzado entre usuários.

## 10) Rollback

Como esta entrega é documental, rollback via `git revert <commit-sha>`.
