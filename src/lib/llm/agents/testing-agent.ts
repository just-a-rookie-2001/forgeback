import { Agent } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";
import { ContextRetriever } from "../context-retriever";
import { TestingWorkflowManager } from "../workflows/testing-workflow";
import { GeneratedFile } from "../types";

interface TestWorkflowResult {
  artifacts: GeneratedFile[];
  summary: string;
}

export class TestingAgent implements Agent {
  private contextRetriever: ContextRetriever;
  private testingWorkflow: TestingWorkflowManager;

  constructor() {
    this.contextRetriever = new ContextRetriever();
    this.testingWorkflow = new TestingWorkflowManager();
  }

  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    try {
      console.log(`🧪 Testing Agent: Starting test generation for stage ${stage.id}`);

      // Retrieve context from previous stages with comprehensive fallbacks
      const developmentContext = await this.retrieveDevelopmentContext(stage.projectId);
      const designContext = await this.retrieveDesignContext(stage.projectId);
      const planningContext = await this.retrievePlanningContext(stage.projectId);

      // Generate comprehensive test artifacts using the testing workflow
      const workflowResult = await this.testingWorkflow.executeWorkflow(
        prompt,
        developmentContext,
        designContext,
        planningContext
      );

      const createdArtifacts: Artifact[] = [];

      // Create artifacts for generated test files
      if (workflowResult.artifacts && workflowResult.artifacts.length > 0) {
        console.log(`📄 Creating ${workflowResult.artifacts.length} test artifacts...`);
        
        for (const file of workflowResult.artifacts) {
          try {
            const artifact = await db.artifact.create({
              data: {
                name: file.filename,
                content: file.content,
                type: 'test',
                language: file.language,
                stageId: stage.id,
              },
            });
            createdArtifacts.push(artifact);
            console.log(`✅ Created test artifact: ${file.filename}`);
          } catch (error) {
            console.error(`❌ Failed to create test artifact ${file.filename}:`, error);
          }
        }
      }

      // Create a comprehensive test summary artifact
      const summaryContent = this.createTestSummary(workflowResult, developmentContext);
      const summaryArtifact = await db.artifact.create({
        data: {
          name: "Testing Summary and Strategy",
          content: summaryContent,
          type: "documentation",
          stageId: stage.id,
        },
      });
      createdArtifacts.push(summaryArtifact);

      // Create test execution guide
      const executionGuide = await this.createTestExecutionGuide(workflowResult.artifacts);
      const guideArtifact = await db.artifact.create({
        data: {
          name: "Test Execution Guide",
          content: executionGuide,
          type: "documentation", 
          stageId: stage.id,
        },
      });
      createdArtifacts.push(guideArtifact);

      console.log(`✅ Testing Agent: Created ${createdArtifacts.length} testing artifacts`);
      return createdArtifacts;

    } catch (error) {
      console.error('❌ Testing Agent failed:', error);

      // Create fallback test plan artifact
      const fallbackContent = this.createFallbackTestPlan(prompt);
      const fallbackArtifact = await db.artifact.create({
        data: {
          name: "Basic Test Plan (Fallback)",
          content: fallbackContent,
          type: "documentation",
          stageId: stage.id,
        },
      });

      return [fallbackArtifact];
    }
  }

  private async retrieveDevelopmentContext(projectId: string): Promise<string> {
    try {
      const context = await this.contextRetriever.retrieveRelevantContext(
        projectId, 
        'DEVELOPMENT',
        'Generate comprehensive test coverage for the development code including unit tests, integration tests, and performance tests'
      );
      
      if (context && context.length > 0) {
        console.log('✅ Retrieved development context for testing');
        return this.contextRetriever.formatContextForPrompt(context);
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve development context:', error);
    }

    return 'No development context available - will generate basic test structure';
  }

  private async retrieveDesignContext(projectId: string): Promise<string> {
    try {
      const context = await this.contextRetriever.retrieveRelevantContext(
        projectId,
        'DESIGN', 
        'System architecture and API design for comprehensive test planning'
      );
      
      if (context && context.length > 0) {
        console.log('✅ Retrieved design context for testing');
        return this.contextRetriever.formatContextForPrompt(context);
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve design context:', error);
    }

    return 'No design context available';
  }

  private async retrievePlanningContext(projectId: string): Promise<string> {
    try {
      const context = await this.contextRetriever.retrieveRelevantContext(
        projectId,
        'PLANNING',
        'Project requirements and business logic for test case generation'
      );
      
      if (context && context.length > 0) {
        console.log('✅ Retrieved planning context for testing');
        return this.contextRetriever.formatContextForPrompt(context);
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve planning context:', error);
    }

    return 'No planning context available';
  }

  private createTestSummary(workflowResult: TestWorkflowResult, developmentContext: string): string {
    return `# Comprehensive Testing Strategy

## Overview
${workflowResult.summary}

## Context Analysis
**Development Context Available:** ${developmentContext !== 'No development context available - will generate basic test structure' ? 'Yes' : 'No'}
**Generated Test Files:** ${workflowResult.artifacts?.length || 0}

## Test Coverage Strategy

### 1. Unit Testing
- Individual function and component testing
- Mocking external dependencies
- Edge case validation
- Input/output verification

### 2. Integration Testing  
- API endpoint testing
- Database integration testing
- Service communication testing
- External API integration testing

### 3. Performance Testing
- Load testing under normal conditions
- Stress testing at system limits
- Database query performance
- Memory usage monitoring

### 4. Security Testing
- Authentication and authorization testing
- Input validation and sanitization
- OWASP Top 10 vulnerability testing
- Data protection and encryption testing

## Test Execution Order
1. Run unit tests first
2. Execute integration tests
3. Perform security testing
4. Conduct performance testing
5. Generate coverage reports

## Quality Metrics
- Target code coverage: 80%+
- Performance benchmarks defined
- Security vulnerability scanning
- Integration test success rate

## Continuous Testing
- Automated test execution in CI/CD
- Test results reporting
- Performance regression detection
- Security scan integration

Generated on: ${new Date().toISOString()}
`;
  }

  private async createTestExecutionGuide(testFiles: GeneratedFile[]): Promise<string> {
    const unitTests = testFiles.filter(f => f.filename.includes('.test.') || f.filename.includes('.spec.'));
    const integrationTests = testFiles.filter(f => f.filename.includes('integration'));
    const performanceTests = testFiles.filter(f => f.filename.includes('performance') || f.filename.includes('load'));
    const securityTests = testFiles.filter(f => f.filename.includes('security') || f.filename.includes('auth'));

    return `# Test Execution Guide

## Prerequisites
1. Install test dependencies:
   \`\`\`bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom supertest
   \`\`\`

2. Set up test environment variables
3. Initialize test database (if applicable)

## Running Tests

### Unit Tests (${unitTests.length} files)
\`\`\`bash
npm test
# or
npm run test:unit
\`\`\`

### Integration Tests (${integrationTests.length} files)
\`\`\`bash
npm run test:integration
\`\`\`

### Performance Tests (${performanceTests.length} files)
\`\`\`bash
npm run test:performance
\`\`\`

### Security Tests (${securityTests.length} files)
\`\`\`bash
npm run test:security
\`\`\`

### All Tests
\`\`\`bash
npm run test:all
\`\`\`

## Coverage Reports
Generate test coverage reports:
\`\`\`bash
npm run test:coverage
\`\`\`

## Test Files Generated
${testFiles.map(f => `- ${f.filename} (${f.type})`).join('\n')}

## Continuous Integration
Add these scripts to your CI/CD pipeline for automated testing.

## Troubleshooting
- Check environment variables are set correctly
- Ensure test database is accessible
- Verify all dependencies are installed
- Check for port conflicts in integration tests

Generated on: ${new Date().toISOString()}
`;
  }

  private createFallbackTestPlan(prompt: string): string {
    return `# Basic Test Plan (Fallback)

## Project: ${prompt}

## 1. Unit Tests
- Test individual functions and components
- Mock external dependencies
- Verify expected inputs and outputs
- Test edge cases and error conditions

## 2. Integration Tests  
- Test API endpoints
- Test database operations
- Test service interactions
- Test external API calls

## 3. End-to-End Tests
- Test complete user workflows
- Test critical business processes
- Test user interface interactions
- Test data flow from UI to database

## 4. Performance Tests
- Load testing
- Stress testing  
- Memory usage testing
- Response time testing

## 5. Security Tests
- Authentication testing
- Authorization testing
- Input validation testing
- Data protection testing

## Test Implementation Notes
This is a basic test plan generated as fallback. For comprehensive testing:
1. Analyze the actual code structure
2. Identify critical business logic
3. Create detailed test scenarios
4. Implement proper mocking strategies
5. Set up continuous testing pipeline

Generated on: ${new Date().toISOString()}
Status: Fallback mode - limited context available
`;
  }
}
