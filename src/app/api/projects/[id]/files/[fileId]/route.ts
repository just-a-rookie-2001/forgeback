import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE: delete a file or artifact
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: projectId, fileId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // First verify the project belongs to the user
  const project = await db.project.findFirst({
    where: { 
      id: projectId, 
      userId: session.user.id 
    }
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    // Find and delete the artifact
    const artifact = await db.artifact.findFirst({
      where: { 
        id: fileId,
        stage: {
          projectId: projectId
        }
      }
    })

    if (artifact) {
      await db.artifact.delete({
        where: { id: fileId }
      })
      return NextResponse.json({ success: true, type: 'artifact' })
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: rename a file or artifact
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: projectId, fileId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { filename } = await req.json()
  
  if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  // First verify the project belongs to the user
  const project = await db.project.findFirst({
    where: { 
      id: projectId, 
      userId: session.user.id 
    }
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    // Find and rename the artifact
    const artifact = await db.artifact.findFirst({
      where: { 
        id: fileId,
        stage: {
          projectId: projectId
        }
      }
    })

    if (artifact) {
      const updatedArtifact = await db.artifact.update({
        where: { id: fileId },
        data: { name: filename.trim() }
      })
      return NextResponse.json({ success: true, type: 'artifact', artifact: updatedArtifact })
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  } catch (error) {
    console.error('Error renaming file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
