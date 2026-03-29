jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({ model: 'gemini-1.5-flash', fake: true }),
  })),
}))

describe('servicoGemini', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.GEMINI_API_KEY = 'fake-key'
  })

  test('modelo deve ser inicializado via GoogleGenerativeAI', async () => {
    const { modelo } = await import('../../src/services/gemini')
    expect(modelo).toEqual({ model: 'gemini-1.5-flash', fake: true })
  })
})