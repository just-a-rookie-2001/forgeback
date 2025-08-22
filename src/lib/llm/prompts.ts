import type { GeneratedFile } from './types'

export const BACKEND_GENERATION_PROMPT = `You are an expert full-stack backend developer with deep knowledge of modern web technologies. Your task is to generate complete, production-ready backend code based on user requirements.

**User Requirements:**
{user_prompt}

**Your Task:**
Generate a complete backend implementation with the following components:

1. **API Routes** - RESTful endpoints with proper HTTP methods
2. **Database Models** - Schema definitions and migrations  
3. **Middleware** - Authentication, validation, error handling
4. **Tests** - Unit and integration tests
5. **Configuration** - Environment setup and deployment configs

**Technical Requirements:**
- Use **TypeScript** for type safety
- Include **comprehensive error handling**
- Add **input validation** using Zod schemas
- Write **detailed JSDoc comments**
- Follow **REST API best practices**
- Include **proper HTTP status codes**
- Add **security middleware** where appropriate
- Generate **realistic test data** and test cases

**Output Format:**
For each file you generate, use this exact format:

===FILE_START===
FILENAME: path/to/file.ext
LANGUAGE: typescript|javascript|sql|json|yaml
TYPE: api|db|test|config|middleware
CONTENT:
[Complete file content here - include all imports, functions, and exports]
===FILE_END===

**Important Guidelines:**
- Generate **complete, runnable code** (no placeholders or "// TODO" comments)
- Include **all necessary imports and dependencies**
- Add **proper TypeScript types** for all functions and variables
- Create **realistic, working examples** with sample data
- Ensure **code follows modern ES6+ patterns**
- Include **environment variable references** where needed
- Add **comprehensive error handling** for edge cases

**Example Structure to Include:**
- API endpoints (GET, POST, PUT, DELETE)
- Database schema with relationships
- Validation schemas
- Authentication middleware  
- Unit tests with multiple test cases
- Integration tests
- Configuration files
- Docker/deployment setup

Generate production-quality code that a developer could immediately use in a real application. Be thorough and detailed in your implementation.`

export function parseGeneratedCode(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  
  // Split by file markers and process each block
  const fileBlocks = response.split('===FILE_START===').slice(1)

  for (const block of fileBlocks) {
    const endIndex = block.indexOf('===FILE_END===')
    if (endIndex === -1) {
      console.warn('⚠️ Found incomplete file block, skipping...')
      continue
    }

    const fileContent = block.substring(0, endIndex).trim()
    const lines = fileContent.split('\n')
    
    let filename = ''
    let language = 'typescript'
    let type = 'api'
    let content = ''

    // Parse file metadata
    let contentStartIndex = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('FILENAME:')) {
        filename = line.replace('FILENAME:', '').trim()
      } else if (line.startsWith('LANGUAGE:')) {
        language = line.replace('LANGUAGE:', '').trim()
      } else if (line.startsWith('TYPE:')) {
        type = line.replace('TYPE:', '').trim()
      } else if (line.startsWith('CONTENT:')) {
        contentStartIndex = i + 1
        break
      }
    }

    // Extract file content
    content = lines.slice(contentStartIndex).join('\n').trim()

    // Validate and add file
    if (filename && content && content.length > 10) {
      files.push({
        filename: filename.startsWith('/') ? filename.slice(1) : filename,
        content,
        language,
        type: type as 'api' | 'db' | 'test' | 'config' | 'middleware'
      })
      
      console.log(`✅ Parsed file: ${filename} (${content.length} chars)`)
    } else {
      console.warn(`⚠️ Skipping invalid file: ${filename || 'unnamed'}`)
    }
  }

  console.log(`📁 Total files parsed: ${files.length}`)
  return files
}

// Alternative parsing function with better error handling
export function parseGeneratedCodeRobust(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  
  try {
    // Handle different possible file separators
    const possibleSeparators = [
      '===FILE_START===',
      '=== FILE_START ===',
      '--- FILE START ---',
      '```file:'
    ]
    
    let separator = '===FILE_START==='
    for (const sep of possibleSeparators) {
      if (response.includes(sep)) {
        separator = sep
        break
      }
    }
    
    const blocks = response.split(separator).slice(1)
    
    for (const block of blocks) {
      const file = parseFileBlock(block, separator)
      if (file) {
        files.push(file)
      }
    }
    
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    
    // Fallback: try to extract code blocks
    const codeBlocks = extractCodeBlocks(response)
    files.push(...codeBlocks)
  }
  
  return files
}

function parseFileBlock(block: string, separator: string): GeneratedFile | null {
  try {
    const endMarkers = ['===FILE_END===', '=== FILE_END ===', '--- FILE END ---', '```']
    let endIndex = -1
    
    for (const marker of endMarkers) {
      const index = block.indexOf(marker)
      if (index !== -1) {
        endIndex = index
        break
      }
    }
    
    if (endIndex === -1) {
      endIndex = block.length
    }
    
    const content = block.substring(0, endIndex).trim()
    const lines = content.split('\n')
    
    const metadata = extractMetadata(lines)
    const fileContent = extractContent(lines)
    
    if (metadata.filename && fileContent) {
      return {
        filename: metadata.filename,
        content: fileContent,
        language: metadata.language,
        type: metadata.type
      }
    }
    
  } catch (error) {
    console.warn('Error parsing file block:', error)
  }
  
  return null
}

function extractMetadata(lines: string[]) {
  let filename = ''
  let language = 'typescript'
  let type = 'api'
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase()
    if (trimmed.startsWith('filename:') || trimmed.startsWith('file:')) {
      filename = line.split(':').slice(1).join(':').trim()
    } else if (trimmed.startsWith('language:') || trimmed.startsWith('lang:')) {
      language = line.split(':')[1]?.trim() || 'typescript'
    } else if (trimmed.startsWith('type:')) {
      type = line.split(':')[1]?.trim() || 'api'
    }
  }
  
  return { filename, language, type: type as 'api' | 'db' | 'test' | 'config' | 'middleware' }
}

function extractContent(lines: string[]): string {
  let contentStarted = false
  const contentLines: string[] = []
  
  for (const line of lines) {
    if (line.trim().toLowerCase().startsWith('content:')) {
      contentStarted = true
      continue
    }
    if (contentStarted) {
      contentLines.push(line)
    }
  }
  
  return contentLines.join('\n').trim()
}

function extractCodeBlocks(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match
  let index = 0
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const language = match[1] || 'typescript'
    const content = match[2].trim()
    
    if (content.length > 50) { // Only include substantial code blocks
      files.push({
        filename: `generated-file-${index + 1}.${getFileExtension(language)}`,
        content,
        language,
        type: guessFileType(content)
      })
      index++
    }
  }
  
  return files
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    sql: 'sql',
    json: 'json',
    yaml: 'yml',
    dockerfile: 'dockerfile'
  }
  return extensions[language.toLowerCase()] || 'txt'
}

function guessFileType(content: string): 'api' | 'db' | 'test' | 'config' | 'middleware' {
  const lower = content.toLowerCase()
  
  if (lower.includes('test') || lower.includes('describe') || lower.includes('it(')) {
    return 'test'
  }
  if (lower.includes('prisma') || lower.includes('schema') || lower.includes('migration')) {
    return 'db'
  }
  if (lower.includes('middleware') || lower.includes('auth') || lower.includes('cors')) {
    return 'middleware'
  }
  if (lower.includes('config') || lower.includes('env') || lower.includes('docker')) {
    return 'config'
  }
  
  return 'api'
}