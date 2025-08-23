import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { generateBackendCode } from './chains'
import type { GeneratedFile } from './types'

export interface AgentResponse {
  type: 'chat' | 'code_generation' | 'code_update'
  message?: string
  files?: GeneratedFile[]
  streamId?: string
}

export class BackendAgent {
  private llm: ChatGoogleGenerativeAI

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY!,
      temperature: 0.3,
      maxOutputTokens: 1024,
    })
  }

  async processMessage(
    message: string,
    projectPrompt: string,
    conversationHistory: string
  ): Promise<AgentResponse> {
    // Detect if user is requesting code generation/modification
    const isCodeRequest = this.detectCodeRequest(message)
    
    if (isCodeRequest.shouldGenerate) {
      return await this.handleCodeGeneration(message, projectPrompt, isCodeRequest.intent)
    } else {
      return await this.handleChatResponse(message, projectPrompt, conversationHistory)
    }
  }

  private detectCodeRequest(message: string): { shouldGenerate: boolean; intent: string } {
    const lowerMessage = message.toLowerCase()
    
    // Patterns that indicate code generation requests
    const codeKeywords = [
      'generate', 'create', 'build', 'implement', 'add', 'write',
      'code', 'function', 'endpoint', 'api', 'route', 'model',
      'database', 'schema', 'migration', 'test', 'fix', 'update',
      'modify', 'change', 'refactor', 'improve'
    ]

    const hasCodeKeyword = codeKeywords.some(keyword => lowerMessage.includes(keyword))
    
    // More specific patterns
    const specificPatterns = [
      /can you (create|generate|add|build|implement|write)/,
      /i need (a|an|some|to)/,
      /please (create|generate|add|build|implement|write)/,
      /how do i (create|generate|add|build|implement|write)/,
      /(create|add|implement) (a|an|some) (.*)(endpoint|api|route|function|model|test)/,
      /update (the|my) (.*)(code|implementation|function|endpoint)/
    ]

    const hasSpecificPattern = specificPatterns.some(pattern => pattern.test(lowerMessage))

    const shouldGenerate = hasCodeKeyword || hasSpecificPattern

    return {
      shouldGenerate,
      intent: shouldGenerate ? this.extractIntent(message) : ''
    }
  }

  private extractIntent(message: string): string {
    // Extract what the user wants to do for better code generation
    const intentPatterns = [
      { pattern: /(add|create) (.*?) (endpoint|api|route)/, type: 'api' },
      { pattern: /(add|create) (.*?) (model|schema|table)/, type: 'database' },
      { pattern: /(add|create) (.*?) (test|spec)/, type: 'test' },
      { pattern: /(fix|update|modify|change) (.*?)/, type: 'modification' },
      { pattern: /(authentication|auth|login|signup)/, type: 'auth' },
      { pattern: /(validation|validate|sanitize)/, type: 'validation' },
      { pattern: /(middleware|cors|security)/, type: 'middleware' }
    ]

    for (const { pattern, type } of intentPatterns) {
      if (pattern.test(message.toLowerCase())) {
        return type
      }
    }

    return 'general'
  }

  private async handleCodeGeneration(
    message: string,
    originalPrompt: string,
    intent: string
  ): Promise<AgentResponse> {
    try {
      // Create an enhanced prompt combining original and new request
      const enhancedPrompt = `${originalPrompt}

Additional request: ${message}

Focus on: ${intent}`

      // Generate code using existing pipeline
      const files = await generateBackendCode(enhancedPrompt)
      
      return {
        type: 'code_generation',
        message: `Generated ${files.length} files based on your request. The code has been updated in the file viewer.`,
        files
      }
    } catch (error) {
      console.error('Code generation failed:', error)
      return {
        type: 'chat',
        message: `I'd like to help generate code for you, but there was an issue: ${error instanceof Error ? error.message : 'Unknown error'}. You can try rephrasing your request or use the Regenerate button.`
      }
    }
  }

  private async handleChatResponse(
    message: string,
    projectPrompt: string,
    conversationHistory: string
  ): Promise<AgentResponse> {
    const systemInstruction = `You are an AI backend assistant helping refine and extend a generated backend project.
Project original prompt: "${projectPrompt}".

Guidelines:
- Provide helpful, actionable advice about backend development
- You can suggest improvements, explain concepts, help with architecture decisions
- If the user asks for code implementation, let them know you can generate it automatically - no need to use the Regenerate button
- Keep responses concise but informative
- Be encouraging and helpful`

    const prompt = `${systemInstruction}\n\nConversation so far:\n${conversationHistory}\n\nUSER: ${message}\nASSISTANT:`
    
    try {
      const result = await this.llm.invoke(prompt)
      const content = typeof result.content === 'string' 
        ? result.content 
        : Array.isArray(result.content)
          ? result.content.map(p => typeof p === 'string' ? p : JSON.stringify(p)).join('\n')
          : JSON.stringify(result.content)

      return {
        type: 'chat',
        message: content.slice(0, 2000) // Keep responses reasonable
      }
    } catch (error) {
      console.error('Chat response failed:', error)
      return {
        type: 'chat',
        message: "I'm having trouble responding right now. Please try again."
      }
    }
  }
}
