import { lerBody } from '../../src/utils/lerBody'
import { EventEmitter } from 'events'

// Simula uma requisição HTTP
function criarRequisicaoFake(corpo: string) {
  const emitter = new EventEmitter() as any
  emitter.headers = {}

  process.nextTick(() => {
    emitter.emit('data', Buffer.from(corpo))
    emitter.emit('end')
  })

  return emitter
}

function criarRequisicaoVazia() {
  const emitter = new EventEmitter() as any
  emitter.headers = {}

  process.nextTick(() => {
    emitter.emit('end')
  })

  return emitter
}

function criarRequisicaoComErro() {
  const emitter = new EventEmitter() as any
  emitter.headers = {}

  process.nextTick(() => {
    emitter.emit('error', new Error('Erro de leitura'))
  })

  return emitter
}

describe('lerBody', () => {

  test('deve ler e parsear JSON válido', async () => {
    const corpo = JSON.stringify({ descricao: 'Teste', valor: 100 })
    const req = criarRequisicaoFake(corpo)

    const resultado = await lerBody(req)

    expect(resultado).toEqual({ descricao: 'Teste', valor: 100 })
  })

  test('deve retornar objeto vazio para body vazio', async () => {
    const req = criarRequisicaoVazia()

    const resultado = await lerBody(req)

    expect(resultado).toEqual({})
  })

  test('deve rejeitar JSON inválido', async () => {
    const req = criarRequisicaoFake('isso nao e json')

    await expect(lerBody(req)).rejects.toThrow('Body da requisição não é um JSON válido')
  })

  test('deve rejeitar em caso de erro na requisição', async () => {
    const req = criarRequisicaoComErro()

    await expect(lerBody(req)).rejects.toThrow('Erro de leitura')
  })

})