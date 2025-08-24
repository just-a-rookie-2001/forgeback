import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WorkflowManager } from '@/lib/llm/workflow-manager'
import { StageType } from '@prisma/client'

export const runtime = 'nodejs'

interface SSEData {
  type: string;
  content?: string;
  message?: string | Record<string, unknown>;
  fileName?: string;
  fileType?: string;
  language?: string;
  artifactId?: string;
  codeGenerated?: boolean;
  filesCount?: number;
  error?: string;
  details?: string;
}

// Server-Sent Events streaming endpoint
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const project = await db.project.findFirst({ 
    where: { id, userId: session.user.id },
    include: { 
      stages: {
        include: {
          artifacts: true
        }
      }
    }
  })
  
  if (!project) {
    return new Response('Project not found', { status: 404 })
  }

  if (!process.env.GOOGLE_API_KEY) {
    return new Response('GOOGLE_API_KEY not configured', { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const message: string = body.message
  const stageType: StageType = body.stageType || StageType.PLANNING
  
  if (!message || message.trim().length < 2) {
    return new Response('Message too short', { status: 400 })
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Helper function to send SSE data
      const sendEvent = (data: SSEData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Create user message first
        const userMsg = await db.chatMessage.create({
          data: { 
            projectId: id, 
            role: 'user', 
            content: message.trim(),
            stageType
          }
        })

        // Send initial user message
        sendEvent({
          type: 'user_message',
          message: userMsg
        })

        // Start workflow streaming
        const workflowManager = new WorkflowManager()
        let assistantContent = ''
        let codeGenerated = false
        let filesCount = 0

        // Check if this looks like a code generation request
        const looksLikeCodeRequest = /\b(generate|create|add|implement|build|write|code|function|endpoint|api|route|model|fix|update)\b/i.test(message)
        
        if (looksLikeCodeRequest) {
          sendEvent({
            type: 'status',
            content: `Starting ${stageType.toLowerCase()} stage...`
          })

          try {
            // Use streaming execution with real-time callbacks
            await workflowManager.executeStageStream(project.id, stageType, (chunk) => {
              sendEvent({
                type: chunk.type,
                content: chunk.content,
                fileName: chunk.fileName,
                fileType: chunk.fileType,
                language: chunk.language,
                artifactId: chunk.artifactId,
                message: chunk.message
              })

              if (chunk.type === 'file_complete') {
                codeGenerated = true
                filesCount = 1
              }
            })

            if (codeGenerated) {
              assistantContent = `✅ Generated ${filesCount} artifacts for the ${stageType.toLowerCase()} stage with real-time streaming!`
            } else {
              assistantContent = `I understand your request for the ${stageType.toLowerCase()} stage, but no artifacts were generated.`
            }
          } catch (error) {
            console.error('Stage execution error:', error)
            assistantContent = `I encountered an issue generating artifacts for the ${stageType.toLowerCase()} stage: ${error instanceof Error ? error.message : 'Unknown error'}`
            
            sendEvent({
              type: 'error',
              error: 'Stage execution failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        } else {
          assistantContent = `I understand your request for the ${stageType.toLowerCase()} stage. How can I help you with this phase?`
        }

        // Save assistant response to database
        const assistantMsg = await db.chatMessage.create({
          data: { 
            projectId: id, 
            role: 'assistant', 
            content: assistantContent.trim(),
            stageType
          }
        })

        // Send final completion message
        sendEvent({
          type: 'complete',
          message: assistantMsg,
          codeGenerated,
          filesCount
        })

      } catch (error) {
        console.error('Stream error:', error)
        sendEvent({
          type: 'error',
          error: 'Failed to process message',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
    },
  })
}
