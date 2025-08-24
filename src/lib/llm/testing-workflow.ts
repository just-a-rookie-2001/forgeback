import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeneratedFile } from "./types";
import { DEVELOPMENT_TEST_PROMPT } from "./prompts";

export class TestingWorkflowManager {
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
    developmentContext: string,
    designContext?: string,
    planningContext?: string
  ): Promise<{
    artifacts: GeneratedFile[];
    summary: string;
  }> {
    try {
      console.log("🧪 Starting comprehensive testing workflow...");

      // Generate comprehensive test suite
      const testFiles = await this.generateTestSuite(
        userPrompt,
        developmentContext,
        designContext,
        planningContext
      );

      // Generate performance tests
      const performanceTests = await this.generatePerformanceTests(
        userPrompt,
        developmentContext
      );

      // Generate security tests
      const securityTests = await this.generateSecurityTests(
        userPrompt,
        developmentContext
      );

      // Generate integration tests
      const integrationTests = await this.generateIntegrationTests(
        userPrompt,
        developmentContext
      );

      // Generate test configuration and setup
      const testConfig = await this.generateTestConfiguration(
        userPrompt,
        developmentContext
      );

      const allArtifacts = [
        ...testFiles,
        ...performanceTests,
        ...securityTests,
        ...integrationTests,
        ...testConfig,
      ];

      const summary = `Generated comprehensive testing suite with ${allArtifacts.length} test artifacts:
- ${testFiles.length} unit test files
- ${integrationTests.length} integration test files
- ${performanceTests.length} performance test files
- ${securityTests.length} security test files
- ${testConfig.length} test configuration files`;

      console.log(
        `✅ Testing workflow completed: ${allArtifacts.length} artifacts`
      );

      return {
        artifacts: allArtifacts,
        summary,
      };
    } catch (error) {
      console.error("❌ Testing workflow failed:", error);
      throw new Error(
        `Testing workflow failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async generateTestSuite(
    userPrompt: string,
    developmentContext: string,
    designContext?: string,
    planningContext?: string
  ): Promise<GeneratedFile[]> {
    console.log("🧪 Generating comprehensive test suite...");

    try {
      const enhancedPrompt = DEVELOPMENT_TEST_PROMPT.replace(
        "{user_prompt}",
        userPrompt
      )
        .replace(
          "{design_context}",
          designContext || "No design context available"
        )
        .replace("{code_context}", developmentContext);

      const contextualPrompt = `${enhancedPrompt}

**Additional Context:**
${planningContext ? `Planning Context: ${planningContext}` : ""}
${designContext ? `Design Context: ${designContext}` : ""}

**Development Code to Test:**
${developmentContext}

**Focus Areas for Testing:**
1. **Unit Tests** - Test individual functions, classes, and components
2. **Component Tests** - Test React components with proper mocking
3. **API Tests** - Test all endpoints with various scenarios
4. **Database Tests** - Test data models and database interactions
5. **Utility Tests** - Test helper functions and utilities

**Testing Requirements:**
- Use modern testing frameworks (Jest, React Testing Library, Supertest)
- Include comprehensive test coverage
- Test both positive and negative scenarios
- Mock external dependencies appropriately
- Include proper setup and teardown
- Add realistic test data and fixtures

Generate comprehensive unit and component tests that cover all the generated code.`;

      const result = await this.llm.invoke(contextualPrompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating test suite:", error);
      return []; // Return empty array as fallback
    }
  }

  private async generatePerformanceTests(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("⚡ Generating performance tests...");

    try {
      const prompt = `You are an expert performance testing engineer. Generate comprehensive performance tests for the following development code.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate performance tests that include:

1. **Load Testing** - Test API endpoints under normal and high load
2. **Stress Testing** - Test system limits and breaking points
3. **Database Performance** - Test query performance and connection pooling
4. **Memory Usage** - Test for memory leaks and optimization
5. **Response Time** - Benchmark API response times
6. **Concurrent Users** - Test multiple simultaneous users

**Output Format:**
For each test file, use this exact format:

===FILE_START===
FILENAME: path/to/performance-test.js
LANGUAGE: javascript
TYPE: performance
CONTENT:
[Complete performance test file content]
===FILE_END===

Use tools like Artillery, k6, or custom Node.js scripts for performance testing.
Include proper metrics collection and reporting.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating performance tests:", error);
      return [];
    }
  }

  private async generateSecurityTests(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("🔒 Generating security tests...");

    try {
      const prompt = `You are an expert security testing engineer. Generate comprehensive security tests for the following development code.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate security tests that include:

1. **Authentication Tests** - Test login, logout, token validation
2. **Authorization Tests** - Test access controls and permissions
3. **Input Validation Tests** - Test XSS, SQL injection, CSRF protection
4. **API Security Tests** - Test rate limiting, CORS, headers
5. **Data Protection Tests** - Test encryption, sensitive data handling
6. **Session Management Tests** - Test session security and timeout

**Output Format:**
For each test file, use this exact format:

===FILE_START===
FILENAME: path/to/security-test.js
LANGUAGE: javascript
TYPE: security
CONTENT:
[Complete security test file content]
===FILE_END===

Include tests for common security vulnerabilities (OWASP Top 10).
Use proper security testing frameworks and tools.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating security tests:", error);
      return [];
    }
  }

  private async generateIntegrationTests(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("🔗 Generating integration tests...");

    try {
      const prompt = `You are an expert integration testing engineer. Generate comprehensive integration tests for the following development code.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate integration tests that include:

1. **API Integration Tests** - Test complete request/response flows
2. **Database Integration Tests** - Test data flow and transactions
3. **Service Integration Tests** - Test communication between services
4. **External API Tests** - Test third-party integrations
5. **End-to-End Workflows** - Test complete user scenarios
6. **Cross-Component Tests** - Test component interactions

**Output Format:**
For each test file, use this exact format:

===FILE_START===
FILENAME: path/to/integration-test.js
LANGUAGE: javascript
TYPE: integration
CONTENT:
[Complete integration test file content]
===FILE_END===

Use tools like Supertest, Playwright, or Cypress for integration testing.
Include proper test data setup and cleanup.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating integration tests:", error);
      return [];
    }
  }

  private async generateTestConfiguration(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("⚙️ Generating test configuration...");

    try {
      const prompt = `You are an expert test configuration specialist. Generate comprehensive test configuration files for the following development code.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate test configuration files that include:

1. **Jest Configuration** - Complete Jest setup with proper settings
2. **Test Environment Setup** - Environment variables and test database
3. **Mock Configuration** - Mock services and external dependencies
4. **Coverage Configuration** - Code coverage settings and thresholds
5. **CI/CD Test Pipeline** - Automated testing in CI/CD
6. **Test Data Fixtures** - Realistic test data and factories

**Output Format:**
For each config file, use this exact format:

===FILE_START===
FILENAME: path/to/config-file.json
LANGUAGE: json
TYPE: config
CONTENT:
[Complete configuration file content]
===FILE_END===

Include proper test scripts in package.json and documentation.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating test configuration:", error);
      return [];
    }
  }

  private parseGeneratedCode(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    try {
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
        let language = "javascript";
        let type = "unit";
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
            filename,
            content,
            language,
            type: type as
              | "api"
              | "db"
              | "test"
              | "config"
              | "middleware"
              | "component"
              | "page"
              | "service"
              | "style"
              | "utility"
              | "code",
          });

          console.log(
            `✅ Parsed test file: ${filename} (${content.length} chars)`
          );
        } else {
          console.warn(
            `⚠️ Skipping invalid test file: ${filename || "unnamed"}`
          );
        }
      }

      console.log(`📁 Total test files parsed: ${files.length}`);
      return files;
    } catch (error) {
      console.error("Error parsing generated test code:", error);
      return [];
    }
  }
}
