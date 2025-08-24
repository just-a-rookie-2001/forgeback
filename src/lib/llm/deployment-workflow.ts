import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeneratedFile } from "./types";

export class DeploymentWorkflowManager {
  private llm: ChatGoogleGenerativeAI;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0.3,
    });
  }

  async executeWorkflow(
    userPrompt: string,
    developmentContext: string,
    testingContext: string,
    _designContext: string,
    _planningContext: string
  ): Promise<{ artifacts: GeneratedFile[]; summary: string }> {
    console.log("🚀 Starting comprehensive Terraform deployment workflow...");

    try {
      // Generate different types of deployment artifacts
      const [
        infrastructureFiles,
        cicdFiles,
        containerFiles,
        monitoringFiles,
        securityFiles,
        configurationFiles
      ] = await Promise.all([
        this.generateTerraformInfrastructure(userPrompt, developmentContext),
        this.generateCICDPipelines(userPrompt, developmentContext, testingContext),
        this.generateContainerConfigs(userPrompt, developmentContext),
        this.generateMonitoringConfigs(userPrompt, developmentContext),
        this.generateSecurityConfigs(userPrompt, developmentContext),
        this.generateDeploymentConfiguration(userPrompt, developmentContext)
      ]);

      const allArtifacts = [
        ...infrastructureFiles,
        ...cicdFiles,
        ...containerFiles,
        ...monitoringFiles,
        ...securityFiles,
        ...configurationFiles
      ];

      const summary = await this.generateDeploymentSummary(
        userPrompt,
        developmentContext,
        allArtifacts.length
      );

      console.log(`✅ Generated ${allArtifacts.length} deployment artifacts`);

      return {
        artifacts: allArtifacts,
        summary: summary
      };

    } catch (error) {
      console.error("❌ Error in deployment workflow:", error);
      return {
        artifacts: [],
        summary: `Deployment workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generateTerraformInfrastructure(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("🏗️ Generating Terraform infrastructure...");

    try {
      const prompt = `You are an expert DevOps engineer and Terraform specialist. Generate comprehensive Terraform infrastructure code for the following project.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate complete Terraform infrastructure that includes:

1. **Main Infrastructure** - Core Terraform configuration with providers and resources
2. **Networking** - VPC, subnets, security groups, load balancers
3. **Compute Resources** - EC2 instances, auto-scaling groups, or container services
4. **Database Infrastructure** - RDS, DynamoDB, or other database services
5. **Storage** - S3 buckets, EFS, or other storage solutions
6. **Security** - IAM roles, policies, security groups, SSL certificates
7. **Monitoring** - CloudWatch, logging, alerting infrastructure
8. **Variables and Outputs** - Parameterized configuration

**Output Format:**
For each Terraform file, use this exact format:

===FILE_START===
FILENAME: terraform/main.tf
LANGUAGE: hcl
TYPE: infrastructure
CONTENT:
[Complete Terraform configuration file content]
===FILE_END===

Generate production-ready Terraform with proper resource naming, tags, and best practices.
Include modules, variables, outputs, and comprehensive documentation.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating Terraform infrastructure:", error);
      return [];
    }
  }

  private async generateCICDPipelines(
    userPrompt: string,
    developmentContext: string,
    testingContext: string
  ): Promise<GeneratedFile[]> {
    console.log("🔄 Generating CI/CD pipelines...");

    try {
      const prompt = `You are an expert CI/CD engineer. Generate comprehensive CI/CD pipeline configurations for the following project.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Testing Context:**
${testingContext}

**Your Task:**
Generate CI/CD pipeline configurations that include:

1. **GitHub Actions** - Complete workflow files for build, test, and deploy
2. **Terraform Deployment** - Automated Terraform plan and apply workflows
3. **Container Build** - Docker build and push to registry
4. **Environment Promotion** - Dev -> Staging -> Production pipelines
5. **Security Scanning** - Code security and vulnerability scans
6. **Rollback Strategy** - Automated rollback on failure
7. **Monitoring Integration** - Deploy monitoring and alerting

**Output Format:**
For each pipeline file, use this exact format:

===FILE_START===
FILENAME: .github/workflows/deploy.yml
LANGUAGE: yaml
TYPE: cicd
CONTENT:
[Complete CI/CD pipeline configuration]
===FILE_END===

Include proper secrets management, environment variables, and deployment strategies.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating CI/CD pipelines:", error);
      return [];
    }
  }

  private async generateContainerConfigs(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("📦 Generating container configurations...");

    try {
      const prompt = `You are an expert container and orchestration specialist. Generate comprehensive container configurations for the following project.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate container configurations that include:

1. **Dockerfile** - Multi-stage Docker builds for production
2. **Docker Compose** - Local development and testing setup
3. **Kubernetes Manifests** - Deployments, services, ingress, config maps
4. **Helm Charts** - Parameterized Kubernetes deployments
5. **Container Security** - Security scanning and best practices
6. **Health Checks** - Liveness and readiness probes
7. **Resource Management** - CPU/memory limits and requests

**Output Format:**
For each container file, use this exact format:

===FILE_START===
FILENAME: Dockerfile
LANGUAGE: dockerfile
TYPE: container
CONTENT:
[Complete container configuration]
===FILE_END===

Include production-ready configurations with proper security, optimization, and monitoring.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating container configs:", error);
      return [];
    }
  }

  private async generateMonitoringConfigs(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("📊 Generating monitoring configurations...");

    try {
      const prompt = `You are an expert monitoring and observability engineer. Generate comprehensive monitoring configurations for the following project.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate monitoring configurations that include:

1. **Terraform Monitoring** - CloudWatch, Datadog, or Prometheus resources
2. **Application Metrics** - Custom metrics and dashboards
3. **Infrastructure Monitoring** - Server, database, and network monitoring
4. **Log Management** - Centralized logging and log analysis
5. **Alerting Rules** - Critical alerts and escalation policies
6. **Health Checks** - Synthetic monitoring and uptime checks
7. **Performance Monitoring** - APM and performance tracking

**Output Format:**
For each monitoring file, use this exact format:

===FILE_START===
FILENAME: terraform/monitoring.tf
LANGUAGE: hcl
TYPE: monitoring
CONTENT:
[Complete monitoring configuration]
===FILE_END===

Include comprehensive monitoring with proper alerting thresholds and dashboards.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating monitoring configs:", error);
      return [];
    }
  }

  private async generateSecurityConfigs(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("🔒 Generating security configurations...");

    try {
      const prompt = `You are an expert security and compliance engineer. Generate comprehensive security configurations for the following project.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate security configurations that include:

1. **Terraform Security** - IAM policies, security groups, encryption
2. **Secrets Management** - AWS Secrets Manager, HashiCorp Vault integration
3. **Network Security** - WAF, DDoS protection, SSL/TLS certificates
4. **Compliance** - SOC2, GDPR, HIPAA compliance configurations
5. **Security Scanning** - Vulnerability scanning and security policies
6. **Backup and Recovery** - Disaster recovery and data backup
7. **Audit Logging** - Security audit trails and compliance logging

**Output Format:**
For each security file, use this exact format:

===FILE_START===
FILENAME: terraform/security.tf
LANGUAGE: hcl
TYPE: security
CONTENT:
[Complete security configuration]
===FILE_END===

Include enterprise-grade security with proper encryption, access controls, and compliance.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating security configs:", error);
      return [];
    }
  }

  private async generateDeploymentConfiguration(
    userPrompt: string,
    developmentContext: string
  ): Promise<GeneratedFile[]> {
    console.log("⚙️ Generating deployment configuration...");

    try {
      const prompt = `You are an expert deployment configuration specialist. Generate comprehensive deployment configuration files for the following project.

**Project Requirements:**
${userPrompt}

**Development Code:**
${developmentContext}

**Your Task:**
Generate deployment configuration files that include:

1. **Terraform Variables** - Environment-specific variable files
2. **Environment Configs** - Dev, staging, production configurations
3. **Deployment Scripts** - Automated deployment and rollback scripts
4. **Database Migrations** - Production-safe migration scripts
5. **Load Balancer Configs** - Traffic routing and load balancing
6. **SSL/TLS Setup** - Certificate management and HTTPS configuration
7. **Scaling Policies** - Auto-scaling and resource optimization

**Output Format:**
For each config file, use this exact format:

===FILE_START===
FILENAME: terraform/variables.tf
LANGUAGE: hcl
TYPE: config
CONTENT:
[Complete deployment configuration]
===FILE_END===

Include production-ready configurations with proper parameterization and documentation.`;

      const result = await this.llm.invoke(prompt);
      const response = result.content as string;

      return this.parseGeneratedCode(response);
    } catch (error) {
      console.error("Error generating deployment configuration:", error);
      return [];
    }
  }

  private async generateDeploymentSummary(
    userPrompt: string,
    developmentContext: string,
    artifactCount: number
  ): Promise<string> {
    try {
      const prompt = `Generate a comprehensive deployment summary for the following project:

**Project Requirements:**
${userPrompt}

**Development Context:**
${developmentContext}

**Generated Artifacts:**
${artifactCount} deployment artifacts created

Create a detailed summary covering:
1. Infrastructure overview and architecture
2. Deployment strategy and rollout plan
3. Security and compliance measures
4. Monitoring and alerting setup
5. Operational procedures and runbooks
6. Cost optimization recommendations
7. Disaster recovery and backup strategy`;

      const result = await this.llm.invoke(prompt);
      return result.content as string;
    } catch (error) {
      console.error("Error generating deployment summary:", error);
      return "Failed to generate deployment summary.";
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
        let language = "hcl";
        let type = "infrastructure";
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

        // Extract content
        if (contentStartIndex > 0 && contentStartIndex < lines.length) {
          content = lines.slice(contentStartIndex).join("\n").trim();
        }

        if (filename && content) {
          files.push({
            filename,
            content,
            language,
            type: type as "api" | "db" | "test" | "config" | "middleware" | "component" | "page" | "service" | "style" | "utility" | "code"
          });
          console.log(`✅ Parsed deployment file: ${filename}`);
        } else {
          console.warn(`⚠️ Skipping invalid file block - filename: ${filename}, content length: ${content.length}`);
        }
      }

      console.log(`📄 Successfully parsed ${files.length} deployment files`);
      return files;

    } catch (error) {
      console.error("❌ Error parsing generated deployment code:", error);
      return [];
    }
  }
}
