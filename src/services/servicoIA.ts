import { modelo } from './gemini.js'
import { supabaseAdmin } from './supabase.node.js'
import { RespostaApi } from '../types/index.js'
import { respostaSucesso, respostaErro, mesAnoAtual } from '../utils/index.js'

interface RespostaIA {
  resposta: string
}

interface ContextoFinanceiro {
  mes: number
  ano: number
  total_entradas: number
  total_saidas: number
  saldo: number
  gastos_por_categoria: { categoria: string; total: number }[]
  gastos_fixos_pendentes: number
  metas_ativas: number
}

// Busca contexto financeiro atual para alimentar a IA
async function buscarContexto(mes: number, ano: number): Promise<ContextoFinanceiro> {
  const { data: transacoes } = await supabaseAdmin
    .from('transacoes')
    .select('tipo, valor, categoria')
    .eq('mes', mes)
    .eq('ano', ano)

  const totalEntradas = transacoes
    ?.filter((t) => t.tipo === 'entrada')
    .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

  const totalSaidas = transacoes
    ?.filter((t) => t.tipo === 'saida')
    .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

  const totalPorCategoria: Record<string, number> = {}
  transacoes
    ?.filter((t) => t.tipo === 'saida')
    .forEach((t) => {
      totalPorCategoria[t.categoria] =
        (totalPorCategoria[t.categoria] ?? 0) + Number(t.valor)
    })

  const gastosPorCategoria = Object.entries(totalPorCategoria).map(
    ([categoria, total]) => ({ categoria, total })
  )

  const { data: gastosFixos } = await supabaseAdmin
    .from('gastos_fixos')
    .select('valor')
    .eq('mes', mes)
    .eq('ano', ano)
    .eq('status', 'pendente')

  const gastosFixosPendentes = gastosFixos
    ?.reduce((acc, g) => acc + Number(g.valor), 0) ?? 0

  const { count: metasAtivas } = await supabaseAdmin
    .from('metas')
    .select('*', { count: 'exact', head: true })
    .eq('concluida', false)

  return {
    mes,
    ano,
    total_entradas: totalEntradas,
    total_saidas: totalSaidas,
    saldo: totalEntradas - totalSaidas,
    gastos_por_categoria: gastosPorCategoria,
    gastos_fixos_pendentes: gastosFixosPendentes,
    metas_ativas: metasAtivas ?? 0,
  }
}

// Monta o prompt de sistema com contexto financeiro
function montarPromptSistema(contexto: ContextoFinanceiro): string {
  const categoriasTexto = contexto.gastos_por_categoria
    .map((c) => `${c.categoria}: R$ ${c.total.toFixed(2)}`)
    .join(', ')

  return `
Você é um assistente financeiro pessoal de um casal brasileiro.
Responda sempre em português, de forma clara, objetiva e amigável.
Nunca invente dados — use apenas as informações abaixo.

CONTEXTO FINANCEIRO ATUAL (${contexto.mes}/${contexto.ano}):
- Total de entradas: R$ ${contexto.total_entradas.toFixed(2)}
- Total de saídas: R$ ${contexto.total_saidas.toFixed(2)}
- Saldo atual: R$ ${contexto.saldo.toFixed(2)}
- Gastos fixos pendentes: R$ ${contexto.gastos_fixos_pendentes.toFixed(2)}
- Metas ativas: ${contexto.metas_ativas}
- Gastos por categoria: ${categoriasTexto || 'Nenhum gasto registrado'}

Responda de forma direta e prática. Se não souber algo, diga que não tem essa informação disponível.
`
}

// Chat com a IA
export async function perguntarIA(
  pergunta: string,
  mes?: number,
  ano?: number
): Promise<RespostaApi<RespostaIA>> {
  try {
    const { mes: mesAtual, ano: anoAtual } = mesAnoAtual()
    const contexto = await buscarContexto(mes ?? mesAtual, ano ?? anoAtual)
    const promptSistema = montarPromptSistema(contexto)

    const chat = modelo.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: promptSistema }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido! Estou pronto para ajudar com as finanças do casal.' }],
        },
      ],
    })

    const resultado = await chat.sendMessage(pergunta)
    const resposta = resultado.response.text()

    return respostaSucesso({ resposta })
  } catch (erro) {
    return respostaErro('Erro ao comunicar com a IA')
  }
}

// Resumo mensal automático gerado pela IA
export async function gerarResumoMensal(
  mes: number,
  ano: number
): Promise<RespostaApi<RespostaIA>> {
  try {
    const contexto = await buscarContexto(mes, ano)
    const promptSistema = montarPromptSistema(contexto)

    const prompt = `
Com base nos dados financeiros do mês ${mes}/${ano}, gere um resumo mensal completo incluindo:
1. Análise geral do mês (positiva ou negativa)
2. Principais gastos e categorias
3. Situação do saldo
4. Gastos fixos pendentes
5. Duas ou três sugestões práticas de melhoria
Seja objetivo e use no máximo 200 palavras.
`

    const chat = modelo.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: promptSistema }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido! Estou pronto para gerar o resumo.' }],
        },
      ],
    })

    const resultado = await chat.sendMessage(prompt)
    const resposta = resultado.response.text()

    return respostaSucesso({ resposta })
  } catch (erro) {
    return respostaErro('Erro ao gerar resumo mensal')
  }
}

// Categorização automática por descrição
export async function categorizarTransacao(
  descricao: string
): Promise<RespostaApi<{ categoria: string }>> {
  try {
    const prompt = `
Você é um categorizador financeiro. 
Dada a descrição abaixo, retorne APENAS o nome da categoria mais adequada em português.
Categorias possíveis: Alimentação, Transporte, Saúde, Lazer, Moradia, Educação, Vestuário, Serviços, Salário, Freelance, Investimento, Outros.
Retorne apenas o nome da categoria, sem explicações.

Descrição: "${descricao}"
`

    const resultado = await modelo.generateContent(prompt)
    const categoria = resultado.response.text().trim()

    return respostaSucesso({ categoria })
  } catch (erro) {
    return respostaErro('Erro ao categorizar transação')
  }
}