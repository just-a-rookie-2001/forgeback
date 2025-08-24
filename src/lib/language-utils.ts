/**
 * Utility functions for language detection and Monaco editor integration
 */

// Map file extensions to Monaco editor language identifiers
export const LANGUAGE_MAP: Record<string, string> = {
  // TypeScript/JavaScript
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  
  // Web Technologies
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  
  // Data formats
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  
  // Database
  '.sql': 'sql',
  
  // Infrastructure
  '.tf': 'hcl',
  '.hcl': 'hcl',
  '.dockerfile': 'dockerfile',
  
  // Config files
  '.ini': 'ini',
  '.conf': 'ini',
  '.properties': 'properties',
  '.env': 'shell',
  
  // Shell scripts
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  
  // Other
  '.md': 'markdown',
  '.txt': 'plaintext',
  '.log': 'plaintext',
};

// Common language aliases to Monaco language identifiers
export const LANGUAGE_ALIASES: Record<string, string> = {
  'ts': 'typescript',
  'tsx': 'typescript',
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'json': 'json',
  'sql': 'sql',
  'yaml': 'yaml',
  'yml': 'yaml',
  'dockerfile': 'dockerfile',
  'shell': 'shell',
  'bash': 'shell',
  'markdown': 'markdown',
  'md': 'markdown',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'hcl': 'hcl',
  'terraform': 'hcl',
  'tf': 'hcl',
};

/**
 * Detect the programming language based on filename and content
 */
export function detectLanguageFromFilename(filename: string): string {
  if (!filename) return 'plaintext';
  
  // Extract extension
  const extension = filename.toLowerCase().includes('.') 
    ? '.' + filename.split('.').pop()!
    : '';
  
  // Check if it's a special filename pattern
  if (filename.toLowerCase() === 'dockerfile') return 'dockerfile';
  if (filename.toLowerCase().includes('package.json')) return 'json';
  if (filename.toLowerCase().includes('tsconfig.json')) return 'json';
  if (filename.toLowerCase().includes('.env')) return 'shell';
  
  // Map by extension
  return LANGUAGE_MAP[extension] || 'plaintext';
}

/**
 * Detect language from the AI-provided language string
 */
export function normalizeLanguage(aiLanguage: string): string {
  if (!aiLanguage) return 'typescript'; // Default for backend development
  
  const normalized = aiLanguage.toLowerCase().trim();
  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * Combine filename and AI language detection for best results
 */
export function detectOptimalLanguage(filename: string, aiLanguage?: string): string {
  // If AI provided a language, normalize it
  if (aiLanguage && aiLanguage.trim()) {
    const normalized = normalizeLanguage(aiLanguage);
    // Verify it makes sense with the filename
    const fromFilename = detectLanguageFromFilename(filename);
    
    // If they match or AI language is more specific, use AI language
    if (fromFilename === 'plaintext' || normalized === fromFilename || 
        (normalized === 'typescript' && fromFilename === 'javascript')) {
      return normalized;
    }
  }
  
  // Fall back to filename detection
  const detected = detectLanguageFromFilename(filename);
  return detected !== 'plaintext' ? detected : 'typescript';
}

/**
 * Clean code content by removing markdown code blocks and other artifacts
 */
export function cleanCodeContent(content: string, language?: string): string {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Remove markdown code blocks
  const codeBlockPattern = /^```[\w]*\n?([\s\S]*?)\n?```$/;
  const match = cleaned.match(codeBlockPattern);
  if (match) {
    cleaned = match[1].trim();
  }
  
  // Remove multiple leading/trailing code block markers
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, '');
  cleaned = cleaned.replace(/\n?```$/gm, '');
  
  // Remove language indicators at the start of content
  if (language) {
    const langPattern = new RegExp(`^${language}\\s*\\n`, 'i');
    cleaned = cleaned.replace(langPattern, '');
  }
  
  // Clean up excessive whitespace but preserve formatting
  cleaned = cleaned.replace(/^\n+/, '').replace(/\n+$/, '');
  
  return cleaned;
}

/**
 * Get appropriate file extension for a given language
 */
export function getFileExtensionForLanguage(language: string): string {
  const extensionMap: Record<string, string> = {
    'typescript': '.ts',
    'javascript': '.js',
    'json': '.json',
    'sql': '.sql',
    'yaml': '.yml',
    'hcl': '.tf',
    'dockerfile': '.dockerfile',
    'shell': '.sh',
    'markdown': '.md',
    'html': '.html',
    'css': '.css',
    'scss': '.scss',
  };
  
  return extensionMap[language.toLowerCase()] || '.txt';
}

/**
 * Check if a language is supported by Monaco Editor
 */
export function isLanguageSupported(language: string): boolean {
  const supportedLanguages = [
    'typescript', 'javascript', 'json', 'html', 'css', 'scss', 'sql',
    'yaml', 'markdown', 'dockerfile', 'shell', 'hcl', 'plaintext'
  ];
  
  return supportedLanguages.includes(language.toLowerCase());
}
