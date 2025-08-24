import { db } from "@/lib/db";
import { StageType } from "@prisma/client";

export interface ContextDocument {
  id: string;
  content: string;
  type: string;
  name: string;
  stageType: StageType;
  relevanceScore?: number;
}

export class ContextRetriever {
  /**
   * Retrieve context from previous stages for a given project
   */
  async retrievePreviousStageContext(
    projectId: string, 
    currentStage: StageType
  ): Promise<ContextDocument[]> {
    const stageOrder: StageType[] = [
      'PLANNING',
      'DESIGN', 
      'DEVELOPMENT',
      'TESTING',
      'DEPLOYMENT'
    ];

    const currentStageIndex = stageOrder.indexOf(currentStage);
    const previousStages = stageOrder.slice(0, currentStageIndex);

    // Get all artifacts from previous stages
    const stages = await db.stage.findMany({
      where: {
        projectId,
        type: {
          in: previousStages
        }
      },
      include: {
        artifacts: true
      }
    });

    const documents: ContextDocument[] = [];

    for (const stage of stages) {
      for (const artifact of stage.artifacts) {
        documents.push({
          id: artifact.id,
          content: artifact.content,
          type: artifact.type,
          name: artifact.name,
          stageType: stage.type
        });
      }
    }

    return documents;
  }

  /**
   * Simple keyword-based relevance scoring
   */
  scoreRelevance(document: ContextDocument, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = document.content.toLowerCase().split(/\s+/);
    
    let score = 0;
    for (const queryWord of queryWords) {
      if (queryWord.length < 3) continue; // Skip short words
      
      const matches = contentWords.filter(word => 
        word.includes(queryWord) || queryWord.includes(word)
      ).length;
      
      score += matches;
    }
    
    // Boost score for more recent stages
    const stageBoost = {
      'PLANNING': 1.2,
      'DESIGN': 1.0,
      'DEVELOPMENT': 0.8,
      'TESTING': 0.6,
      'DEPLOYMENT': 0.4
    };
    
    return score * (stageBoost[document.stageType] || 1.0);
  }

  /**
   * Retrieve and rank relevant context documents
   */
  async retrieveRelevantContext(
    projectId: string,
    currentStage: StageType,
    query: string,
    maxDocuments: number = 5
  ): Promise<ContextDocument[]> {
    const allDocuments = await this.retrievePreviousStageContext(projectId, currentStage);
    
    // Score and sort documents
    const scoredDocuments = allDocuments
      .map(doc => ({
        ...doc,
        relevanceScore: this.scoreRelevance(doc, query)
      }))
      .filter(doc => doc.relevanceScore > 0)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxDocuments);

    return scoredDocuments;
  }

  /**
   * Format context documents for prompt inclusion
   */
  formatContextForPrompt(documents: ContextDocument[]): string {
    if (documents.length === 0) {
      return "No previous context available.";
    }

    return documents.map(doc => `
**${doc.name}** (${doc.stageType.toLowerCase()} stage)
Type: ${doc.type}
Content:
${doc.content.substring(0, 1500)}${doc.content.length > 1500 ? '...' : ''}
---`).join('\n');
  }
}
