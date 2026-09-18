-- Adiciona o nome de exibicao sem versionar e-mails pessoais.
-- Execute no SQL Editor do Supabase. A migracao e idempotente.

BEGIN;

ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE gastos_fixos ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE gastos_variaveis ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE salarios ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE cartoes ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE compras_cartao ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE contribuicoes_metas ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS usuario_nome TEXT;

-- Para dados antigos, prioriza o nome definido nos metadados do Auth e usa a
-- parte local do e-mail apenas como fallback. Novos registros recebem o nome
-- pela aplicacao.
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
    'contribuicoes_metas'
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
         AND registro.usuario_nome IS NULL',
      tabela
    );
  END LOOP;
END
$migration$;

-- A tabela metas nao possui usuario_id no esquema atual; registros antigos
-- permanecem sem nome ate serem editados pela aplicacao.

COMMIT;
