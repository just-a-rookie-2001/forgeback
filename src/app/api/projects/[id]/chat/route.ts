import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

// GET: fetch chat history for a project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const messages = await db.chatMessage.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json({ messages })
}

// POST: send a user message and get assistant reply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const message: string = body.message
    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 })
    }

    // Persist user message
    const userMsg = await db.chatMessage.create({
      data: { projectId: id, role: 'user', content: message.trim() }
    })

    // Fetch last 20 messages for context
    const history = await db.chatMessage.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      take: 40
    })

  const systemInstruction = `You are an AI backend assistant helping refine and extend a generated backend project.
Project original prompt: "${project.prompt}".
STRICT RULES:
- NEVER output raw source code, code fences, or large multi-line code blocks.
- Do NOT use triple backticks.
- If asked for code, politely refuse and instruct the user to use the Regenerate button to apply code changes.
- Provide only high-level guidance, filenames, bullet points, architectural suggestions, or small single-line identifiers.
- Keep answers concise (<180 words).`

    const conversationText = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')

    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
      maxOutputTokens: 1024,
    })

    const prompt = `${systemInstruction}\n\nConversation so far:\n${conversationText}\n\nUSER: ${message}\nASSISTANT:`
    const result = await llm.invoke(prompt)
  const assistantText = typeof result.content === 'string'
      ? result.content
      : Array.isArray(result.content)
        ? result.content.map(p => {
            if (typeof p === 'string') return p
            if (typeof p === 'object' && p && 'text' in p) {
              const maybe: unknown = (p as Record<string, unknown>).text
              return typeof maybe === 'string' ? maybe : ''
            }
            return ''
          }).join('\n')
        : JSON.stringify(result.content)

  // Use index access to avoid type error before Prisma client is regenerated after migration
  const dynamicDb = db as unknown as Record<string, unknown>
  const chatModelUnknown = dynamicDb.chatMessage
    if (!chatModelUnknown || typeof chatModelUnknown !== 'object') {
      return NextResponse.json({ error: 'Chat model unavailable' }, { status: 500 })
    }
    const chatModel = chatModelUnknown as { create: (args: { data: { projectId: string; role: string; content: string } }) => Promise<{ id: string; projectId: string; role: string; content: string; createdAt: Date }> }
    const cleaned = assistantText
      .replace(/```[\s\S]*?```/g, '[Code omitted – use Regenerate to apply changes.]')
      .replace(/`{3,}/g, '')
      .slice(0, 4000)
    const sanitized = cleaned
      // remove lines that look like import/export or function declarations to avoid sneaky code
      .split('\n')
      .filter((line: string) => !/^(import |export |function |class |const |let |var ).{0,120}$/.test(line.trim()))
      .join('\n')

    const assistantMsg = await chatModel.create({
      data: { projectId: id, role: 'assistant', content: sanitized.trim() }
    })

    return NextResponse.json({ messages: [userMsg, assistantMsg] })
  } catch (e) {
    console.error('Chat error', e)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}