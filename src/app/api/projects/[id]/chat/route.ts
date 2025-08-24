import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BackendAgent } from '@/lib/llm/agent'
import { WorkflowManager } from '@/lib/llm/workflow-manager'
import { StageType } from '@prisma/client'

// GET: fetch chat history for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const stageType = searchParams.get('stage') || "PLANNING"

  const messages = await db.chatMessage.findMany({
    where: { 
      projectId: id,
      stageType: stageType as StageType
    },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json({ messages })
}

// POST: unified chat endpoint for both general and stage-specific chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const message: string = body.message
  const stageType: StageType | null = body.stageType || null
  
  if (!message || message.trim().length < 2) {
    return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  }

  try {
    // Create user message
    const userMsg = await db.chatMessage.create({
      data: { 
        projectId: id, 
        role: 'user', 
        content: message.trim(),
        ...(stageType ? { stageType } : {})
      }
    })

    // Get conversation history (filtered by stage if provided)
    const history = await db.chatMessage.findMany({
      where: { 
        projectId: id,
        ...(stageType ? { stageType } : {})
      },
      orderBy: { createdAt: 'asc' },
      take: 40
    })

    const conversationText = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')

    let assistantContent = ''
    let codeGenerated = false
    let filesCount = 0

    // Route to appropriate agent based on whether stageType is provided
    if (stageType) {
      // Stage-specific workflow using WorkflowManager
      const workflowManager = new WorkflowManager()
      
      // Find or create the stage
      let stage = project.stages.find(s => s.type === stageType)
      if (!stage) {
        stage = await db.stage.create({
          data: {
            projectId: id,
            type: stageType,
            status: 'IN_PROGRESS',
            name: stageType.charAt(0).toUpperCase() + stageType.slice(1).toLowerCase()
          },
          include: {
            artifacts: true
          }
        })
      }

      // Check if this looks like a code generation request
      const looksLikeCodeRequest = /\b(generate|create|add|implement|build|write|code|function|endpoint|api|route|model|fix|update)\b/i.test(message)
      
      if (looksLikeCodeRequest) {
        try {
          const stageResult = await workflowManager.executeStage(project.id, stageType)
          if (stageResult && stageResult.artifacts) {
            filesCount = stageResult.artifacts.length
            codeGenerated = true
            assistantContent = `✅ Generated ${filesCount} artifacts for the ${stageType.toLowerCase()} stage: ${stageResult.artifacts.map((a: { name: string }) => a.name).join(', ')}`
          } else {
            assistantContent = `I understand your request for the ${stageType.toLowerCase()} stage, but no artifacts were generated.`
          }
        } catch (error) {
          console.error('Stage execution error:', error)
          assistantContent = `I understand your request, but I encountered an issue generating artifacts for the ${stageType.toLowerCase()} stage.`
        }
      } else {
        assistantContent = `I understand your request for the ${stageType.toLowerCase()} stage. How can I help you with this phase?`
      }
      
    } else {
      // General project-level chat using BackendAgent
      const agent = new BackendAgent()
      const response = await agent.processMessage(
        message.trim(),
        project.prompt,
        conversationText
      )

      assistantContent = response.message || ''
      
      // If code was generated, create artifacts in a development stage
      if (response.type === 'code_generation' && response.files) {
        // Update project status
        await db.project.update({
          where: { id: project.id },
          data: { status: 'generating' }
        })

        try {
          // Find or create a development stage for generated files
          let stage = project.stages.find(s => s.type === 'DEVELOPMENT')
          if (!stage) {
            stage = await db.stage.create({
              data: {
                projectId: project.id,
                type: 'DEVELOPMENT',
                status: 'IN_PROGRESS',
                name: 'Development'
              },
              include: {
                artifacts: true
              }
            })
          }

          // Delete old artifacts from this stage and create new ones
          await db.artifact.deleteMany({ 
            where: { 
              stageId: stage.id,
              type: 'file' // Only delete file-type artifacts, keep other artifacts
            } 
          })
          
          if (response.files.length > 0) {
            await db.artifact.createMany({
              data: response.files.map(f => ({
                stageId: stage.id,
                name: f.filename,
                content: f.content,
                language: f.language,
                type: 'file', // Mark as file type artifact
              }))
            })
          }

          // Update project status to completed
          await db.project.update({
            where: { id: project.id },
            data: { status: 'completed' }
          })

          filesCount = response.files.length
          codeGenerated = true
          assistantContent = `✅ ${response.message}\n\n🔄 The file viewer has been updated with ${filesCount} generated files. You should see them in the code panel on the right.`
          
        } catch (fileError) {
          console.error('Failed to save generated files:', fileError)
          await db.project.update({
            where: { id: project.id },
            data: { status: 'error' }
          })
          assistantContent = `❌ I generated the code but failed to save it. Please try again or use the Regenerate button.`
        }
      }
    }

    // Save assistant response
    const assistantMsg = await db.chatMessage.create({
      data: { 
        projectId: id, 
        role: 'assistant', 
        content: assistantContent.trim(),
        ...(stageType ? { stageType } : {})
      }
    })

    return NextResponse.json({ 
      messages: [userMsg, assistantMsg],
      codeGenerated,
      filesCount
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// STREAM: Server-Sent Events streaming chat endpoint
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const message: string = body.message
  const stageType: StageType | null = body.stageType || null
  
  if (!message || message.trim().length < 2) {
    return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  }

  try {
    // Create user message first
    const userMsg = await db.chatMessage.create({
      data: { 
        projectId: id, 
        role: 'user', 
        content: message.trim(),
        ...(stageType ? { stageType } : {})
      }
    })

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial user message
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'user_message',
            message: userMsg
          })}\n\n`))

          // Get conversation history
          const history = await db.chatMessage.findMany({
            where: { 
              projectId: id,
              ...(stageType ? { stageType } : {})
            },
            orderBy: { createdAt: 'asc' },
            take: 40
          })

          const conversationText = history
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n')

          let assistantContent = ''
          let codeGenerated = false
          let filesCount = 0

          // Send status update
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Processing your request...'
          })}\n\n`))

          // Route to appropriate agent based on whether stageType is provided
          if (stageType) {
            // Stage-specific workflow using WorkflowManager
            const workflowManager = new WorkflowManager()
            
            // Find or create the stage
            let stage = project.stages.find(s => s.type === stageType)
            if (!stage) {
              stage = await db.stage.create({
                data: {
                  projectId: id,
                  type: stageType,
                  status: 'IN_PROGRESS',
                  name: stageType.charAt(0).toUpperCase() + stageType.slice(1).toLowerCase()
                },
                include: {
                  artifacts: true
                }
              })
            }

            // Check if this looks like a code generation request
            const looksLikeCodeRequest = /\b(generate|create|add|implement|build|write|code|function|endpoint|api|route|model|fix|update)\b/i.test(message)
            
            if (looksLikeCodeRequest) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: 'status',
                message: `Generating artifacts for ${stageType.toLowerCase()} stage...`
              })}\n\n`))

              try {
                // Use streaming execution
                await workflowManager.executeStageStream(project.id, stageType, (chunk) => {
                  if (chunk.type === 'file_start') {
                    // Send file start event
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'file_start',
                      fileName: chunk.fileName,
                      fileType: chunk.fileType,
                      language: chunk.language
                    })}\n\n`))
                  } else if (chunk.type === 'file_chunk') {
                    // Send real-time content chunk
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'file_chunk',
                      content: chunk.content
                    })}\n\n`))
                  } else if (chunk.type === 'file_complete') {
                    // File generation completed
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'file_complete',
                      artifactId: chunk.artifactId,
                      message: chunk.message
                    })}\n\n`))
                    codeGenerated = true
                    filesCount = 1
                  } else if (chunk.type === 'status') {
                    // Status updates
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'status',
                      message: chunk.message
                    })}\n\n`))
                  }
                })

                if (codeGenerated) {
                  assistantContent = `✅ Generated ${filesCount} artifacts for the ${stageType.toLowerCase()} stage with real-time streaming!`
                } else {
                  assistantContent = `I understand your request for the ${stageType.toLowerCase()} stage, but no artifacts were generated.`
                }
              } catch (error) {
                console.error('Stage execution error:', error)
                assistantContent = `I understand your request, but I encountered an issue generating artifacts for the ${stageType.toLowerCase()} stage.`
              }
            } else {
              assistantContent = `I understand your request for the ${stageType.toLowerCase()} stage. How can I help you with this phase?`
            }
            
          } else {
            // General project-level chat using BackendAgent with streaming
            const agent = new BackendAgent()
            
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'status',
              message: 'Generating response...'
            })}\n\n`))

            // Stream the response from the agent
            await agent.processMessageStream(
              message.trim(),
              project.prompt,
              conversationText,
              (chunk) => {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                  type: 'chunk',
                  content: chunk
                })}\n\n`))
                assistantContent += chunk
              }
            )

            // Check if we need to generate code artifacts
            const response = await agent.processMessage(
              message.trim(),
              project.prompt,
              conversationText
            )

            if (response.type === 'code_generation' && response.files) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: 'status',
                message: 'Saving generated files...'
              })}\n\n`))

              // Update project status
              await db.project.update({
                where: { id: project.id },
                data: { status: 'generating' }
              })

              try {
                // Find or create a development stage for generated files
                let stage = project.stages.find(s => s.type === 'DEVELOPMENT')
                if (!stage) {
                  stage = await db.stage.create({
                    data: {
                      projectId: project.id,
                      type: 'DEVELOPMENT',
                      status: 'IN_PROGRESS',
                      name: 'Development'
                    },
                    include: {
                      artifacts: true
                    }
                  })
                }

                // Delete old artifacts from this stage and create new ones
                await db.artifact.deleteMany({ 
                  where: { 
                    stageId: stage.id,
                    type: 'file'
                  } 
                })
                
                if (response.files.length > 0) {
                  await db.artifact.createMany({
                    data: response.files.map(f => ({
                      stageId: stage.id,
                      name: f.filename,
                      content: f.content,
                      language: f.language,
                      type: 'file',
                    }))
                  })
                }

                // Update project status to completed
                await db.project.update({
                  where: { id: project.id },
                  data: { status: 'completed' }
                })

                filesCount = response.files.length
                codeGenerated = true
                assistantContent = `✅ ${response.message}\n\n🔄 The file viewer has been updated with ${filesCount} generated files. You should see them in the code panel on the right.`
                
              } catch (fileError) {
                console.error('Failed to save generated files:', fileError)
                await db.project.update({
                  where: { id: project.id },
                  data: { status: 'error' }
                })
                assistantContent = `❌ I generated the code but failed to save it. Please try again or use the Regenerate button.`
              }
            }
          }

          // Save assistant response to database
          const assistantMsg = await db.chatMessage.create({
            data: { 
              projectId: id, 
              role: 'assistant', 
              content: assistantContent.trim(),
              ...(stageType ? { stageType } : {})
            }
          })

          // Send final completion message
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'complete',
            message: assistantMsg,
            codeGenerated,
            filesCount
          })}\n\n`))

        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`))
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

  } catch (error) {
    console.error('Chat stream error:', error)
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
