-- Estrutura compartilhada e nomes de exibicao do Financas Casal.
-- Migracao idempotente: pode ser aplicada em um banco que ja contenha as
-- tabelas e os dados de teste atuais.

BEGIN;

ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE gastos_fixos ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE gastos_variaveis ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE salarios ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE cartoes ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE compras_cartao ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE contribuicoes_metas ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS usuario_nome TEXT;

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

-- CREATE TABLE IF NOT EXISTS nao altera tabelas preexistentes.
ALTER TABLE saldo_total ADD COLUMN IF NOT EXISTS usuario_nome TEXT;

CREATE INDEX IF NOT EXISTS idx_saldo_total_usuario
  ON saldo_total(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saldo_total_data
  ON saldo_total(data DESC);

-- Recupera nomes a partir dos metadados do Auth sem versionar e-mails
-- pessoais. O nome local do e-mail e apenas o fallback final.
DO $migration$
DECLARE
  tabela TEXT;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'transacoes',
    'gastos_fixos',
    'gastos_variaveis',
    'salarios',
    'cartoes',
    'compras_cartao',
    'contribuicoes_metas',
    'saldo_total'
  ]
  LOOP
    EXECUTE format(
      'UPDATE %I AS registro
       SET usuario_nome = COALESCE(
         NULLIF(usuario.raw_user_meta_data ->> ''nome'', ''''),
         NULLIF(usuario.raw_user_meta_data ->> ''name'', ''''),
         split_part(usuario.email, ''@'', 1)
       )
       FROM auth.users AS usuario
       WHERE registro.usuario_id = usuario.id
         AND (
           registro.usuario_nome IS NULL
           OR registro.usuario_nome = ''''
           OR registro.usuario_nome = registro.usuario_id::text
         )',
      tabela
    );
  END LOOP;
END
$migration$;

-- Metas nao possui usuario_id no esquema atual. Registros antigos permanecem
-- sem nome ate serem editados pela aplicacao.

ALTER TABLE saldo_total ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem proprio saldo" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_leitura_compartilhada" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_inserir_proprio" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_atualizar_proprio" ON saldo_total;
DROP POLICY IF EXISTS "saldo_total_excluir_proprio" ON saldo_total;

-- O projeto possui somente as duas contas autenticadas do casal. A leitura do
-- saldo e compartilhada; alteracoes diretas continuam vinculadas ao auth.uid().
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

COMMIT;
