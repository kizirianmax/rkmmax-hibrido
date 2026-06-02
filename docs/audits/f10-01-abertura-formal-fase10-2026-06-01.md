# F10-01 — Abertura formal da Fase 10 — 2026-06-01

## 1. Identificação

- Data: 2026-06-01
- Repositório: `kizirianmax/rkmmax-hibrido`
- Base: `main`
- Tipo: abertura documental de fase
- Escopo: documentação e governança, sem implementação funcional

## 2. Nome oficial da fase

- `Fase 10 — Unificação operacional Serginho + Híbrido e saneamento UX do seletor de IA`

## 3. Estado anterior confirmado

- Fase 9 encerrada no escopo técnico/documental/operacional.
- PR #533 incorporado em `main`.
- Validações pública e autenticada pós-Fase 9 registradas.
- Sem bloqueio técnico real identificado.
- Pendências restantes classificadas como UX/alinhamento, não bloqueio técnico.

## 4. Objetivo da Fase 10

- Unificar a experiência operacional entre Serginho generalista e Híbrido/Construtor.
- Sanear a visibilidade e organização do seletor de IA/modelo nas UIs operacionais autenticadas.
- Preservar Serginho IA como orquestrador soberano e gateway único.
- Evitar bypass ao Serginho.
- Reduzir confusão de produto para usuário final e banca.
- Preparar base mais clara para evolução posterior.

## 5. Escopo proposto da Fase 10

- Avaliar fluxo atual de Serginho/generalista e Híbrido/Construtor.
- Decidir se a unificação será visual, operacional ou progressiva.
- Tornar o seletor de IA/modelo claramente visível onde ele deve existir.
- Ajustar pequenos problemas visuais do Serginho/generalista.
- Preservar a separação interna das camadas mesmo que a experiência do usuário seja unificada.
- Manter Especialistas e ABNT fora da fusão direta, salvo necessidade documentada.

## 6. Fora de escopo da Fase 10 neste momento

- Não mexer em Auth/SaaS/Payments.
- Não mexer em cobrança, Stripe, Supabase ou secrets.
- Não mexer em ABNT.
- Não alterar Especialistas.
- Não alterar providers/modelos sem necessidade comprovada.
- Não iniciar refactor amplo.
- Não criar tag/release neste PR.
- Não declarar maturidade comercial.

## 7. Pendências que motivam a fase

- Seletor de IA/modelo não visível no Híbrido/Construtor.
- Seletor de IA/modelo não claramente visível no Serginho/generalista.
- Pequeno ajuste visual no Serginho/generalista.
- Possível confusão entre telas para usuário final.
- Oportunidade de unificar experiência sem misturar responsabilidades internas.

## 8. Critérios de sucesso futuros da Fase 10

- Usuário entende com clareza onde está o Serginho IA e onde entra o Construtor.
- Seletor de IA/modelo visível apenas onde fizer sentido.
- Sem bypass ao Serginho.
- Híbrido/Construtor preservado como camada de artefatos.
- Especialistas preservados como camada de domínio.
- ABNT preservada como camada de conformidade.
- Nenhuma promessa comercial indevida.
- Mudanças futuras pequenas, reversíveis e auditáveis.

## 9. Limites sem overclaim

- Abertura da Fase 10 não comprova clientes, receita, SLA, uptime, p95/p99, tração ou maturidade comercial.
- Validação pública/autenticada não equivale a produto comercial maduro.
- CI/checks não comprovam maturidade comercial.
- Posicionamento oficial permanece: **protótipo avançado em validação**.
- Seletor de IA/modelo ainda não está plenamente sanado até implementação futura.

## 10. Próximo passo após esta abertura

- Após merge deste PR documental, o próximo passo deve ser uma auditoria/diagnóstico **F10-02 em modo leitura**, antes de qualquer implementação.
- Essa auditoria F10-02 deve mapear os arquivos e fluxos envolvidos na eventual unificação Serginho + Híbrido e no saneamento do seletor.
- Não implementar sem diagnóstico prévio.

## 11. Rollback

- `git revert <commit-sha>`
