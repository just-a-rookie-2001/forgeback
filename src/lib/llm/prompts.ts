import type { GeneratedFile } from "./types";

// Project Planning Agent Prompts
export const PROJECT_PLANNING_PROMPT = `You are an expert project manager and technical architect with deep knowledge of software development lifecycles. Your task is to create a comprehensive project plan based on the user's requirements.

**User Requirements:**
{user_prompt}

**Your Task:**
Generate a detailed project plan that serves as a roadmap for developing the requested software project. The plan should be thorough, actionable, and technically sound.

**Required Sections:**

1. **Project Overview**
   - Clear project title and description
   - Target audience and user personas
   - Core problem being solved
   - Key success metrics

2. **Goals and Objectives**
   - Primary business objectives
   - Technical objectives
   - User experience goals
   - Performance and scalability targets

3. **Scope Definition**
   - In-scope features and functionality
   - Out-of-scope items (what won't be included)
   - Assumptions and constraints
   - Dependencies on external systems

4. **Technical Architecture**
   - Technology stack recommendations
   - System architecture overview
   - Database design considerations
   - API design approach
   - Security considerations

5. **Feature Breakdown**
   - Core features (MVP)
   - Nice-to-have features (Phase 2)
   - User stories with acceptance criteria
   - Priority ranking

6. **Development Timeline**
   - Project phases and milestones
   - Estimated effort for each phase
   - Critical path identification
   - Risk mitigation strategies

7. **Resource Requirements**
   - Technical skills needed
   - Development team structure
   - Infrastructure requirements
   - Third-party services or tools

8. **Risk Assessment**
   - Technical risks and mitigation plans
   - Business risks and contingencies
   - Timeline risks and buffer strategies

**Output Guidelines:**
- Use clear, professional language
- Include specific technical recommendations
- Provide realistic timelines and effort estimates
- Consider both technical and business aspects
- Make the plan actionable and implementable
- Use markdown formatting for better readability

Generate a comprehensive project plan that a development team can follow from start to finish.`;

// Design Agent Prompts
export const DATABASE_DESIGN_PROMPT = `Create a comprehensive database design based on the system architecture.

**System Design Context:**
{design_context}

**Requirements:**
- Entity Relationship Diagram (described in text)
- Table schemas with proper data types
- Relationships and constraints
- Indexing strategies for performance
- Migration scripts

**Output:**
Provide database schema definitions and migration scripts.`;

// Development Agent Prompts
export const DEVELOPMENT_BACKEND_PROMPT = `You are an expert backend developer. Generate complete, production-ready backend code based on requirements and design specifications.

**Project Requirements:**
{user_prompt}

**System Design Context:**
{design_context}

**Planning Context:**
{planning_context}

**Your Task:**
Generate a complete backend implementation with the following components:

1. **API Routes** - RESTful endpoints with proper HTTP methods and comprehensive error handling
2. **Database Models** - Schema definitions with relationships, validations, and type safety
3. **Middleware** - Authentication, validation, CORS, rate limiting, security headers
4. **Services** - Business logic layer with clean separation of concerns
5. **Utilities** - Helper functions, constants, validation schemas, and shared utilities
6. **Database Integration** - Connection management, query builders, migrations

**Technical Requirements:**
- Use **TypeScript** for complete type safety and better developer experience
- Include **comprehensive error handling** with proper HTTP status codes and user-friendly messages
- Add **robust input validation** using Zod schemas or similar validation libraries
- Write **detailed JSDoc comments** for all functions, classes, and complex logic
- Follow **REST API best practices** and OpenAPI 3.0 standards
- Include **security middleware** (helmet, rate limiting, CORS, input sanitization)
- Add **structured logging** with appropriate log levels and context
- Implement **database transactions** for data consistency
- Include **authentication/authorization** with JWT or similar
- Add **API versioning** and deprecation strategies

**Performance & Scalability:**
- Implement **connection pooling** for database connections
- Add **caching strategies** where appropriate (Redis, in-memory)
- Include **query optimization** and proper indexing
- Implement **pagination** for list endpoints
- Add **request/response compression**

**Output Format:**
For each file you generate, use this exact format:

===FILE_START===
FILENAME: path/to/file.ext
LANGUAGE: typescript|javascript|sql|json
TYPE: api|db|middleware|service|utility|config
CONTENT:
[Complete file content here - include all imports, functions, and exports]
===FILE_END===

**Important Guidelines:**
- Generate **complete, runnable code** (no placeholders, TODO comments, or incomplete implementations)
- Include **all necessary imports and dependencies** with proper module resolution
- Add **comprehensive TypeScript types** for all functions, variables, and API contracts
- Create **realistic, working examples** with sample data and edge cases
- Ensure **code follows modern ES6+ patterns** and best practices
- Include **environment variable references** with proper defaults and validation
- Add **comprehensive error handling** for all edge cases and failure scenarios
- Implement **proper HTTP status codes** for all response scenarios
- Include **API documentation** in comments for complex endpoints

Generate a production-ready backend that implements the design specifications with high code quality, security, and performance standards.`;

