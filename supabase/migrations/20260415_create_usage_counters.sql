-- Migration: criar tabela usage_counters para guardAndBill
-- Referência: api/_utils/guardAndBill.js (linha 6)
-- Rollback: DROP TABLE IF EXISTS public.usage_counters;

CREATE TABLE IF NOT EXISTS public.usage_counters (
  key       TEXT        PRIMARY KEY,
  value     BIGINT      NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consultas por prefixo de chave (ex: reqs:uid:, toks:day:uid:)
CREATE INDEX IF NOT EXISTS idx_usage_counters_key_prefix ON public.usage_counters (key text_pattern_ops);

-- Enable RLS (Supabase best practice) — acesso somente via service_role_key
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
