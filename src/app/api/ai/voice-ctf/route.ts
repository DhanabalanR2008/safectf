import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractCtfFromVoice } from '@/lib/gemini'
import { z } from 'zod'

const voiceSchema = z.object({
  transcript: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = voiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const extracted = await extractCtfFromVoice(parsed.data.transcript)
    return NextResponse.json({ extracted })
  } catch (error) {
    console.error('POST /api/ai/voice-ctf error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
