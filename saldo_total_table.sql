-- Tabela de saldo total: dinheiro que o casal tem atualmente
-- Registra movimentacoes (aporte ou retirada) que atualizam o saldo
CREATE TABLE IF NOT EXISTS saldo_total (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'retirada')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar por usuario rapidamente
CREATE INDEX idx_saldo_total_usuario ON saldo_total(usuario_id);
-- Index para ordenar por data
CREATE INDEX idx_saldo_total_data ON saldo_total(data);
