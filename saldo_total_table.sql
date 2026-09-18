-- Movimentacoes que compoem o saldo total compartilhado do casal.
-- Execute no SQL Editor do Supabase. A migracao e idempotente.

CREATE TABLE IF NOT EXISTS saldo_total (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'retirada')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saldo_total_usuario ON saldo_total(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saldo_total_data ON saldo_total(data DESC);

ALTER TABLE saldo_total ENABLE ROW LEVEL SECURITY;

-- Leitura compartilhada entre os dois usuarios autenticados. Escritas diretas
-- ficam limitadas ao proprio usuario. A API usa a service role no servidor e
-- nunca deve expor essa chave ao navegador.
DROP POLICY IF EXISTS "Usuarios veem proprio saldo" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_leitura_compartilhada" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_inserir_proprio" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_atualizar_proprio" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_excluir_proprio" ON saldo_total;

CREATE POLICY "saldo_total_leitura_compartilhada"
  ON saldo_total FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "saldo_total_inserir_proprio"
  ON saldo_total FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "saldo_total_atualizar_proprio"
  ON saldo_total FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "saldo_total_excluir_proprio"
  ON saldo_total FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());
