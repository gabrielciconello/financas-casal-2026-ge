import { IncomingMessage } from 'http'

export function lerBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let corpo = ''
    let finalizado = false
    const limiteBytes = 64 * 1024

    const tamanhoDeclarado = Number(req.headers['content-length'])
    if (Number.isFinite(tamanhoDeclarado) && tamanhoDeclarado > limiteBytes) {
      reject(new Error('Body da requisição excede o limite de 64 KB'))
      return
    }

    req.on('data', (chunk) => {
      if (finalizado) return
      corpo += chunk.toString()
      if (Buffer.byteLength(corpo, 'utf8') > limiteBytes) {
        finalizado = true
        reject(new Error('Body da requisição excede o limite de 64 KB'))
      }
    })

    req.on('end', () => {
      if (finalizado) return
      finalizado = true
      try {
        if (!corpo) {
          resolve({} as T)
          return
        }
        resolve(JSON.parse(corpo) as T)
      } catch {
        reject(new Error('Body da requisição não é um JSON válido'))
      }
    })

    req.on('error', (erro) => {
      if (finalizado) return
      finalizado = true
      reject(erro)
    })
  })
}
