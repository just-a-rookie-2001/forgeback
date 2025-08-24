import { Agent } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";
import { ContextRetriever, ContextDocument } from "../context-retriever";
import { DevelopmentWorkflowManager } from "../development-workflow";

export class DevelopmentAgent implements Agent {
  private contextRetriever: ContextRetriever;
  private workflowManager: DevelopmentWorkflowManager;

  constructor() {
    this.contextRetriever = new ContextRetriever();
    this.workflowManager = new DevelopmentWorkflowManager();
  }

  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    console.log("💻 Starting enhanced development agent workflow...");

    try {
      // Get project ID from stage
      const stageWithProject = await db.stage.findUnique({
        where: { id: stage.id },
        include: { project: true },
      });

      if (!stageWithProject) {
        throw new Error("Stage not found");
      }

      console.log("📋 Gathering context from previous stages...");

      // Retrieve context from design stage
      const designDocs = await this.contextRetriever.retrieveRelevantContext(
        stageWithProject.projectId,
        "DEVELOPMENT",
        prompt,
        5 // Get more context for development
      );

      // Separate design and planning context for better organization
      const designContext = this.formatContextByStage(designDocs, "DESIGN");
      const planningContext = this.formatContextByStage(designDocs, "PLANNING");

      if (designDocs.length > 0) {
        console.log(
          `📚 Found ${designDocs.length} relevant context documents from previous stages`
        );
        console.log(
          `🎨 Design documents: ${
            designDocs.filter((d) => d.stageType === "DESIGN").length
          }`
        );
        console.log(
          `📋 Planning documents: ${
            designDocs.filter((d) => d.stageType === "PLANNING").length
          }`
        );
      } else {
        console.log(
          "📭 No previous context found, proceeding with prompt only"
        );
      }

      // Execute the development workflow
      const workflowResult = await this.workflowManager.executeWorkflow(
        prompt,
        designContext,
        planningContext
      );

      if (!workflowResult.success) {
        console.error(
          "❌ Development workflow execution failed:",
          workflowResult.error
        );
        return this.createFallbackArtifacts(stage, prompt);
      }

      // Create database artifacts from all generated files
      const artifacts: Artifact[] = [];

      console.log("📄 Creating development artifacts...");

      // Backend files
      for (const file of workflowResult.backendFiles) {
        const artifact = await db.artifact.create({
          data: {
            name: file.filename,
            content: file.content,
            type: "code",
            stageId: stage.id,
          },
        });
        artifacts.push(artifact);
      }

      // Test files
      for (const file of workflowResult.testFiles) {
        const artifact = await db.artifact.create({
          data: {
            name: file.filename,
            content: file.content,
            type: "code",
            stageId: stage.id,
          },
        });
        artifacts.push(artifact);
      }

      // Configuration files
      for (const file of workflowResult.configFiles) {
        const artifact = await db.artifact.create({
          data: {
            name: file.filename,
            content: file.content,
            type: "code",
            stageId: stage.id,
          },
        });
        artifacts.push(artifact);
      }

      console.log(
        `✅ Development agent completed successfully with ${artifacts.length} code artifacts`
      );

      return artifacts;
    } catch (error) {
      console.error("❌ Error in development agent workflow:", error);
      return this.createFallbackArtifacts(stage, prompt);
    }
  }

  private formatContextByStage(
    docs: ContextDocument[],
    stageType: string
  ): string {
    const filteredDocs = docs.filter((doc) => doc.stageType === stageType);

    if (filteredDocs.length === 0) {
      return `No ${stageType.toLowerCase()} context available.`;
    }

    return filteredDocs
      .map(
        (doc) => `
**${doc.name}** (${stageType.toLowerCase()} stage)
Type: ${doc.type}
Content:
${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? "..." : ""}
---`
      )
      .join("\n");
  }

  private async createFallbackArtifacts(
    stage: Stage,
    prompt: string
  ): Promise<Artifact[]> {
    console.log(
      "🛡️  Creating fallback development artifacts due to workflow failure..."
    );

    const artifacts: Artifact[] = [];

    try {
      // Create a basic server file
      const serverArtifact = await db.artifact.create({
        data: {
          name: "server.ts",
          content: this.createFallbackServerCode(prompt),
          type: "code",
          stageId: stage.id,
        },
      });
      artifacts.push(serverArtifact);

      // Create a basic model file
      const modelArtifact = await db.artifact.create({
        data: {
          name: "models/User.ts",
          content: this.createFallbackModelCode(),
          type: "code",
          stageId: stage.id,
        },
      });
      artifacts.push(modelArtifact);

      // Create a basic route file
      const routeArtifact = await db.artifact.create({
        data: {
          name: "routes/api.ts",
          content: this.createFallbackRouteCode(),
          type: "code",
          stageId: stage.id,
        },
      });
      artifacts.push(routeArtifact);
    } catch (dbError) {
      console.error("❌ Error creating fallback artifacts:", dbError);

      // Create at least one basic artifact
      const basicArtifact = await db.artifact.create({
        data: {
          name: "README.md",
          content: `# Development Setup\n\nBasic development setup for: ${prompt}\n\nDue to technical difficulties, comprehensive code generation could not be completed. Please try again or contact support.`,
          type: "documentation",
          stageId: stage.id,
        },
      });
      artifacts.push(basicArtifact);
    }

    return artifacts;
  }

  private createFallbackServerCode(prompt: string): string {
    return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Basic API route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is working',
    project: '${prompt}',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});

export default app;`;
  }

  private createFallbackModelCode(): string {
    return `export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  name?: string;
}

export class UserModel {
  private users: User[] = [];
  private nextId = 1;

  create(input: CreateUserInput): User {
    const user: User = {
      id: this.nextId.toString(),
      email: input.email,
      name: input.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.push(user);
    this.nextId++;
    return user;
  }

  findById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  update(id: string, input: UpdateUserInput): User | undefined {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...input,
      updatedAt: new Date(),
    };

    return this.users[userIndex];
  }

  delete(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }

  findAll(): User[] {
    return this.users;
  }
}

export const userModel = new UserModel();`;
  }

  private createFallbackRouteCode(): string {
    return `import { Router, Request, Response } from 'express';
import { userModel, CreateUserInput, UpdateUserInput } from '../models/User';

const router = Router();

// Get all users
router.get('/users', (req: Request, res: Response) => {
  try {
    const users = userModel.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = userModel.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/users', (req: Request, res: Response) => {
  try {
    const input: CreateUserInput = req.body;
    
    if (!input.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = userModel.findByEmail(input.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    const user = userModel.create(input);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input: UpdateUserInput = req.body;
    
    const user = userModel.update(id, input);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = userModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;`;
  }
}
