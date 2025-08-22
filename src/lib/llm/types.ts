export interface GeneratedFile {
  filename: string
  content: string
  language: string
  type: 'api' | 'db' | 'test' | 'config' | 'middleware'
}

export interface GenerationResponse {
  projectId: string
  status: 'generating' | 'completed' | 'error'
  files?: GeneratedFile[]
  error?: string
}