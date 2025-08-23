import { Agent } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";

export class DesignAgent implements Agent {
  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    // In a real scenario, you would use an LLM to generate this content
    const content = `
# System Design for: ${prompt}

## 1. Architecture
...

## 2. Data Model
...

## 3. API Endpoints
...
`;

    const artifact = await db.artifact.create({
      data: {
        name: "System Design",
        content: content,
        type: "documentation",
        stageId: stage.id,
      },
    });

    return [artifact];
  }
}
