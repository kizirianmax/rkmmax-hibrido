-- Migration: criar ledger append-only de provedância de artefatos (F11-02)
-- Rollback: DROP TABLE IF EXISTS public.artifact_ledger;

CREATE TABLE IF NOT EXISTS public.artifact_ledger (
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('preview_generated', 'decision_applied')),
  artifact_checksum TEXT,
  origin_model TEXT,
  origin_prompt_id TEXT,
  artifact_timestamp TIMESTAMPTZ,
  preview_validation JSONB,
  preview_status JSONB,
  preview_files_summary JSONB,
  decision TEXT,
  feedback TEXT,
  decision_timestamp TIMESTAMPTZ,
  user_id TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifact_ledger_artifact_id ON public.artifact_ledger (artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_ledger_event_type ON public.artifact_ledger (event_type);
CREATE INDEX IF NOT EXISTS idx_artifact_ledger_created_at ON public.artifact_ledger (created_at DESC);

CREATE OR REPLACE FUNCTION public.artifact_ledger_prevent_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'artifact_ledger is append-only';
END;
$$;

DROP TRIGGER IF EXISTS artifact_ledger_no_update ON public.artifact_ledger;
CREATE TRIGGER artifact_ledger_no_update
BEFORE UPDATE ON public.artifact_ledger
FOR EACH ROW
EXECUTE FUNCTION public.artifact_ledger_prevent_mutation();

DROP TRIGGER IF EXISTS artifact_ledger_no_delete ON public.artifact_ledger;
CREATE TRIGGER artifact_ledger_no_delete
BEFORE DELETE ON public.artifact_ledger
FOR EACH ROW
EXECUTE FUNCTION public.artifact_ledger_prevent_mutation();

ALTER TABLE public.artifact_ledger ENABLE ROW LEVEL SECURITY;
