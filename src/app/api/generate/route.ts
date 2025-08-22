import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBackendCode } from '@/lib/llm/chains'
import { db } from '@/lib/db'
import { z } from 'zod'

const generateRequestSchema = z.object({
  prompt: z.string().min(10).max(3000), // Increased for Gemini's better context handling
  projectName: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting code generation request...')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = generateRequestSchema.safeParse(body)
    
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.issues)
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { prompt, projectName, description } = validation.data

    // Validate Gemini API key
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ GOOGLE_API_KEY not configured')
      return NextResponse.json({ 
        error: 'Google API key not configured' 
      }, { status: 500 })
    }

    console.log(`📝 Creating project: ${projectName}`)
    
    // Create project in database
    const project = await db.project.create({
      data: {
        name: projectName,
        description,
        prompt,
        status: 'generating',
        userId: session.user.id,
      }
    })

    console.log(`✅ Project created with ID: ${project.id}`)

    // Generate code using Gemini
    try {
      console.log('🤖 Calling Gemini for code generation...')
      const generatedFiles = await generateBackendCode(prompt)
      
      console.log(`📁 Generated ${generatedFiles.length} files`)
      
      // Save generated files
      if (generatedFiles.length > 0) {
        await db.projectFile.createMany({
          data: generatedFiles.map(file => ({
            projectId: project.id,
            filename: file.filename,
            content: file.content,
            language: file.language,
            type: file.type,
          }))
        })
        
        console.log('💾 Files saved to database')
      }

      // Update project status
      await db.project.update({
        where: { id: project.id },
        data: { status: 'completed' }
      })

      console.log('✅ Project generation completed successfully')

      return NextResponse.json({ 
        projectId: project.id,
        status: 'completed',
        files: generatedFiles 
      })

    } catch (error) {
      console.error('❌ Code generation error:', error)
      
      // Update project status to error
      await db.project.update({
        where: { id: project.id },
        data: { status: 'error' }
      })

      // Return more specific error messages for Gemini issues
      let errorMessage = 'Failed to generate code'
      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          errorMessage = 'Google API key configuration error'
        } else if (error.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please try again later.'
        } else if (error.message.includes('safety')) {
          errorMessage = 'Content was filtered. Please try rephrasing your request.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try a simpler prompt.'
        }
      }

      return NextResponse.json({ 
        error: errorMessage,
        projectId: project.id,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Generate API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}