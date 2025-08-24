import { Agent, StreamChunk } from "./base-agent";
import { Stage, Artifact } from "@prisma/client";
import { db } from "@/lib/db";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { PROJECT_PLANNING_PROMPT } from '../prompts';

export class PlanningAgent implements Agent {
  private llm: ChatGoogleGenerativeAI;
  private planningChain: LLMChain;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      temperature: 0.3, // Slightly higher temperature for more creative planning
      apiKey: process.env.GOOGLE_API_KEY!,
      maxOutputTokens: 4096, // Sufficient for detailed project plans
    });

    this.planningChain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(PROJECT_PLANNING_PROMPT),
    });
  }

  async run(stage: Stage, prompt: string): Promise<Artifact[]> {
    try {
      console.log('🤖 Generating project plan with Gemini...');

      const response = await this.planningChain.call({
        user_prompt: prompt,
      });

      console.log('✅ Project plan generated successfully');

      const artifact = await db.artifact.create({
        data: {
          name: "Project Plan",
          content: response.text,
          type: "documentation",
          stageId: stage.id,
        },
      });

      return [artifact];
    } catch (error) {
      console.error('❌ Error generating project plan:', error);
      
      // Fallback to a basic plan if LLM fails
      const fallbackContent = `
# Project Plan for: ${prompt}

## Error Notice
There was an issue generating the detailed project plan. Please try again or contact support.

## Basic Project Overview
Project: ${prompt}

## Next Steps
- Review the project requirements
- Define technical specifications
- Create development timeline
- Identify resource needs

*This is a fallback plan. A detailed plan should be generated once the issue is resolved.*
`;

      const artifact = await db.artifact.create({
        data: {
          name: "Project Plan (Fallback)",
          content: fallbackContent,
          type: "documentation",
          stageId: stage.id,
        },
      });

      return [artifact];
    }
  }

  async runStream(stage: Stage, prompt: string, onChunk: (chunk: StreamChunk) => void): Promise<Artifact[]> {
    try {
      console.log('🤖 Generating project plan with Gemini...');
      onChunk({ 
        type: 'status', 
        message: 'Starting project plan generation...' 
      });

      // Start streaming file
      onChunk({
        type: 'file_start',
        fileName: 'Project Plan',
        fileType: 'documentation',
        language: 'markdown'
      });

      let fullContent = '';
      
      // Use direct streaming from LLM instead of chain for real-time chunks
      const prompt_template = PromptTemplate.fromTemplate(PROJECT_PLANNING_PROMPT);
      const formatted_prompt = await prompt_template.format({
        user_prompt: prompt,
      });

      const stream = await this.llm.stream(formatted_prompt);
      
      for await (const chunk of stream) {
        const content = typeof chunk.content === 'string' 
          ? chunk.content 
          : Array.isArray(chunk.content)
            ? chunk.content.map(p => typeof p === 'string' ? p : JSON.stringify(p)).join('')
            : JSON.stringify(chunk.content);
            
        if (content) {
          fullContent += content;
          onChunk({
            type: 'file_chunk',
            content: content
          });
        }
      }

      console.log('✅ Project plan generated successfully');
      
      // Save to database
      const artifact = await db.artifact.create({
        data: {
          name: "Project Plan",
          content: fullContent,
          type: "documentation",
          language: "markdown",
          stageId: stage.id,
        },
      });

      // Signal completion
      onChunk({
        type: 'file_complete',
        artifactId: artifact.id,
        message: 'Project plan completed and saved!'
      });

      return [artifact];
    } catch (error) {
      console.error('❌ Error generating project plan:', error);
      
      // Fallback to a basic plan if LLM fails
      const fallbackContent = `
# Project Plan for: ${prompt}

## Error Notice
There was an issue generating the detailed project plan. Please try again or contact support.

## Basic Project Overview
Project: ${prompt}

## Next Steps
- Review the project requirements
- Define technical specifications
- Create development timeline
- Identify resource needs

*This is a fallback plan. A detailed plan should be generated once the issue is resolved.*
`;

      const artifact = await db.artifact.create({
        data: {
          name: "Project Plan (Fallback)",
          content: fallbackContent,
          type: "documentation",
          language: "markdown",
          stageId: stage.id,
        },
      });

      onChunk({
        type: 'file_complete',
        artifactId: artifact.id,
        message: 'Project plan created with fallback content'
      });

      return [artifact];
    }
  }
}
