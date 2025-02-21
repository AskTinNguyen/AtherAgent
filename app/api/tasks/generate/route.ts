import { generateTaskFromNaturalLanguage } from '@/lib/services/task-generator'
import { DataStreamWriter } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  if (!prompt) {
    return new Response('Missing prompt', { status: 400 })
  }

  try {
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    // Create a DataStreamWriter instance
    const dataStreamWriter: DataStreamWriter = {
      write: (data: string) => {
        writer.write(encoder.encode(data))
      },
      writeData: (data: any) => {
        writer.write(encoder.encode(`2:${JSON.stringify(data)}\n`))
      },
      writeMessageAnnotation: (data: any) => {
        writer.write(encoder.encode(`1:${JSON.stringify(data)}\n`))
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error)
        writer.write(encoder.encode(`3:${JSON.stringify(errorMessage)}\n`))
        return errorMessage
      },
      merge: async (otherStream: ReadableStream) => {
        const reader = otherStream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
              writer.write(value)
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    }

    // Generate task details and stream the response
    generateTaskFromNaturalLanguage(prompt, dataStreamWriter).catch((error) => {
      console.error('Error in task generation:', error)
      dataStreamWriter.onError(error)
    }).finally(() => {
      writer.close()
    })

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in task generation route:', error)
    return new Response('Error generating task', { status: 500 })
  }
} 