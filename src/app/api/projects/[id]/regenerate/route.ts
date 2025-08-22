import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateBackendCode } from '@/lib/llm/chains'

// Regenerate backend code for an existing project using the originally stored prompt.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await db.project.findFirst({
      where: { id, userId: session.user.id },
      include: { files: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.prompt) {
      return NextResponse.json({ error: 'Project has no original prompt' }, { status: 400 })
    }

    if (project.status === 'generating') {
      return NextResponse.json({ error: 'Generation already in progress' }, { status: 409 })
    }

    // Update status to generating
    await db.project.update({
      where: { id: project.id },
      data: { status: 'generating' }
    })

    try {
      const files = await generateBackendCode(project.prompt)

      // Replace existing files
      await db.projectFile.deleteMany({ where: { projectId: project.id } })
      if (files.length) {
        await db.projectFile.createMany({
          data: files.map(f => ({
            projectId: project.id,
            filename: f.filename,
            content: f.content,
            language: f.language,
            type: f.type,
          }))
        })
      }

      await db.project.update({
        where: { id: project.id },
        data: { status: 'completed' }
      })

      return NextResponse.json({
        projectId: project.id,
        status: 'completed',
        filesCount: files.length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      await db.project.update({
        where: { id: project.id },
        data: { status: 'error' }
      })
      return NextResponse.json({ error: message }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
