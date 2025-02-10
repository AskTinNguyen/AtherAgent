import { ResearchAIProcessor } from '@/lib/ai/research-processor'
import { NextRequest, NextResponse } from 'next/server'

const aiProcessor = new ResearchAIProcessor()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { context } = body

    if (!context) {
      return NextResponse.json(
        { error: 'Missing research context' },
        { status: 400 }
      )
    }

    const suggestion = await aiProcessor.generateSuggestion(context)
    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Error generating suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const topic = searchParams.get('topic')

    if (!topic) {
      return NextResponse.json(
        { error: 'Missing topic parameter' },
        { status: 400 }
      )
    }

    const analysis = await aiProcessor.analyzeTopic(topic)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing topic:', error)
    return NextResponse.json(
      { error: 'Failed to analyze topic' },
      { status: 500 }
    )
  }
} 