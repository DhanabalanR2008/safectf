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

// Extract human-readable title from an Unstop or other URL slug
export function extractTitleFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr)
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    // For URLs like /hackathons/my-hackathon-name-123456 or /competitions/my-comp-123456
    const last = segments[segments.length - 1]
    if (last === 'o' || segments[0] === 'o') return null // short link code

    // Strip trailing numeric ID if any (e.g. -123456)
    const cleaned = last.replace(/-\d{4,}$/, '').replace(/[-_]+/g, ' ')
    if (cleaned.length < 3) return null

    // Title case
    return cleaned
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  } catch {
    return null
  }
}

// Smart heuristic fallback if AI quota is busy
function extractHeuristics(text: string, sourceUrl?: string): ExtractedCtf {
  const isUnstop = sourceUrl?.includes('unstop.com')
  const isCtftime = sourceUrl?.includes('ctftime.org')

  const result: ExtractedCtf = {
    source: isUnstop ? 'UNSTOP' : isCtftime ? 'CTFTIME' : 'MANUAL',
    sourceUrl: sourceUrl || undefined,
    ctfUrl: sourceUrl || undefined,
  }

  // 1. Name heuristics
  if (sourceUrl) {
    const slugTitle = extractTitleFromUrl(sourceUrl)
    if (slugTitle) result.name = slugTitle
  }

  if (!result.name) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => {
      return l.length > 0 && !l.toLowerCase().includes('unstop - competitions') && !l.toLowerCase().startsWith('http')
    })
    if (lines.length > 0) {
      result.name = lines[0].replace(/^["']|["']$/g, '').slice(0, 100)
    } else {
      result.name = isUnstop ? 'Unstop Competition' : isCtftime ? 'CTFtime Event' : 'New CTF'
    }
  }

  // 2. Team size heuristic
  const teamMatch =
    text.match(/team\s*(?:size|of|members)?\s*[:=-]?\s*(\d+)/i) ||
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
  result.description = text.length > 20 && !text.includes('Unstop - Competitions') ? text.slice(0, 1000) : ''

  return result
}

export async function extractCtfDetails(text: string, sourceUrl?: string): Promise<ExtractedCtf> {
  const isUnstop = sourceUrl?.includes('unstop.com')
  const isCtftime = sourceUrl?.includes('ctftime.org')
  const slugTitle = sourceUrl ? extractTitleFromUrl(sourceUrl) : null

  const prompt = `You are an expert CTF & Hackathon metadata extractor.
Extract all competition details from the provided content and return ONLY valid JSON without markdown formatting.

Guidelines:
- name: Competition title (e.g. "${slugTitle || 'CyberWar CTF 2026'}"). NEVER return generic site headers like "Unstop - Competitions" or "CTFtime.org".
- ctfUrl: Registration or competition portal URL if present
- startDate: Start date in YYYY-MM-DD format (convert any timezone to IST / UTC+5:30 if specified)
- startTime: Start time in HH:MM (24-hour format, default "09:00")
- endDate: End date in YYYY-MM-DD format
- endTime: End time in HH:MM (24-hour format, default "18:00")
- registrationDeadline: Registration deadline datetime in YYYY-MM-DDTHH:MM or null
- teamSize: Maximum allowed team size integer (e.g. 1 to 6) or null
- description: Concise 2-3 sentence overview or rules summary

Source URL: ${sourceUrl || 'N/A'}
Text Content:
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
      parsed.source = isUnstop ? 'UNSTOP' : isCtftime ? 'CTFTIME' : 'MANUAL'
    }

    // Sanitize generic names
    const isGenericName =
      !parsed.name ||
      parsed.name.toLowerCase().includes('unstop - competitions') ||
      parsed.name.toLowerCase().includes('competitions, quizzes') ||
      parsed.name.toLowerCase() === 'unstop' ||
      parsed.name.toLowerCase() === 'ctftime.org'

    if (isGenericName) {
      parsed.name = slugTitle || (isUnstop ? 'Unstop Competition' : isCtftime ? 'CTFtime Event' : 'New CTF')
    }

    if (!parsed.startDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      parsed.startDate = tomorrow.toISOString().split('T')[0]
    }
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

    // 1. Extract JSON-LD structured data if present
    let jsonLdContent = ''
    const jsonLdMatch = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatch) {
      jsonLdContent = jsonLdMatch.map((tag) => tag.replace(/<[^>]+>/g, '').trim()).join('\n')
    }

    // 2. Extract meta tags
    const titleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i)
    const descMatch =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)

    const title = titleMatch ? titleMatch[1].trim() : ''
    const desc = descMatch ? descMatch[1].trim() : ''

    // 3. Extract clean body text
    const textOnly = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const combinedContent = `${title}\n\n${desc}\n\n${jsonLdContent}\n\n${textOnly.slice(0, 4000)}`

    return await extractCtfDetails(combinedContent, url)
  } catch (err) {
    console.error('extractFromUrl error:', err)
    return extractHeuristics(url, url)
  }
}
