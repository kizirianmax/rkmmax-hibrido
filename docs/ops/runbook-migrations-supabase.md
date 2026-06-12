# Runbook operacional — verificação e aplicação manual de migrations Supabase

## 1. Declaração clara

Neste projeto, migrations Supabase **NÃO** são aplicadas automaticamente.
A aplicação é **manual**, via Supabase SQL Editor.
GitHub Actions e Vercel **não** aplicam migrations de banco: os workflows do GitHub rodam apenas testes e a Vercel faz build/deploy do frontend e das funções `api/**`.

## 2. Como identificar o projeto Supabase correto

1. Abra o Supabase Dashboard.
2. Confirme visualmente o projeto alvo antes de qualquer ação.
3. Cruze a URL do projeto no Dashboard com a variável `SUPABASE_URL` configurada no ambiente correspondente da Vercel.
4. Nunca aplique SQL sem confirmar ambiente/projeto corretos.

## 3. Verificação read-only ANTES de aplicar qualquer coisa

```sql
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'artifact_ledger'
) AS tabela_existe;
```

```sql
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'artifact_ledger';
```

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expr,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'artifact_ledger'
  AND policyname = 'artifact_ledger_select_owner';
```

## 4. Como interpretar

- Se a policy existir com `cmd = SELECT`, `roles = {authenticated}` e `using_expr` contendo `user_id = (auth.uid())::text`, **não aplicar nada**.
- Se a policy não existir, siga o procedimento manual seguro da seção 5.
- Se houver expressão divergente, **pare e audite** antes de aplicar.

## 5. Procedimento manual seguro para aplicar a policy do #619, caso esteja ausente

```sql
DROP POLICY IF EXISTS artifact_ledger_select_owner ON public.artifact_ledger;

CREATE POLICY artifact_ledger_select_owner
  ON public.artifact_ledger
  FOR SELECT
  TO authenticated
  USING (user_id = (auth.uid())::text);
```

## 6. Por que é idempotente

- `DROP POLICY IF EXISTS` evita erro se a policy já existir.
- O resultado final converge para uma única policy correta, podendo ser executado 1 ou N vezes com o mesmo resultado.

## 7. Rollback manual

```sql
DROP POLICY IF EXISTS artifact_ledger_select_owner ON public.artifact_ledger;
```

## 8. Riscos

- Aplicar no projeto Supabase errado.
- Achar que o GitHub aplicou no banco automaticamente.
- Usar `user_id::uuid` incorretamente.
- Esquecer de verificar a policy após aplicar.
- Não registrar a aplicação manual.
- Confundir deploy da Vercel com migration de banco.

## 9. Regras importantes

- `user_id` é `TEXT`.
- Usar `user_id = (auth.uid())::text`.
- Nunca usar `user_id::uuid = auth.uid()`.
- `service_role` continua bypassando RLS (`BYPASSRLS`).
- A policy é defesa em profundidade para acesso direto via role `authenticated`.

## 10. Registro operacional

Após aplicar qualquer migration manualmente, registre: data, ambiente, projeto Supabase, pessoa responsável, migration aplicada, resultado da verificação e rollback disponível.
Recomendação: registrar essa evidência no `CHECKLIST.md`.
