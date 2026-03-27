import { IncomingMessage } from 'http'

export function lerBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let corpo = ''

    req.on('data', (chunk) => {
      corpo += chunk.toString()
    })

    req.on('end', () => {
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
      reject(erro)
    })
  })
}