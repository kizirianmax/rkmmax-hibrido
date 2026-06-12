# Política de retenção de artefatos (rascunho operacional)

## 1) Finalidade

Definir base operacional para retenção de artefatos do Construtor/Híbrido, permitindo reabertura de projeto, histórico, versionamento e exportação pelo usuário em fases futuras.

## 2) Minimização

- Salvar apenas o necessário para operação e rastreabilidade.
- Não persistir prompts por padrão.
- Evitar persistência de dados sensíveis desnecessários.
- Preferir metadados e checksums quando possível.

## 3) Retenção

- Metadados e conteúdo devem ter tratamento de retenção distinto.
- Prazos definitivos serão confirmados antes da FASE 2.
- Conteúdo real só pode ser persistido com política explícita de retenção publicada.

## 4) Exclusão

O usuário deve poder solicitar exclusão de dados, observando o conflito técnico-jurídico atual:

- o ledger é append-only (triggers anti-`DELETE`);
- o direito de exclusão/esquecimento exige estratégia prática.

Estratégias futuras a avaliar e formalizar: anonimização, tombstone, exclusão lógica e/ou retenção mínima legal estritamente justificada.

## 5) Exportação

Em fase futura, o usuário deve poder exportar seus próprios artefatos e metadados em formato interoperável.

## 6) LGPD/GDPR

Esta política seguirá os princípios de finalidade, minimização, transparência, acesso, correção, exclusão e portabilidade, com trilha auditável das decisões de produto e segurança.

## 7) Escopo desta fase

Este documento é contratual/documental (FASE 1.5) e não altera banco, migration, RLS efetiva nem runtime.

## 8) Rollback

Como esta entrega é documental, rollback via `git revert <commit-sha>`.
