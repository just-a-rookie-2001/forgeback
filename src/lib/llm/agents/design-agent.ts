import { Agent } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";
import { ContextRetriever } from '../context-retriever';
import { DesignWorkflowManager } from '../workflows/design-workflow';

export class DesignAgent implements Agent {
  private contextRetriever: ContextRetriever;
  private workflowManager: DesignWorkflowManager;

  constructor() {
    this.contextRetriever = new ContextRetriever();
    this.workflowManager = new DesignWorkflowManager();
  }

  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    console.log('🎨 Starting enhanced design agent workflow...');

    try {
      // Get project ID from stage
      const stageWithProject = await db.stage.findUnique({
        where: { id: stage.id },
        include: { project: true }
      });

      if (!stageWithProject) {
        throw new Error('Stage not found');
      }

      console.log('📋 Gathering context from planning stage...');
      
      // Retrieve relevant context from previous stages
      const contextDocs = await this.contextRetriever.retrieveRelevantContext(
        stageWithProject.projectId,
        'DESIGN',
        prompt,
        3
      );

      const formattedContext = this.contextRetriever.formatContextForPrompt(contextDocs);
      
      if (contextDocs.length > 0) {
        console.log(`📚 Found ${contextDocs.length} relevant context documents from planning stage`);
      } else {
        console.log('📭 No previous context found, proceeding with prompt only');
      }

      // Execute the design workflow using the workflow manager
      const workflowResult = await this.workflowManager.executeWorkflow(prompt, formattedContext);

      if (!workflowResult.success) {
        console.error('❌ Workflow execution failed:', workflowResult.error);
        return this.createFallbackArtifacts(stage, prompt);
      }

      // Create database artifacts
      const artifacts: Artifact[] = [];

      console.log('📄 Creating design artifacts...');

      // System Architecture artifact
      if (workflowResult.systemDesign) {
        const systemArchArtifact = await db.artifact.create({
          data: {
            name: 'System Architecture',
            content: workflowResult.systemDesign,
            type: 'documentation',
            stageId: stage.id,
          },
        });
        artifacts.push(systemArchArtifact);
      }

      // API Specification artifact
      if (workflowResult.apiSpec) {
        const apiSpecArtifact = await db.artifact.create({
          data: {
            name: 'API Specification',
            content: workflowResult.apiSpec,
            type: 'documentation',
            stageId: stage.id,
          },
        });
        artifacts.push(apiSpecArtifact);
      }

      // Database Design artifact
      if (workflowResult.databaseDesign) {
        const databaseArtifact = await db.artifact.create({
          data: {
            name: 'Database Design',
            content: workflowResult.databaseDesign,
            type: 'documentation',
            stageId: stage.id,
          },
        });
        artifacts.push(databaseArtifact);
      }

      console.log(`✅ Design agent completed successfully with ${artifacts.length} comprehensive artifacts`);
      return artifacts;

    } catch (error) {
      console.error('❌ Error in design agent workflow:', error);
      return this.createFallbackArtifacts(stage, prompt);
    }
  }

  private createFallbackSystemDesign(prompt: string): string {
    return `# System Design for: ${prompt}

## 1. System Architecture
- **Architecture Pattern**: Microservices with API Gateway
- **Backend**: Node.js with Express/Fastify
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with refresh tokens

### Backend Services
- **API Gateway**: Central entry point for all client requests
- **Authentication Service**: User management and JWT token handling
- **Business Logic Services**: Core application functionality
- **Data Access Layer**: Database abstraction and ORM integration

### Data Layer
- **Primary Database**: PostgreSQL for relational data
- **Cache Layer**: Redis for session management and performance
- **File Storage**: Cloud storage (AWS S3/Google Cloud) for assets
- **Search Engine**: Elasticsearch for full-text search capabilities

## 3. Data Flow Architecture
1. **Client Request**: Frontend sends requests through API Gateway
2. **Authentication**: Verify user credentials and permissions
3. **Business Logic**: Process requests through appropriate services
4. **Data Operations**: Query/modify data through data access layer
5. **Response**: Return processed data to client

## 4. Scalability Considerations
- **Horizontal Scaling**: Microservices can be scaled independently
- **Load Balancing**: Distribute traffic across service instances
- **Caching Strategy**: Multi-level caching for performance optimization
- **Database Sharding**: Partition data for large-scale operations

## 5. Security Architecture
- **API Security**: OAuth 2.0/JWT authentication with proper scopes
- **Data Encryption**: TLS for data in transit, AES for data at rest
- **Input Validation**: Comprehensive sanitization and validation
- **Rate Limiting**: Protect against abuse and DDoS attacks
- **Audit Logging**: Track all security-relevant operations`;
  }

  private createFallbackApiSpec(): string {
    return `# API Specification

## Overview
RESTful API following OpenAPI 3.0 specification with comprehensive endpoint coverage.

## Authentication
- **Type**: Bearer Token (JWT)
- **Header**: \`Authorization: Bearer <token>\`
- **Token Expiry**: 24 hours with refresh mechanism

## Base URL
\`https://api.example.com/v1\`

## Core Endpoints

### Authentication Endpoints
\`\`\`
POST /auth/login
POST /auth/register  
POST /auth/refresh
POST /auth/logout
\`\`\`

### User Management
\`\`\`
GET /users/profile
PUT /users/profile
DELETE /users/account
GET /users/{id}
\`\`\`

### Resource Management
\`\`\`
GET /resources
POST /resources
GET /resources/{id}
PUT /resources/{id}
DELETE /resources/{id}
\`\`\`

## Request/Response Format
- **Content-Type**: \`application/json\`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (\`YYYY-MM-DDTHH:mm:ssZ\`)

## Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

## Rate Limiting
- **Per User**: 1000 requests/hour
- **Global**: 100,000 requests/hour
- **Headers**: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`

## Error Response Format
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
\`\`\``;
  }

  private createFallbackDatabaseDesign(): string {
    return `# Database Design

## Schema Overview
Relational database design optimized for performance and scalability.

## Core Tables

### Users Table
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
\`\`\`

### Projects Table
\`\`\`sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
\`\`\`

### Resources Table
\`\`\`sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  content JSONB,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_resources_project_id ON resources(project_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_content_gin ON resources USING GIN(content);
\`\`\`

## Relationships
- **Users → Projects**: One-to-Many (users can have multiple projects)
- **Projects → Resources**: One-to-Many (projects can have multiple resources)

## Data Integrity Constraints
- **Foreign Keys**: Enforce referential integrity
- **Unique Constraints**: Prevent duplicate entries
- **Check Constraints**: Validate data ranges and formats
- **NOT NULL**: Ensure required fields are populated

## Performance Optimizations
- **Proper Indexing**: B-tree indexes on frequently queried columns
- **JSONB Indexes**: GIN indexes for JSON document queries
- **Partial Indexes**: For filtered queries on status fields
- **Composite Indexes**: For multi-column query patterns

## Migration Strategy
\`\`\`sql
-- Migration scripts should be versioned and reversible
-- Example migration file: 001_create_initial_tables.sql

BEGIN TRANSACTION;

-- Create tables and indexes
-- (table definitions above)

-- Seed data if needed
INSERT INTO users (email, first_name, last_name, email_verified) 
VALUES ('admin@example.com', 'Admin', 'User', TRUE);

COMMIT;
\`\`\``;
  }

  private async createFallbackArtifacts(stage: Stage, prompt: string): Promise<Artifact[]> {
    console.log('🛡️  Creating fallback artifacts due to LLM failure...');
    
    const artifacts: Artifact[] = [];

    try {
      // System Design fallback
      const systemDesignArtifact = await db.artifact.create({
        data: {
          name: "System Architecture (Fallback)",
          content: this.createFallbackSystemDesign(prompt),
          type: "documentation",
          stageId: stage.id,
        },
      });
      artifacts.push(systemDesignArtifact);

      // API Specification fallback
      const apiArtifact = await db.artifact.create({
        data: {
          name: "API Specification (Fallback)",
          content: this.createFallbackApiSpec(),
          type: "documentation",
          stageId: stage.id,
        },
      });
      artifacts.push(apiArtifact);

      // Database Design fallback
      const dbArtifact = await db.artifact.create({
        data: {
          name: "Database Design (Fallback)",
          content: this.createFallbackDatabaseDesign(),
          type: "documentation",
          stageId: stage.id,
        },
      });
      artifacts.push(dbArtifact);

    } catch (dbError) {
      console.error('❌ Error creating fallback artifacts:', dbError);
      // Return at least one basic artifact
      const basicArtifact = await db.artifact.create({
        data: {
          name: "Basic System Design",
          content: `# System Design\n\nBasic system design for: ${prompt}\n\nDue to technical difficulties, a comprehensive design could not be generated. Please try again or contact support.`,
          type: "documentation",
          stageId: stage.id,
        },
      });
      artifacts.push(basicArtifact);
    }

    return artifacts;
  }
}
