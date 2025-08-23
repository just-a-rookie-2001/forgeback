import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BackendAgent } from '@/lib/llm/agent'

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
    include: { files: true }
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const message: string = body.message
  if (!message || message.trim().length < 2) {
    return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  }

  try {
    // Create user message
    const userMsg = await db.chatMessage.create({
      data: { projectId: id, role: 'user', content: message.trim() }
    })

    // Get conversation history
    const history = await db.chatMessage.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      take: 40
    })

    const conversationText = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')

    // Use the smart agent to process the message
    const agent = new BackendAgent()
    const response = await agent.processMessage(
      message.trim(),
      project.prompt,
      conversationText
    )

    let assistantContent = response.message || ''
    
    // If code was generated, update the project files
    if (response.type === 'code_generation' && response.files) {
      // Update project status
      await db.project.update({
        where: { id: project.id },
        data: { status: 'generating' }
      })

      try {
        // Delete old files and create new ones
        await db.projectFile.deleteMany({ where: { projectId: project.id } })
        
        if (response.files.length > 0) {
          await db.projectFile.createMany({
            data: response.files.map(f => ({
              projectId: project.id,
              filename: f.filename,
              content: f.content,
              language: f.language,
              type: f.type,
            }))
          })
        }

        // Update project status to completed
        await db.project.update({
          where: { id: project.id },
          data: { status: 'completed' }
        })

        assistantContent = `✅ ${response.message}\n\n🔄 The file viewer has been updated with ${response.files.length} generated files. You should see them in the code panel on the right.`
        
      } catch (fileError) {
        console.error('Failed to save generated files:', fileError)
        await db.project.update({
          where: { id: project.id },
          data: { status: 'error' }
        })
        assistantContent = `❌ I generated the code but failed to save it. Please try again or use the Regenerate button.`
      }
    }

    // Save assistant response
    const assistantMsg = await db.chatMessage.create({
      data: { 
        projectId: id, 
        role: 'assistant', 
        content: assistantContent.trim() 
      }
    })

    return NextResponse.json({ 
      messages: [userMsg, assistantMsg],
      codeGenerated: response.type === 'code_generation',
      filesCount: response.files?.length || 0
    })

  } catch (error) {
    console.error('Smart chat error:', error)
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
