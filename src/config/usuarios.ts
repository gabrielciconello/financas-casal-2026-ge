// Mapeamento de email do Supabase para nome de exibicao
// Adicione aqui os emails e nomes dos usuarios

export const NOMES_USUARIOS: Record<string, string> = {
  // Exemplo: 'usuario1@email.com': 'Nome do Usuario 1',
  // Exemplo: 'usuario2@email.com': 'Nome do Usuario 2',
}

export function obterNomeUsuario(email: string): string {
  const nome = NOMES_USUARIOS[email]
  if (nome) return nome
  // Fallback: usa a parte antes do @ do email
  return email.split('@')[0]
}
