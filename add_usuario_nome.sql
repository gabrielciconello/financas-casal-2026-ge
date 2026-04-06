-- Adicionar coluna usuario_nome em todas as tabelas que registram transacoes
-- Execute no SQL Editor do Supabase

ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE gastos_fixos ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE gastos_variaveis ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE salarios ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE cartoes ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE compras_cartao ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE contribuicoes_metas ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS usuario_nome TEXT;

-- Obs: a tabela metas não possui coluna usuario_id, os registros existentes
-- terão usuario_nome NULL ate serem atualizados via aplicacao.

-- Preencher usuario_nome para registros existentes baseado no usuario_id
-- Gabriel
UPDATE transacoes SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;
UPDATE gastos_fixos SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;
UPDATE gastos_variaveis SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;
UPDATE salarios SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;
UPDATE cartoes SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;
UPDATE compras_cartao SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;
UPDATE contribuicoes_metas SET usuario_nome = 'Gabriel' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'gabrielghnc@gmail.com') AND usuario_nome IS NULL;

-- Emely
UPDATE transacoes SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
UPDATE gastos_fixos SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
UPDATE gastos_variaveis SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
UPDATE salarios SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
UPDATE cartoes SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
UPDATE compras_cartao SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
UPDATE contribuicoes_metas SET usuario_nome = 'Emely' WHERE usuario_id = (SELECT id FROM auth.users WHERE email = 'emelycristiny07@gmail.com') AND usuario_nome IS NULL;
