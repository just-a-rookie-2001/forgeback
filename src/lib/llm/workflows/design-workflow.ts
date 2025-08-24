import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

// Simple workflow result interface
export interface DesignWorkflowResult {
  systemDesign: string;
  apiSpec: string;
  databaseDesign: string;
  success: boolean;
  error?: string;
}

export class DesignWorkflowManager {
  private llm: ChatGoogleGenerativeAI;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      temperature: 0.2,
      apiKey: process.env.GOOGLE_API_KEY!,
      maxOutputTokens: 8192,
    });
  }

  async executeWorkflow(
    userPrompt: string, 
    context: string
  ): Promise<DesignWorkflowResult> {
    console.log('🎨 Executing design workflow...');

    try {
      // Step 1: Create system design
      console.log('🏗️  Step 1: Creating system design...');
      const systemDesign = await this.createSystemDesign(userPrompt, context);

      // Step 2: Create API specification
      console.log('🔌 Step 2: Creating API specification...');
      const apiSpec = await this.createApiSpec(systemDesign);

      // Step 3: Create database design
      console.log('🗄️  Step 3: Creating database design...');
      const databaseDesign = await this.createDatabaseDesign(systemDesign);

      console.log('✅ Design workflow completed successfully');
      
      return {
        systemDesign,
        apiSpec,
        databaseDesign,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error executing design workflow:', error);
      
      return {
        systemDesign: '',
        apiSpec: '',
        databaseDesign: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createSystemDesign(userPrompt: string, context: string): Promise<string> {
    const systemDesignPrompt = `You are an expert system architect. Create a comprehensive system design.

**Project Requirements:**
{user_prompt}

**Context from Previous Stages:**
{context}

Create a detailed system design that includes:

## 1. System Architecture Overview
- High-level architecture pattern (microservices, monolith, etc.)
- Core components and their responsibilities
- Technology stack recommendations

## 2. Component Architecture
- Backend services breakdown
- Database and data layer design
- External service integrations

## 3. Data Flow Architecture
- Request/response flow
- Data processing pipelines
- Event handling and messaging
- Caching strategies

## 4. Scalability & Performance
- Horizontal and vertical scaling approaches
- Load balancing strategies
- Performance bottleneck identification
- Optimization recommendations

## 5. Security Architecture
- Authentication and authorization flow
- Data protection measures
- API security considerations
- Infrastructure security

Provide a comprehensive, actionable system design that developers can implement.`;

    const chain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(systemDesignPrompt),
    });

    const response = await chain.call({
      user_prompt: userPrompt,
      context: context,
    });

    return response.text;
  }

  private async createApiSpec(systemDesign: string): Promise<string> {
    const apiPrompt = `Based on the system design, create a detailed API specification.

**System Design:**
{system_design}

Create a comprehensive API specification that includes:

## API Overview
- Base URL and versioning strategy
- Authentication mechanism
- Rate limiting policies

## Core Endpoints
For each endpoint, specify:
- HTTP method and path
- Request parameters and body schema
- Response schema and status codes
- Error handling

## Authentication & Security
- Token-based authentication flow
- Authorization levels and scopes
- Security headers and CORS policy

## Data Schemas
- Request/response object definitions
- Validation rules and constraints
- Data relationships

Format the specification as detailed documentation that can guide API implementation.`;

    const chain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(apiPrompt),
    });

    const response = await chain.call({
      system_design: systemDesign,
    });

    return response.text;
  }

  private async createDatabaseDesign(systemDesign: string): Promise<string> {
    const dbPrompt = `Based on the system design, create a comprehensive database design.

**System Design:**
{system_design}

Create a detailed database design that includes:

## 1. Data Model Overview
- Entity relationship description
- Core business entities
- Data flow and relationships

## 2. Database Schema
- Table definitions with columns and data types
- Primary and foreign key relationships
- Constraints and validation rules

## 3. Indexing Strategy
- Performance-critical indexes
- Composite indexes for complex queries
- Unique constraints

## 4. Data Architecture
- Database normalization approach
- Denormalization considerations for performance
- Archival and data retention strategies

## 5. Migration & Deployment
- Initial schema creation scripts
- Migration strategy for schema changes
- Data seeding and initialization

Provide SQL schemas, indexing strategies, and migration approaches.`;

    const chain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(dbPrompt),
    });

    const response = await chain.call({
      system_design: systemDesign,
    });

    return response.text;
  }
}
