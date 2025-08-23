import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { PromptTemplate } from '@langchain/core/prompts'
import { LLMChain } from 'langchain/chains'
import { BACKEND_GENERATION_PROMPT, parseGeneratedCode } from './prompts'
import type { GeneratedFile } from './types'

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  temperature: 0.2,
  apiKey: process.env.GOOGLE_API_KEY,
  maxOutputTokens: 8192,
})

const backendGenerationChain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate(BACKEND_GENERATION_PROMPT),
})

export async function generateBackendCode(userPrompt: string): Promise<GeneratedFile[]> {
  try {
    console.log('🤖 Starting Gemini code generation...')
    
    const response = await backendGenerationChain.call({
      user_prompt: userPrompt,
    })

    console.log('✅ Gemini response received')
    
    const generatedFiles = parseGeneratedCode(response.text)
    
    if (generatedFiles.length === 0) {
      throw new Error('No valid files generated from Gemini response')
    }

    console.log(`📁 Generated ${generatedFiles.length} files`)
    return generatedFiles

  } catch (error) {
    console.error('❌ Gemini generation error:', error)
    
    // Enhanced error handling for Gemini-specific issues
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY environment variable.')
      }
      if (error.message.includes('quota')) {
        throw new Error('Google API quota exceeded. Please check your usage limits.')
      }
      if (error.message.includes('safety')) {
        throw new Error('Content filtered by Gemini safety settings. Please try a different prompt.')
      }
    }
    
    throw new Error('Failed to generate backend code with Gemini')
  }
}

// Alternative function using direct Gemini API (without LangChain)
export async function generateBackendCodeDirect(userPrompt: string): Promise<GeneratedFile[]> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      }
    })

    const prompt = BACKEND_GENERATION_PROMPT.replace('{user_prompt}', userPrompt)
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const generatedFiles = parseGeneratedCode(text)
    
    if (generatedFiles.length === 0) {
      throw new Error('No valid files generated from Gemini response')
    }

    return generatedFiles

  } catch (error) {
    console.error('Direct Gemini API error:', error)
    throw new Error('Failed to generate backend code with Gemini')
  }
}