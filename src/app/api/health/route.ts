// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export async function GET() {
  try {
    // Check if Google API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'Google API key not configured',
        gemini: false
      }, { status: 500 })
    }

    // Test Gemini connection
    const llm = new ChatGoogleGenerativeAI({
      modelName: 'gemini-pro',
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    })

    // Simple test prompt
    const result = await llm.invoke("Say 'Hello' if you can hear me.")
    
    return NextResponse.json({
      status: 'healthy',
      message: 'All systems operational',
      gemini: true,
      model: 'gemini-pro',
      response: result.content
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Gemini connection failed',
      gemini: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}