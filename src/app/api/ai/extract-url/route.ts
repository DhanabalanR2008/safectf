import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractFromUrl } from '@/lib/gemini'
import { z } from 'zod'

const urlExtractSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = urlExtractSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid URL provided', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const extracted = await extractFromUrl(parsed.data.url)
    return NextResponse.json({ extracted })
  } catch (error) {
    console.error('POST /api/ai/extract-url error:', error)
    return NextResponse.json({ error: 'Failed to extract CTF details from URL' }, { status: 500 })
  }
}