export const DEVELOPMENT_TEST_PROMPT = `You are an expert test engineer and QA specialist. Generate comprehensive test suites for the generated code.

**Project Requirements:**
{user_prompt}

**System Design Context:**
{design_context}

**Generated Code Context:**
{code_context}

**Your Task:**
Generate complete test coverage with the following test types:

1. **Unit Tests** - Individual function and component testing
2. **Integration Tests** - API endpoint and service integration testing  
3. **E2E Tests** - Critical user journey testing
4. **Performance Tests** - Load testing and performance benchmarks
5. **Security Tests** - Authentication, authorization, and input validation testing

**Output Format:**
For each test file, use this exact format:

===FILE_START===
FILENAME: path/to/test-file.test.ext
LANGUAGE: typescript|javascript
TYPE: unit|integration|e2e|performance|security
CONTENT:
[Complete test file content]
===FILE_END===

Generate comprehensive test coverage that ensures code quality and reliability.`;

export const DEVELOPMENT_CONFIG_PROMPT = `You are an expert DevOps engineer and configuration specialist. Generate all necessary configuration files for deployment and development.

**Project Requirements:**
{user_prompt}

**System Design Context:**
{design_context}

**Your Task:**
Generate all configuration files needed for:

1. **Development Environment** - Local development setup
2. **Build Configuration** - Webpack, Vite, or similar build tools
3. **CI/CD Pipeline** - GitHub Actions, GitLab CI, or similar
4. **Docker Configuration** - Containerization for deployment
5. **Environment Configuration** - Environment variables and secrets
6. **Deployment Configuration** - Cloud deployment configurations

**Output Format:**
For each config file, use this exact format:

===FILE_START===
FILENAME: path/to/config-file.ext
LANGUAGE: yaml|json|dockerfile|shell
TYPE: env|build|ci|docker|deploy
CONTENT:
[Complete configuration file content]
===FILE_END===

Generate production-ready configurations with proper security and best practices.`;

export const SYSTEM_DESIGN_PROMPT = `You are an expert system architect and technical design lead. Your task is to create a comprehensive system design based on the project requirements and planning context.

**Project Requirements:**
{user_prompt}

**Previous Context from Planning Stage:**
{context}

**Your Task:**
Create a detailed system design that includes:

1. **System Architecture**
   - High-level architecture diagram (describe in text)
   - Component relationships and data flow
   - Technology stack recommendations
   - Scalability considerations

2. **Data Architecture**
   - Database schema design
   - Data models and relationships  
   - Data flow diagrams
   - Storage strategies

3. **API Design**
   - RESTful API endpoints specification
   - Request/response schemas
   - Authentication and authorization flow
   - Rate limiting and security considerations

4. **Infrastructure Design**
   - Deployment architecture
   - Service communication patterns
   - Monitoring and logging strategy
   - Performance considerations

5. **Security Design**
   - Authentication mechanisms
   - Authorization patterns
   - Data protection strategies
   - Security best practices

**Output Requirements:**
- Be specific and actionable
- Include concrete technology recommendations
- Consider scalability and maintainability
- Address security and compliance requirements
- Provide clear rationale for design decisions

**Format:**
Use clear markdown structure with sections and subsections. Include diagrams described in text format when helpful.`;

export const API_SPECIFICATION_PROMPT = `Based on the system design, create a detailed API specification.

**System Design Context:**
{design_context}

**Requirements:**
- OpenAPI 3.0 specification format
- Complete endpoint definitions
- Request/response schemas
- Authentication requirements
- Error handling specifications
- Rate limiting details

**Output:**
Provide a complete OpenAPI specification in YAML format.`;

export const DATABASE_SCHEMA_PROMPT = `Create a comprehensive database design based on the system architecture.
**System Design Context:**
{design_context}

**Requirements:**
- Entity Relationship Diagram (described in text)
- Table schemas with proper data types
- Relationships and constraints
- Indexing strategies
- Migration scripts

**Output:**
Provide database schema definitions and migration scripts.`;

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

