import { GoogleGenerativeAI } from '@google/generative-ai'

const chaveApi = process.env.GEMINI_API_KEY!

const genAI = new GoogleGenerativeAI(chaveApi)

export const modelo = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // modelo gratuito e rápido
})