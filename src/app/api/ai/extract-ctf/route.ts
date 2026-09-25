import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractCtfDetails } from '@/lib/gemini'
import { aiExtractSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = aiExtractSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const extracted = await extractCtfDetails(parsed.data.text)
    return NextResponse.json({ extracted })
  } catch (error) {
    console.error('POST /api/ai/extract-ctf error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
