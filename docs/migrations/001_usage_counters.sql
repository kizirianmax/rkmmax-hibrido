-- Tabela de contadores de uso persistentes
-- Substitui globalThis.__USAGE_MEM__ que não funciona em serverless
-- Executar no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS usage_counters (
  key TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para limpeza periódica de registros antigos
CREATE INDEX IF NOT EXISTS idx_usage_counters_updated_at ON usage_counters (updated_at);

-- RLS: somente service_role pode ler/escrever (as chamadas vêm do backend com SUPABASE_SERVICE_ROLE_KEY)
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy para anon/authenticated — somente service_role bypassa RLS
