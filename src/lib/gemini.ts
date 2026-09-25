import { GoogleGenAI } from '@google/genai'

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface ExtractedCtf {
  name?: string
  ctfUrl?: string
  sourceUrl?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  registrationDeadline?: string
  teamSize?: number
  description?: string
  source?: 'UNSTOP' | 'CTFTIME' | 'MANUAL'
}

// Smart heuristic fallback if AI quota is busy
function extractHeuristics(text: string, sourceUrl?: string): ExtractedCtf {
  const result: ExtractedCtf = {
    source: sourceUrl?.includes('unstop.com') ? 'UNSTOP' : sourceUrl?.includes('ctftime.org') ? 'CTFTIME' : 'MANUAL',
    sourceUrl: sourceUrl || undefined,
    ctfUrl: sourceUrl || undefined,
  }

  // 1. Name heuristics
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length > 0) {
    result.name = lines[0].replace(/^["']|["']$/g, '').slice(0, 100)
  }

  // 2. Team size heuristic
  const teamMatch = text.match(/team\s*(?:size|of|members)?\s*[:=-]?\s*(\d+)/i) ||
                    text.match(/(\d+)\s*(?:members?|players?)\s*(?:per|in a)?\s*team/i) ||
                    text.match(/max(?:imum)?\s*team\s*size\s*[:=-]?\s*(\d+)/i)
  if (teamMatch) {
    const size = parseInt(teamMatch[1], 10)
    if (size >= 1 && size <= 100) result.teamSize = size
  }

  // 3. Date heuristics
  const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/g
  const datesFound = Array.from(text.matchAll(dateRegex)).map((m) => m[1])
  if (datesFound.length >= 2) {
    result.startDate = datesFound[0]
    result.endDate = datesFound[1]
  } else if (datesFound.length === 1) {
    result.startDate = datesFound[0]
    result.endDate = datesFound[0]
  } else {
    // Default to tomorrow 09:00 - 18:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    result.startDate = tomorrow.toISOString().split('T')[0]
    result.endDate = tomorrow.toISOString().split('T')[0]
  }

  result.startTime = '09:00'
  result.endTime = '18:00'
  result.description = text.slice(0, 1000)

  return result
}

export async function extractCtfDetails(text: string, sourceUrl?: string): Promise<ExtractedCtf> {
  const prompt = `You are an expert CTF & Hackathon metadata extractor.
Extract all competition details from the text below and return ONLY valid JSON without markdown formatting.

JSON keys:
- name: string (Competition title)
- ctfUrl: string (Portal/registration URL)
- startDate: string (YYYY-MM-DD)
- startTime: string (HH:MM in 24h, default "09:00")
- endDate: string (YYYY-MM-DD)
- endTime: string (HH:MM in 24h, default "18:00")
- registrationDeadline: string (ISO 8601 or YYYY-MM-DDTHH:MM, or null)
- teamSize: number (Allowed team size or integer, e.g. 6 or null)
- description: string (2-3 sentence overview)

Text:
${text.slice(0, 8000)}`

  try {
    const response = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      store: false,
    })

    const raw = response.output_text?.trim() ?? '{}'
    const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as ExtractedCtf

    if (sourceUrl) {
      parsed.sourceUrl = sourceUrl
      if (!parsed.ctfUrl) parsed.ctfUrl = sourceUrl
      parsed.source = sourceUrl.includes('unstop.com') ? 'UNSTOP' : sourceUrl.includes('ctftime.org') ? 'CTFTIME' : 'MANUAL'
    }

    // Ensure required fields exist
    if (!parsed.name && text) parsed.name = text.split('\n')[0].slice(0, 80)
    if (!parsed.startDate) parsed.startDate = new Date().toISOString().split('T')[0]
    if (!parsed.endDate) parsed.endDate = parsed.startDate
    if (!parsed.startTime) parsed.startTime = '09:00'
    if (!parsed.endTime) parsed.endTime = '18:00'

    return parsed
  } catch (error) {
    console.warn('Gemini AI fallback triggered:', error)
    return extractHeuristics(text, sourceUrl)
  }
}

export async function extractFromUrl(url: string): Promise<ExtractedCtf> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    const html = await res.text()

    // 1. Extract meta tags
    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<title>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)

    const title = titleMatch ? titleMatch[1].trim() : ''
    const desc = descMatch ? descMatch[1].trim() : ''

    // 2. Extract clean body text
    const textOnly = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const combinedContent = `${title}\n\n${desc}\n\n${textOnly.slice(0, 4000)}`

    return await extractCtfDetails(combinedContent, url)
  } catch (err) {
    console.error('extractFromUrl error:', err)
    return extractHeuristics(url, url)
  }
}
