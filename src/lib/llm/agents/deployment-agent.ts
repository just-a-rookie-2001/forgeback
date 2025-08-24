import { Agent } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";
import { ContextRetriever } from "../context-retriever";
import { DeploymentWorkflowManager } from "../deployment-workflow";
import { GeneratedFile } from "../types";

interface DeploymentWorkflowResult {
  artifacts: GeneratedFile[];
  summary: string;
}

export class DeploymentAgent implements Agent {
  private contextRetriever: ContextRetriever;
  private deploymentWorkflow: DeploymentWorkflowManager;

  constructor() {
    this.contextRetriever = new ContextRetriever();
    this.deploymentWorkflow = new DeploymentWorkflowManager();
  }

  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    try {
      console.log(`🚀 Deployment Agent: Starting Terraform deployment generation for stage ${stage.id}`);

      // Retrieve context from previous stages with comprehensive fallbacks
      const developmentContext = await this.retrieveDevelopmentContext(stage.projectId);
      const testingContext = await this.retrieveTestingContext(stage.projectId);
      const designContext = await this.retrieveDesignContext(stage.projectId);
      const planningContext = await this.retrievePlanningContext(stage.projectId);

      // Generate comprehensive deployment artifacts using the deployment workflow
      const workflowResult = await this.deploymentWorkflow.executeWorkflow(
        prompt,
        developmentContext,
        testingContext,
        designContext,
        planningContext
      );

      const createdArtifacts: Artifact[] = [];

      // Create artifacts for generated deployment files
      if (workflowResult.artifacts && workflowResult.artifacts.length > 0) {
        console.log(`📄 Creating ${workflowResult.artifacts.length} deployment artifacts...`);
        
        for (const file of workflowResult.artifacts) {
          try {
            const artifact = await db.artifact.create({
              data: {
                name: file.filename,
                content: file.content,
                type: 'config',
                stageId: stage.id,
              },
            });
            createdArtifacts.push(artifact);
            console.log(`✅ Created deployment artifact: ${file.filename}`);
          } catch (error) {
            console.error(`❌ Failed to create deployment artifact ${file.filename}:`, error);
          }
        }
      }

      // Create a comprehensive deployment summary artifact
      const summaryContent = this.createDeploymentSummary(workflowResult, developmentContext, testingContext);
      const summaryArtifact = await db.artifact.create({
        data: {
          name: "Deployment Summary and Architecture",
          content: summaryContent,
          type: "documentation",
          stageId: stage.id,
        },
      });
      createdArtifacts.push(summaryArtifact);

      // Create deployment execution guide
      const executionGuide = await this.createDeploymentExecutionGuide(workflowResult.artifacts);
      const guideArtifact = await db.artifact.create({
        data: {
          name: "Deployment Execution Guide",
          content: executionGuide,
          type: "documentation", 
          stageId: stage.id,
        },
      });
      createdArtifacts.push(guideArtifact);

      console.log(`✅ Deployment Agent: Created ${createdArtifacts.length} deployment artifacts`);
      return createdArtifacts;

    } catch (error) {
      console.error('❌ Deployment Agent failed:', error);

      // Create fallback deployment plan artifact
      const fallbackContent = this.createFallbackDeploymentPlan(prompt);
      const fallbackArtifact = await db.artifact.create({
        data: {
          name: "Basic Deployment Plan (Fallback)",
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
        'DEPLOYMENT',
        "development code, implementation details, application architecture"
      );
      
      if (context && context.length > 0) {
        console.log("✅ Retrieved comprehensive development context for deployment");
        return this.contextRetriever.formatContextForPrompt(context);
      }

      // Fallback: Get all development artifacts
      const developmentStage = await db.stage.findFirst({
        where: { projectId, type: 'DEVELOPMENT' },
        include: { artifacts: true }
      });

      if (developmentStage && developmentStage.artifacts.length > 0) {
        const artifactContents = developmentStage.artifacts
          .map(artifact => `File: ${artifact.name}\n${artifact.content}`)
          .join('\n\n');
        console.log("📋 Using fallback development context from artifacts");
        return artifactContents;
      }

      console.warn("⚠️ No development context found, using empty context");
      return "";
    } catch (error) {
      console.error("❌ Error retrieving development context:", error);
      return "";
    }
  }

  private async retrieveTestingContext(projectId: string): Promise<string> {
    try {
      const context = await this.contextRetriever.retrieveRelevantContext(
        projectId, 
        'DEPLOYMENT',
        "testing strategies, test cases, quality assurance"
      );
      
      if (context && context.length > 0) {
        console.log("✅ Retrieved comprehensive testing context for deployment");
        return this.contextRetriever.formatContextForPrompt(context);
      }

      // Fallback: Get all testing artifacts
      const testingStage = await db.stage.findFirst({
        where: { projectId, type: 'TESTING' },
        include: { artifacts: true }
      });

      if (testingStage && testingStage.artifacts.length > 0) {
        const artifactContents = testingStage.artifacts
          .map(artifact => `File: ${artifact.name}\n${artifact.content}`)
          .join('\n\n');
        console.log("📋 Using fallback testing context from artifacts");
        return artifactContents;
      }

      console.warn("⚠️ No testing context found, using empty context");
      return "";
    } catch (error) {
      console.error("❌ Error retrieving testing context:", error);
      return "";
    }
  }

  private async retrieveDesignContext(projectId: string): Promise<string> {
    try {
      const context = await this.contextRetriever.retrieveRelevantContext(
        projectId, 
        'DEPLOYMENT',
        "system design, architecture, infrastructure requirements"
      );
      
      if (context && context.length > 0) {
        console.log("✅ Retrieved design context for deployment");
        return this.contextRetriever.formatContextForPrompt(context);
      }

      // Fallback: Get design artifacts
      const designStage = await db.stage.findFirst({
        where: { projectId, type: 'DESIGN' },
        include: { artifacts: true }
      });

      if (designStage && designStage.artifacts.length > 0) {
        const artifactContents = designStage.artifacts
          .map(artifact => `${artifact.name}:\n${artifact.content}`)
          .join('\n\n');
        console.log("📋 Using fallback design context from artifacts");
        return artifactContents;
      }

      return "";
    } catch (error) {
      console.error("❌ Error retrieving design context:", error);
      return "";
    }
  }

  private async retrievePlanningContext(projectId: string): Promise<string> {
    try {
      const context = await this.contextRetriever.retrieveRelevantContext(
        projectId, 
        'DEPLOYMENT',
        "project requirements, planning, specifications"
      );
      
      if (context && context.length > 0) {
        console.log("✅ Retrieved planning context for deployment");
        return this.contextRetriever.formatContextForPrompt(context);
      }

      // Fallback: Get planning artifacts
      const planningStage = await db.stage.findFirst({
        where: { projectId, type: 'PLANNING' },
        include: { artifacts: true }
      });

      if (planningStage && planningStage.artifacts.length > 0) {
        const artifactContents = planningStage.artifacts
          .map(artifact => `${artifact.name}:\n${artifact.content}`)
          .join('\n\n');
        console.log("📋 Using fallback planning context from artifacts");
        return artifactContents;
      }

      return "";
    } catch (error) {
      console.error("❌ Error retrieving planning context:", error);
      return "";
    }
  }

  private createDeploymentSummary(
    workflowResult: DeploymentWorkflowResult, 
    developmentContext: string,
    testingContext: string
  ): string {
    const timestamp = new Date().toISOString();
    const artifactCount = workflowResult.artifacts.length;

    return `# 🚀 Deployment Summary and Architecture

## Generated: ${timestamp}
## Total Artifacts: ${artifactCount}

${workflowResult.summary}

## 📊 Context Analysis

### Development Context
${developmentContext ? 
  `✅ **Development context available** (${developmentContext.length} chars)
- Analyzed codebase structure and dependencies
- Identified infrastructure requirements
- Generated appropriate Terraform configurations` :
  `⚠️ **No development context** - Generated basic infrastructure templates`
}

### Testing Context
${testingContext ? 
  `✅ **Testing context available** (${testingContext.length} chars)
- Incorporated testing infrastructure requirements
- Added monitoring and health check configurations
- Included deployment validation steps` :
  `⚠️ **No testing context** - Using standard deployment practices`
}

## 🗂️ Generated Artifacts

${workflowResult.artifacts.map((artifact, index) => 
  `${index + 1}. **${artifact.filename}** (${artifact.language})
   - Type: ${artifact.type}
   - Size: ${artifact.content.length} chars`
).join('\n')}

## 🔧 Infrastructure Overview

The deployment includes:
- **Terraform Infrastructure**: Complete IaC for cloud resources
- **CI/CD Pipelines**: Automated build, test, and deployment workflows
- **Container Configurations**: Docker and Kubernetes manifests
- **Monitoring Setup**: Comprehensive observability stack
- **Security Configurations**: Enterprise-grade security measures
- **Environment Configs**: Multi-environment deployment support

## 📋 Next Steps

1. **Review Configuration**: Verify all Terraform files and variables
2. **Set up CI/CD**: Configure deployment pipelines and secrets
3. **Deploy Infrastructure**: Apply Terraform configurations
4. **Configure Monitoring**: Set up dashboards and alerts
5. **Test Deployment**: Validate application functionality
6. **Monitor and Optimize**: Ongoing performance tuning

---
*Generated by ForgeBack Deployment Agent with context-aware Terraform generation*
`;
  }

  private async createDeploymentExecutionGuide(artifacts: GeneratedFile[]): Promise<string> {
    const terraformFiles = artifacts.filter(a => a.language === 'hcl');
    const cicdFiles = artifacts.filter(a => a.language === 'yaml' && a.filename.includes('workflow'));
    const containerFiles = artifacts.filter(a => a.language === 'dockerfile' || a.filename.toLowerCase().includes('docker'));

    return `# 🚀 Deployment Execution Guide

## Prerequisites

### Required Tools
- **Terraform** (v1.0+): Infrastructure as Code
- **Docker** (v20+): Container runtime
- **kubectl** (v1.20+): Kubernetes CLI
- **AWS CLI** (v2+): Cloud provider access
- **Git**: Version control

### Environment Setup
\`\`\`bash
# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Configure AWS credentials
aws configure
\`\`\`

## 📋 Deployment Steps

### 1. Infrastructure Deployment

${terraformFiles.length > 0 ? `
**Terraform Files Generated:**
${terraformFiles.map(f => `- ${f.filename}`).join('\n')}

**Execute Deployment:**
\`\`\`bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=deployment.tfplan

# Apply infrastructure
terraform apply deployment.tfplan
\`\`\`
` : '⚠️ No Terraform files generated'}

### 2. CI/CD Pipeline Setup

${cicdFiles.length > 0 ? `
**Pipeline Files Generated:**
${cicdFiles.map(f => `- ${f.filename}`).join('\n')}

**Configure CI/CD:**
1. Push pipeline files to repository
2. Configure secrets in GitHub/GitLab
3. Enable workflow permissions
4. Test pipeline execution
` : '⚠️ No CI/CD files generated'}

### 3. Container Deployment

${containerFiles.length > 0 ? `
**Container Files Generated:**
${containerFiles.map(f => `- ${f.filename}`).join('\n')}

**Build and Deploy:**
\`\`\`bash
# Build container image
docker build -t your-app:latest .

# Push to registry
docker push your-registry/your-app:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
\`\`\`
` : '⚠️ No container files generated'}

## 🔧 Configuration

### Environment Variables
Set the following environment variables:
\`\`\`bash
export TF_VAR_environment=production
export TF_VAR_region=us-west-2
export AWS_DEFAULT_REGION=us-west-2
\`\`\`

### Secrets Management
Configure the following secrets:
- Database connection strings
- API keys and tokens
- SSL certificates
- Container registry credentials

## 📊 Monitoring and Validation

### Health Checks
1. **Infrastructure**: Verify all resources are deployed
2. **Application**: Test application endpoints
3. **Database**: Validate database connectivity
4. **Monitoring**: Confirm metrics collection

### Verification Commands
\`\`\`bash
# Check Terraform state
terraform show

# Validate Kubernetes deployment
kubectl get pods,services,ingress

# Test application health
curl -f https://your-app.com/health
\`\`\`

## 🚨 Troubleshooting

### Common Issues
1. **Permission Errors**: Verify IAM roles and policies
2. **Resource Conflicts**: Check for naming collisions
3. **Network Issues**: Validate VPC and security groups
4. **Certificate Issues**: Verify SSL certificate configuration

### Rollback Procedure
\`\`\`bash
# Terraform rollback
terraform plan -destroy
terraform destroy

# Kubernetes rollback
kubectl rollout undo deployment/your-app
\`\`\`

## 📞 Support

For deployment issues:
1. Check the deployment logs
2. Review Terraform state
3. Validate configuration files
4. Consult team documentation

---
*Generated deployment guide with ${artifacts.length} artifacts*
`;
  }

  private createFallbackDeploymentPlan(prompt: string): string {
    return `# 🚀 Basic Deployment Plan (Fallback)

## Project Requirements
${prompt}

## Infrastructure Overview

### Core Components
- **Compute**: EC2 instances or container services
- **Database**: RDS or managed database service
- **Storage**: S3 buckets for static assets
- **Networking**: VPC, subnets, security groups
- **Load Balancer**: Application Load Balancer
- **DNS**: Route 53 configuration

### Basic Terraform Structure

\`\`\`hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "main-vpc"
  }
}

# Application infrastructure
# (Additional resources would be defined based on requirements)
\`\`\`

### Deployment Steps
1. Set up AWS credentials
2. Initialize Terraform
3. Review and apply configuration
4. Configure monitoring and alerting
5. Test application deployment

### Next Steps
- Generate detailed Terraform configurations
- Set up CI/CD pipelines
- Configure monitoring and logging
- Implement security best practices

---
*This is a fallback deployment plan. For comprehensive infrastructure generation, ensure development context is available.*
`;
  }
}