Generate production-quality code that a developer could immediately use in a real application. Be thorough and detailed in your implementation.`;

export function parseGeneratedCode(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // Split by file markers and process each block
  const fileBlocks = response.split("===FILE_START===").slice(1);

  for (const block of fileBlocks) {
    const endIndex = block.indexOf("===FILE_END===");
    if (endIndex === -1) {
      console.warn("⚠️ Found incomplete file block, skipping...");
      continue;
    }

    const fileContent = block.substring(0, endIndex).trim();
    const lines = fileContent.split("\n");

    let filename = "";
    let language = "typescript";
    let type = "api";
    let content = "";

    // Parse file metadata
    let contentStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("FILENAME:")) {
        filename = line.replace("FILENAME:", "").trim();
      } else if (line.startsWith("LANGUAGE:")) {
        language = line.replace("LANGUAGE:", "").trim();
      } else if (line.startsWith("TYPE:")) {
        type = line.replace("TYPE:", "").trim();
      } else if (line.startsWith("CONTENT:")) {
        contentStartIndex = i + 1;
        break;
      }
    }

    // Extract file content
    content = lines.slice(contentStartIndex).join("\n").trim();

    // Validate and add file
    if (filename && content && content.length > 10) {
      files.push({
        filename: filename.startsWith("/") ? filename.slice(1) : filename,
        content,
        language,
        type: type as "api" | "db" | "test" | "config" | "middleware",
      });

      console.log(`✅ Parsed file: ${filename} (${content.length} chars)`);
    } else {
      console.warn(`⚠️ Skipping invalid file: ${filename || "unnamed"}`);
    }
  }

  console.log(`📁 Total files parsed: ${files.length}`);
  return files;
}

// Alternative parsing function with better error handling
export function parseGeneratedCodeRobust(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  try {
    // Handle different possible file separators
    const possibleSeparators = [
      "===FILE_START===",
      "=== FILE_START ===",
      "--- FILE START ---",
      "```file:",
    ];

    let separator = "===FILE_START===";
    for (const sep of possibleSeparators) {
      if (response.includes(sep)) {
        separator = sep;
        break;
      }
    }

    const blocks = response.split(separator).slice(1);

    for (const block of blocks) {
      const file = parseFileBlock(block, separator);
      if (file) {
        files.push(file);
      }
    }
  } catch (error) {
    console.error("Error parsing Gemini response:", error);

    // Fallback: try to extract code blocks
    const codeBlocks = extractCodeBlocks(response);
    files.push(...codeBlocks);
  }

  return files;
}

function parseFileBlock(
  block: string,
  separator: string
): GeneratedFile | null {
  try {
    const endMarkers = [
      "===FILE_END===",
      "=== FILE_END ===",
      "--- FILE END ---",
      "```",
      separator,
    ];
    let endIndex = -1;

    for (const marker of endMarkers) {
      const index = block.indexOf(marker);
      if (index !== -1) {
        endIndex = index;
        break;
      }
    }

    if (endIndex === -1) {
      endIndex = block.length;
    }

    const content = block.substring(0, endIndex).trim();
    const lines = content.split("\n");

    const metadata = extractMetadata(lines);
    const fileContent = extractContent(lines);

    if (metadata.filename && fileContent) {
      return {
        filename: metadata.filename,
        content: fileContent,
        language: metadata.language,
        type: metadata.type,
      };
    }
  } catch (error) {
    console.warn("Error parsing file block:", error);
  }

  return null;
}

function extractMetadata(lines: string[]) {
  let filename = "";
  let language = "typescript";
  let type = "api";

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith("filename:") || trimmed.startsWith("file:")) {
      filename = line.split(":").slice(1).join(":").trim();
    } else if (trimmed.startsWith("language:") || trimmed.startsWith("lang:")) {
      language = line.split(":")[1]?.trim() || "typescript";
    } else if (trimmed.startsWith("type:")) {
      type = line.split(":")[1]?.trim() || "api";
    }
  }

  return {
    filename,
    language,
    type: type as "api" | "db" | "test" | "config" | "middleware",
  };
}

function extractContent(lines: string[]): string {
  let contentStarted = false;
  const contentLines: string[] = [];

  for (const line of lines) {
    if (line.trim().toLowerCase().startsWith("content:")) {
      contentStarted = true;
      continue;
    }
    if (contentStarted) {
      contentLines.push(line);
    }
  }

  return contentLines.join("\n").trim();
}

function extractCodeBlocks(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const language = match[1] || "typescript";
    const content = match[2].trim();

    if (content.length > 50) {
      // Only include substantial code blocks
      files.push({
        filename: `generated-file-${index + 1}.${getFileExtension(language)}`,
        content,
        language,
        type: guessFileType(content),
      });
      index++;
    }
  }

  return files;
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    typescript: "ts",
    javascript: "js",
    sql: "sql",
    json: "json",
    yaml: "yml",
    dockerfile: "dockerfile",
  };
  return extensions[language.toLowerCase()] || "txt";
}

function guessFileType(
  content: string
): "api" | "db" | "test" | "config" | "middleware" {
  const lower = content.toLowerCase();

  if (
    lower.includes("test") ||
    lower.includes("describe") ||
    lower.includes("it(")
  ) {
    return "test";
  }
  if (
    lower.includes("prisma") ||
    lower.includes("schema") ||
    lower.includes("migration")
  ) {
    return "db";
  }
  if (
    lower.includes("middleware") ||
    lower.includes("auth") ||
    lower.includes("cors")
  ) {
    return "middleware";
  }
  if (
    lower.includes("config") ||
    lower.includes("env") ||
    lower.includes("docker")
  ) {
    return "config";
  }

  return "api";
}
