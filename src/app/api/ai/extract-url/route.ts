import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractFromUrl, extractHeuristics } from '@/lib/gemini'
import { z } from 'zod'

const urlExtractSchema = z.object({
  url: z.string().min(1, 'Please enter a URL'),
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

    let inputUrl = parsed.data.url.trim()
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = `https://${inputUrl}`
    }

    const extracted = await extractFromUrl(inputUrl)
    return NextResponse.json({ extracted })
  } catch (error) {
    console.error('POST /api/ai/extract-url error:', error)
    // Infallible fallback
    const fallback = extractHeuristics('', req.url)
    return NextResponse.json({ extracted: fallback })
  }
}
