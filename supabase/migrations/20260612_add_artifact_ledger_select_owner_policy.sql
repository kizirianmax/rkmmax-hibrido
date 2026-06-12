-- Migration: policy de dono (SELECT) para o artifact_ledger.
-- Defesa em profundidade antes da persistência durável de conteúdo real (FASE 2).
-- Escopo: apenas SELECT, apenas role authenticated. service_role continua com BYPASSRLS.
-- Comparação segura para user_id TEXT: user_id = (auth.uid())::text
-- Rollback:
--   DROP POLICY IF EXISTS artifact_ledger_select_owner ON public.artifact_ledger;

DROP POLICY IF EXISTS artifact_ledger_select_owner ON public.artifact_ledger;

CREATE POLICY artifact_ledger_select_owner
  ON public.artifact_ledger
  FOR SELECT
  TO authenticated
  USING (user_id = (auth.uid())::text);
