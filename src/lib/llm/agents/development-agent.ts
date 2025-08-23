import { Agent } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";
import { BackendAgent } from "../agent"; 

export class DevelopmentAgent implements Agent {
  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    const agent = new BackendAgent();
    const response = await agent.processMessage(prompt, prompt, "");

    const artifacts: Artifact[] = [];
    if (response.files) {
      for (const file of response.files) {
        const artifact = await db.artifact.create({
          data: {
            name: file.filename,
            content: file.content,
            type: "code",
            stageId: stage.id,
          },
        });
        artifacts.push(artifact);

        // Also update the File model for now to maintain existing functionality
        await db.file.create({
          data: {
            name: file.filename,
            content: file.content,
            projectId: stage.projectId,
          },
        });
      }
    }

    return artifacts;
  }
}
