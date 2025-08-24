import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import type { GeneratedFile } from "./types";

// Development workflow result interface
export interface DevelopmentWorkflowResult {
  backendFiles: GeneratedFile[];
  testFiles: GeneratedFile[];
  configFiles: GeneratedFile[];
  success: boolean;
  error?: string;
}

export class DevelopmentWorkflowManager {
  private llm: ChatGoogleGenerativeAI;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0.2,
      apiKey: process.env.GOOGLE_API_KEY!,
      maxOutputTokens: 8192,
    });
  }

  async executeWorkflow(
    userPrompt: string,
    designContext: string,
    planningContext: string
  ): Promise<DevelopmentWorkflowResult> {
    console.log("💻 Executing development workflow...");

    try {
      // Step 1: Generate backend code
      console.log("🔧 Step 1: Generating backend implementation...");
      const backendFiles = await this.generateBackendCode(
        userPrompt,
        designContext,
        planningContext
      );

      // Step 2: Generate test files
      console.log("🧪 Step 3: Generating test files...");
      const testFiles = await this.generateTestFiles(
        userPrompt,
        backendFiles,
      );

      // Step 3: Generate configuration files
      console.log("⚙️ Step 4: Generating configuration files...");
      const configFiles = await this.generateConfigFiles(
        userPrompt,
        designContext
      );

      console.log("✅ Development workflow completed successfully");

      return {
        backendFiles,
        testFiles,
        configFiles,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error executing development workflow:", error);

      return {
        backendFiles: [],
        testFiles: [],
        configFiles: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async generateBackendCode(
    userPrompt: string,
    designContext: string,
    planningContext: string
  ): Promise<GeneratedFile[]> {
    const backendPrompt = `You are an expert backend developer. Generate complete, production-ready backend code based on the requirements and design specifications.

**Project Requirements:**
{user_prompt}

**System Design Context:**
{design_context}

**Planning Context:**
{planning_context}

**Your Task:**
Generate a complete backend implementation with the following components:

1. **API Routes** - RESTful endpoints with proper HTTP methods and error handling
2. **Database Models** - Schema definitions with relationships and validations
3. **Middleware** - Authentication, validation, CORS, rate limiting
4. **Services** - Business logic layer with clean separation of concerns
5. **Utilities** - Helper functions, constants, and shared utilities

**Technical Requirements:**
- Use **TypeScript** for type safety and better developer experience
- Include **comprehensive error handling** with proper HTTP status codes
- Add **input validation** using Zod schemas or similar
- Write **detailed JSDoc comments** for all functions and classes
- Follow **REST API best practices** and conventions
- Include **security middleware** (helmet, rate limiting, CORS)
- Add **logging** with appropriate log levels
- Generate **realistic examples** with sample data

**Database Requirements:**
- Design **normalized database schemas** with proper relationships
- Include **database migrations** for schema management
- Add **indexes** for performance optimization
- Implement **connection pooling** and proper connection management

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
- Generate **complete, runnable code** (no placeholders or TODO comments)
- Include **all necessary imports and dependencies**
- Add **proper TypeScript types** for all functions and variables
- Create **realistic, working examples** with sample data
- Ensure **code follows modern patterns** and best practices
- Include **environment variable references** where needed
- Add **comprehensive error handling** for edge cases

Generate a complete backend implementation that follows the design specifications and requirements.`;

    const chain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(backendPrompt),
    });

    const response = await chain.call({
      user_prompt: userPrompt,
      design_context: designContext,
      planning_context: planningContext,
    });

    return this.parseGeneratedCode(response.text);
  }

  private async generateTestFiles(
    userPrompt: string,
    backendFiles: GeneratedFile[]
  ): Promise<GeneratedFile[]> {
    const testPrompt = `You are an expert in software testing. Generate comprehensive test suites for backend code.

**Project Requirements:**
{user_prompt}

**Backend Files to Test:**
{backend_files}

**Your Task:**
Generate comprehensive test suites including:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and component interactions
3. **End-to-End Tests** - Test complete user workflows
4. **API Tests** - Test REST endpoints with various scenarios

**Technical Requirements:**
- Use **Jest** and **Supertest** for backend API tests
- Include **test data factories** for consistent test data
- Add **mocking** for external dependencies
- Include **edge cases** and error scenarios
- Add **performance tests** for critical paths
- Use **proper assertions** and descriptive test names

**Output Format:**
For each test file, use this exact format:

===FILE_START===
FILENAME: path/to/test.test.ts
LANGUAGE: typescript
TYPE: test
CONTENT:
[Complete test file content with all necessary imports and test cases]
===FILE_END===

Generate comprehensive test coverage for all major functionality.`;

    // Summarize files for context
    const backendSummary = backendFiles
      .map((f) => `${f.filename}: ${f.type}`)
      .join("\n");

    const chain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(testPrompt),
    });

    const response = await chain.call({
      user_prompt: userPrompt,
      backend_files: backendSummary,
    });

    return this.parseGeneratedCode(response.text);
  }

  private async generateConfigFiles(
    userPrompt: string,
    designContext: string
  ): Promise<GeneratedFile[]> {
    const configPrompt = `You are a DevOps expert. Generate comprehensive configuration files for development, testing, and deployment.

**Project Requirements:**
{user_prompt}

**System Design Context:**
{design_context}

**Your Task:**
Generate configuration files including:

1. **Package.json** - Dependencies and scripts for Node.js projects
2. **TypeScript Config** - tsconfig.json with optimal settings
3. **Environment Files** - .env templates with required variables
4. **Docker Files** - Containerization setup
5. **CI/CD Config** - GitHub Actions or similar
6. **Database Config** - Connection and migration setup
7. **Build Config** - Webpack, Vite, or Next.js configuration

**Technical Requirements:**
- Include **all necessary dependencies** with appropriate versions
- Add **development scripts** for common tasks
- Include **environment variable templates** with documentation
- Add **Docker multi-stage builds** for optimization
- Include **CI/CD pipelines** with testing and deployment
- Add **database migration scripts** and seeders
- Include **monitoring and logging** configuration

**Output Format:**
For each config file, use this exact format:

===FILE_START===
FILENAME: path/to/config.json
LANGUAGE: json|yaml|dockerfile|javascript
TYPE: config
CONTENT:
[Complete configuration file content]
===FILE_END===

Generate production-ready configuration files that support the entire development lifecycle.`;

    const chain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(configPrompt),
    });

    const response = await chain.call({
      user_prompt: userPrompt,
      design_context: designContext,
    });

    return this.parseGeneratedCode(response.text);
  }

  private extractApiEndpoints(backendFiles: GeneratedFile[]): string {
    // Extract API endpoint information from backend files
    const apiFiles = backendFiles.filter(
      (file) =>
        file.type === "api" ||
        file.filename.includes("route") ||
        file.filename.includes("controller")
    );

    if (apiFiles.length === 0) {
      return "No API endpoints found in backend files.";
    }

    return apiFiles
      .map((file) => {
        // Simple extraction - in a real implementation, you might parse the code more thoroughly
        const endpoints =
          file.content.match(
            /\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
          ) || [];
        return `${file.filename}:\n${endpoints.join("\n")}`;
      })
      .join("\n\n");
  }

  private parseGeneratedCode(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const fileBlocks = response.split("===FILE_START===");

    for (let i = 1; i < fileBlocks.length; i++) {
      const block = fileBlocks[i];
      const endIndex = block.indexOf("===FILE_END===");

      if (endIndex === -1) continue;

      const fileContent = block.substring(0, endIndex).trim();
      const lines = fileContent.split("\n");

      let filename = "";
      let language = "";
      let type = "";
      let content = "";

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();

        if (line.startsWith("FILENAME:")) {
          filename = line.replace("FILENAME:", "").trim();
        } else if (line.startsWith("LANGUAGE:")) {
          language = line.replace("LANGUAGE:", "").trim();
        } else if (line.startsWith("TYPE:")) {
          type = line.replace("TYPE:", "").trim();
        } else if (line === "CONTENT:") {
          content = lines.slice(j + 1).join("\n");
          break;
        }
      }

      if (filename && content) {
        files.push({
          filename,
          content: content.trim(),
          language: language || "typescript",
          type: (type as GeneratedFile["type"]) || "code",
        });
      }
    }

    return files;
  }
}
