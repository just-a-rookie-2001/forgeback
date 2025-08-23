import { Stage, Artifact } from "@prisma/client";

export interface Agent {
  run(stage: Stage, prompt: string): Promise<Artifact[]>;
}
