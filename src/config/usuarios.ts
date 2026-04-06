// Mapeamento de email do Supabase para nome de exibicao
// Adicione aqui os emails e nomes dos usuarios

export const NOMES_USUARIOS: Record<string, string> = {
 'gabrielghnc@gmail.com': 'Gabriel',
 'emelycristiny07@gmail.com': 'Emely',
  // Exemplo: 'usuario2@email.com': 'Nome do Usuario 2',
}

export function obterNomeUsuario(email: string): string {
  const nome = NOMES_USUARIOS[email]
  if (nome) return nome
  // Fallback: usa a parte antes do @ do email
  return email.split('@')[0]
}
