import { StageType } from "@prisma/client";
import { db } from "@/lib/db";
import { Agent, StreamChunk } from "./agents/base-agent";
import { PlanningAgent } from "./agents/planning-agent";
import { DesignAgent } from "./agents/design-agent";
import { DevelopmentAgent } from "./agents/development-agent";
import { TestingAgent } from "./agents/testing-agent";
import { DeploymentAgent } from "./agents/deployment-agent";

export class WorkflowManager {
  private agents: Map<StageType, Agent>;

  constructor() {
    this.agents = new Map();
    this.agents.set(StageType.PLANNING, new PlanningAgent());
    this.agents.set(StageType.DESIGN, new DesignAgent());
    this.agents.set(StageType.DEVELOPMENT, new DevelopmentAgent());
    this.agents.set(StageType.TESTING, new TestingAgent());
    this.agents.set(StageType.DEPLOYMENT, new DeploymentAgent());
  }

  async startWorkflow(projectId: string, prompt: string): Promise<void> {
    const stages = [
      { name: "Planning", type: StageType.PLANNING },
      { name: "Design", type: StageType.DESIGN },
      { name: "Development", type: StageType.DEVELOPMENT },
      { name: "Testing", type: StageType.TESTING },
      { name: "Deployment", type: StageType.DEPLOYMENT },
    ];

    for (const stageInfo of stages) {
      const stage = await db.stage.create({
        data: {
          name: stageInfo.name,
          type: stageInfo.type,
          status: "IN_PROGRESS",
          projectId: projectId,
        },
      });

      const agent = this.agents.get(stageInfo.type);
      if (agent) {
        await agent.run(stage, prompt);
        await db.stage.update({
          where: { id: stage.id },
          data: { status: "COMPLETED" },
        });
      } else {
        await db.stage.update({
          where: { id: stage.id },
          data: { status: "ERROR" },
        });
        throw new Error(`No agent found for stage type: ${stageInfo.type}`);
      }
    }

    await db.project.update({
      where: { id: projectId },
      data: { status: "completed" },
    });
  }

  async executeStage(projectId: string, stageType: StageType) {
    // Find the project with its current state
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: { include: { artifacts: true } } }
    });
    
    if (!project) {
      throw new Error("Project not found");
    }

    // Find or create the stage
    let stage = project.stages.find(s => s.type === stageType);
    if (!stage) {
      stage = await db.stage.create({
        data: {
          name: stageType.charAt(0).toUpperCase() + stageType.slice(1).toLowerCase(),
          type: stageType,
          status: "IN_PROGRESS",
          projectId: projectId,
        },
        include: { artifacts: true }
      });
    }

    // Get the agent for this stage
    const agent = this.agents.get(stageType);
    if (!agent) {
      throw new Error(`No agent found for stage type: ${stageType}`);
    }

    // Execute the agent
    await agent.run(stage, project.prompt);
    
    // Update stage status
    await db.stage.update({
      where: { id: stage.id },
      data: { status: "COMPLETED" },
    });

    // Return the updated stage with artifacts
    return await db.stage.findUnique({
      where: { id: stage.id },
      include: { artifacts: true }
    });
  }

  async executeStageStream(projectId: string, stageType: StageType, onChunk: (chunk: StreamChunk) => void) {
    // Find the project with its current state
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: { include: { artifacts: true } } }
    });
    
    if (!project) {
      throw new Error("Project not found");
    }

    // Find or create the stage
    let stage = project.stages.find(s => s.type === stageType);
    if (!stage) {
      stage = await db.stage.create({
        data: {
          name: stageType.charAt(0).toUpperCase() + stageType.slice(1).toLowerCase(),
          type: stageType,
          status: "IN_PROGRESS",
          projectId: projectId,
        },
        include: { artifacts: true }
      });
    }

    // Get the agent for this stage
    const agent = this.agents.get(stageType);
    if (!agent) {
      throw new Error(`No agent found for stage type: ${stageType}`);
    }

    // Execute the agent with streaming if supported
    if (agent.runStream) {
      await agent.runStream(stage, project.prompt, onChunk);
    } else {
      // Fallback to non-streaming
      onChunk({ 
        type: 'status', 
        message: `Executing ${stageType.toLowerCase()} stage...` 
      });
      await agent.run(stage, project.prompt);
      onChunk({ 
        type: 'status', 
        message: `${stageType.toLowerCase()} stage completed` 
      });
    }
    
    // Update stage status
    await db.stage.update({
      where: { id: stage.id },
      data: { status: "COMPLETED" },
    });

    // Return the updated stage with artifacts
    return await db.stage.findUnique({
      where: { id: stage.id },
      include: { artifacts: true }
    });
  }
}
