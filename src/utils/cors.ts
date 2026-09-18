import { ServerResponse } from 'http'

export function aplicarCors(res: ServerResponse): void {
  // ServerResponse always exposes setHeader in production. The guard also keeps
  // the helper compatible with minimal response doubles used in unit tests.
  if (typeof res.setHeader !== 'function') return
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}
