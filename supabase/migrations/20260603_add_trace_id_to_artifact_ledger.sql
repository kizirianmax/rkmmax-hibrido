-- Migration: adicionar trace_id opcional no artifact_ledger (F11-04)
-- Rollback:
--   DROP INDEX IF EXISTS idx_artifact_ledger_trace_id;
--   ALTER TABLE public.artifact_ledger DROP COLUMN IF EXISTS trace_id;

ALTER TABLE public.artifact_ledger
ADD COLUMN IF NOT EXISTS trace_id TEXT;

CREATE INDEX IF NOT EXISTS idx_artifact_ledger_trace_id
ON public.artifact_ledger (trace_id);
