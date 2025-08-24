export interface GeneratedFile {
  filename: string // Keep as filename for backward compatibility with LLM generation
  content: string
  language: string
  type: 'api' | 'db' | 'test' | 'config' | 'middleware' | 'component' | 'page' | 'service' | 'style' | 'utility' | 'code'
}

export interface GenerationResponse {
  projectId: string
  status: 'generating' | 'completed' | 'error'
  files?: GeneratedFile[]
  error?: string
}