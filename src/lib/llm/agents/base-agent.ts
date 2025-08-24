import { Stage, Artifact } from "@prisma/client";

export interface Agent {
  run(stage: Stage, prompt: string): Promise<Artifact[]>;
  runStream?(stage: Stage, prompt: string, onChunk: (chunk: StreamChunk) => void): Promise<Artifact[]>;
}

export interface StreamChunk {
  type: 'file_start' | 'file_chunk' | 'file_complete' | 'status';
  fileName?: string;
  fileType?: string;
  language?: string;
  content?: string;
  message?: string;
  artifactId?: string;
}
